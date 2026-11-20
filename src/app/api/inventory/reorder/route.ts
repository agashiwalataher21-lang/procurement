import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const [products, activeSuppliers] = await Promise.all([
      prisma.product.findMany({
        where: { status: "ACTIVE" },
        include: {
          poItems: {
            include: { purchaseOrder: true },
          },
          salesItems: {
            include: { salesInvoice: true },
          },
        },
      }),
      prisma.supplier.findMany({ where: { status: "ACTIVE" } }),
    ]);

    const defaultSupplier = activeSuppliers[0] || null;

    // Calculate demand, incoming stock, and smart reorder points per product
    const reorderItems = products.map((product) => {
      // 1. Incoming stock from confirmed/open Purchase Orders (not yet received)
      const incomingQty = product.poItems.reduce((sum, item) => {
        if (
          ["PENDING_APPROVAL", "APPROVED", "PARTIALLY_RECEIVED"].includes(
            item.purchaseOrder.status
          )
        ) {
          return sum + Math.max(0, item.quantity - item.receivedQty);
        }
        return sum;
      }, 0);

      // 2. Sales demand from active customer sales invoices (unfulfilled / issued)
      const salesDemandQty = product.salesItems.reduce((sum, item) => {
        if (["ISSUED", "PARTIALLY_PAID"].includes(item.salesInvoice.status)) {
          return sum + item.quantity;
        }
        return sum;
      }, 0);

      const projectedStock = product.currentStock + incomingQty - salesDemandQty;
      const reorderPoint = product.reorderLevel || 25;
      const safetyStock = product.safetyStock || 15;
      const maxStock = product.maxStock || 100;
      const leadTime = product.supplierLeadTime || 14;

      // Trigger reorder if current projected stock is at or below reorder level OR pending sales demand exceeds available
      const isBelowReorder = projectedStock <= reorderPoint || (product.currentStock < salesDemandQty);

      // Suggested quantity brings stock back up to maxStock + covers committed sales demand
      const deficit = Math.max(0, (maxStock + salesDemandQty) - (product.currentStock + incomingQty));
      const suggestedQty = isBelowReorder ? Math.max(1, Math.round(deficit)) : 0;

      // Resolve preferred supplier
      const preferredSup = activeSuppliers.find((s) => s.id === product.preferredSupplierId) || defaultSupplier;

      return {
        id: product.id,
        itemCode: product.itemCode,
        itemName: product.itemName,
        brand: product.brand,
        category: product.category,
        currentStock: product.currentStock,
        incomingQty,
        salesDemandQty,
        projectedStock,
        reorderPoint,
        safetyStock,
        maxStock,
        leadTime,
        defaultPurchasePrice: product.defaultPurchasePrice, // In fils
        currency: product.currency,
        isBelowReorder,
        suggestedQty,
        preferredSupplierId: preferredSup?.id || null,
        preferredSupplierName: preferredSup?.name || "Unassigned",
      };
    });

    const filtered = reorderItems.filter((item) => item.isBelowReorder);

    return NextResponse.json({ reorderItems: filtered, allItems: reorderItems });
  } catch (error: any) {
    console.error("Error fetching reorder stock:", error);
    return NextResponse.json({ error: "Failed to fetch reorder stock data" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const creatorName = user?.name || "Inventory Manager";

    const body = await request.json();
    const { items } = body; // Array of { productId, suggestedQty, supplierId }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "No items selected for PO generation" }, { status: 400 });
    }

    const defaultSupplier = await prisma.supplier.findFirst({ where: { status: "ACTIVE" } });

    // Group items by supplierId
    const supplierGroups: { [supplierId: string]: any[] } = {};

    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) continue;

      let supId = item.supplierId || product.preferredSupplierId || defaultSupplier?.id;
      if (!supId) continue;

      if (!supplierGroups[supId]) {
        supplierGroups[supId] = [];
      }

      const qty = parseFloat(item.suggestedQty) || 10;
      const unitPriceFils = product.defaultPurchasePrice || 10000; // In fils
      const totalFils = Math.round(qty * unitPriceFils);

      supplierGroups[supId].push({
        productId: product.id,
        itemCode: product.itemCode,
        itemName: product.itemName,
        quantity: qty,
        unitPrice: unitPriceFils,
        total: totalFils,
      });
    }

    const createdPOs = [];

    // Wrap multi-PO creation inside transaction
    await prisma.$transaction(async (tx) => {
      for (const [supId, poItems] of Object.entries(supplierGroups)) {
        const count = await tx.purchaseOrder.count();
        const poNumber = `PO-ORD-${new Date().getFullYear()}-${String(count + 1 + createdPOs.length).padStart(3, "0")}`;

        const subtotalFils = poItems.reduce((sum, i) => sum + i.total, 0);
        const vatAmountFils = Math.round((subtotalFils * 5) / 100);
        const grandTotalFils = subtotalFils + vatAmountFils;

        const newPo = await tx.purchaseOrder.create({
          data: {
            poNumber,
            supplierId: supId,
            orderDate: new Date(),
            expectedDeliveryDate: new Date(Date.now() + 14 * 86400000),
            status: "DRAFT",
            subtotal: subtotalFils,
            vatAmount: vatAmountFils,
            grandTotal: grandTotalFils,
            notes: "Auto-generated from Stock Reorder Recommendation Engine based on sales demand.",
            createdBy: creatorName,
            items: {
              create: poItems.map((i) => ({
                productId: i.productId,
                itemCode: i.itemCode,
                itemName: i.itemName,
                quantity: i.quantity,
                unitPrice: i.unitPrice,
                total: i.total,
              })),
            },
          },
          include: {
            supplier: true,
            items: true,
          },
        });

        // Audit Log
        await tx.auditLog.create({
          data: {
            employeeName: creatorName,
            module: "Reorder Engine",
            transactionNumber: poNumber,
            action: "AUTO_GENERATE_DRAFT_PO",
            updatedValue: `Generated Draft PO ${poNumber} for ${newPo.supplier.name} containing ${poItems.length} line items. Total: ${(grandTotalFils / 100).toFixed(2)} AED`,
          },
        });

        createdPOs.push(newPo);
      }
    });

    return NextResponse.json({ success: true, createdPOs });
  } catch (error: any) {
    console.error("Error generating Draft POs:", error);
    return NextResponse.json({ error: error.message || "Failed to generate Draft POs" }, { status: 500 });
  }
}
