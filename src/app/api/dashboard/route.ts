import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    // Date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Purchase Orders Stats
    const [monthlyPOs, yearlyPOs, pendingPOs, approvedPOs] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where: { orderDate: { gte: startOfMonth }, status: { not: "CANCELLED" } },
        include: { supplier: true },
      }),
      prisma.purchaseOrder.findMany({
        where: { orderDate: { gte: startOfYear }, status: { not: "CANCELLED" } },
      }),
      prisma.purchaseOrder.count({ where: { status: "PENDING_APPROVAL" } }),
      prisma.purchaseOrder.count({ where: { status: "APPROVED" } }),
    ]);

    const monthlyPOSpend = Math.round(
      monthlyPOs.reduce((sum, po) => sum + (po.grandTotal / 100) * (po.exchangeRate || 1), 0) * 100
    ) / 100;
    const yearlyPOSpend = Math.round(
      yearlyPOs.reduce((sum, po) => sum + (po.grandTotal / 100) * (po.exchangeRate || 1), 0) * 100
    ) / 100;

    // Goods Received Stats - include items to calculate totals
    const [monthlyGRNs, yearlyGRNs] = await Promise.all([
      prisma.goodsReceivedNote.findMany({
        where: { receivedDate: { gte: startOfMonth }, status: { not: "CANCELLED" } },
        include: { items: true, purchaseOrder: { include: { items: true } } },
      }),
      prisma.goodsReceivedNote.findMany({
        where: { receivedDate: { gte: startOfYear }, status: { not: "CANCELLED" } },
        include: { items: true, purchaseOrder: { include: { items: true } } },
      }),
    ]);

    // Calculate GRN values from items using PO item prices converted to AED
    const getPoItemPrice = (po: any, itemCode: string) => {
      const poItem = po.items.find((i: any) => i.itemCode === itemCode);
      return poItem ? poItem.unitPrice : 0;
    };

    const monthlyGRNValue = Math.round(
      monthlyGRNs.reduce((sum, grn) => {
        const rate = grn.purchaseOrder?.exchangeRate || 1.0;
        return sum + grn.items.reduce((itemSum, item) => {
          const price = getPoItemPrice(grn.purchaseOrder, item.itemCode);
          return itemSum + (item.newlyReceivedQty * (price / 100) * rate);
        }, 0);
      }, 0) * 100
    ) / 100;
    const yearlyGRNValue = Math.round(
      yearlyGRNs.reduce((sum, grn) => {
        const rate = grn.purchaseOrder?.exchangeRate || 1.0;
        return sum + grn.items.reduce((itemSum, item) => {
          const price = getPoItemPrice(grn.purchaseOrder, item.itemCode);
          return itemSum + (item.newlyReceivedQty * (price / 100) * rate);
        }, 0);
      }, 0) * 100
    ) / 100;

    // Invoice & Payment Stats
    const [allUnpaidInvoices, overdueInvoices, pendingPayments, completedPayments] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where: { status: { notIn: ["PAID", "CANCELLED"] } },
      }),
      prisma.purchaseInvoice.findMany({
        where: {
          status: { notIn: ["PAID", "CANCELLED"] },
          dueDate: { lt: now },
        },
        include: { payments: { where: { status: "APPROVED" } } },
      }),
      prisma.payment.findMany({
        where: { paymentDate: { gte: last30Days }, status: "APPROVED" },
      }),
      prisma.payment.findMany({
        where: { paymentDate: { gte: startOfYear }, status: "APPROVED" },
      }),
    ]);

    const unpaidInvoiceValue = Math.round(
      allUnpaidInvoices.reduce((sum, inv) => sum + (inv.grandTotal / 100) * (inv.exchangeRate || 1), 0) * 100
    ) / 100;
    const monthlyPayments = Math.round(
      pendingPayments.reduce((sum, p) => sum + (p.amount / 100) * (p.exchangeRate || 1), 0) * 100
    ) / 100;
    const yearlyPayments = Math.round(
      completedPayments.reduce((sum, p) => sum + (p.amount / 100) * (p.exchangeRate || 1), 0) * 100
    ) / 100;
    const overdueAmount = Math.round(
      overdueInvoices.reduce((sum, inv) => {
        const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
        const rem = Math.max(0, inv.grandTotal - paid);
        return sum + (rem / 100) * (inv.exchangeRate || 1);
      }, 0) * 100
    ) / 100;

    // Inventory Stats
    const [totalProducts, lowStockProducts, outOfStockProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({
        where: {
          OR: [
            { currentStock: { lte: prisma.product.fields.reorderLevel } },
            { currentStock: { lte: 10 } },
          ],
        },
      }),
      prisma.product.count({
        where: { currentStock: 0 },
      }),
    ]);

    // Get products with low stock manually for accuracy
    const allProducts = await prisma.product.findMany({
      select: { id: true, currentStock: true, reorderLevel: true },
    });
    const lowStockCount = allProducts.filter(p => p.currentStock <= (p.reorderLevel || 10) && p.currentStock > 0).length;
    const outOfStockCount = allProducts.filter(p => p.currentStock === 0).length;

    // Calculate inventory value from products
    const productsForValue = await prisma.product.findMany({
      select: { currentStock: true, defaultPurchasePrice: true },
    });
    const inventoryValue = productsForValue.reduce((sum, p) => sum + (p.currentStock * p.defaultPurchasePrice), 0);

    // Supplier Stats
    const [totalSuppliers, activeSuppliers] = await Promise.all([
      prisma.supplier.count(),
      prisma.supplier.count({ where: { status: "ACTIVE" } }),
    ]);

    // Shipment Stats
    const [inTransitShipments, pendingCustoms] = await Promise.all([
      prisma.shipment.count({ where: { status: "IN_TRANSIT" } }),
      prisma.shipment.count({ where: { status: "CUSTOMS_CLEARANCE" } }),
    ]);

    // Purchase Returns
    const pendingReturns = await prisma.purchaseReturn.count({ where: { status: "PENDING" } });

    // Monthly trend data (last 6 months)
    const monthlyTrends = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const pos = await prisma.purchaseOrder.findMany({
        where: {
          orderDate: { gte: monthStart, lte: monthEnd },
        },
      });

      const grns = await prisma.goodsReceivedNote.findMany({
        where: {
          receivedDate: { gte: monthStart, lte: monthEnd },
        },
        include: { items: true, purchaseOrder: { include: { items: true } } },
      });

      const getPoItemPrice = (po: any, itemCode: string) => {
        const poItem = po.items.find((i: any) => i.itemCode === itemCode);
        return poItem ? poItem.unitPrice : 0;
      };

      monthlyTrends.push({
        month: monthStart.toLocaleString("default", { month: "short" }),
        poCount: pos.length,
        poValue: Math.round(pos.reduce((sum, po) => sum + (po.grandTotal / 100) * (po.exchangeRate || 1), 0) * 100) / 100,
        grnCount: grns.length,
        grnValue: Math.round(grns.reduce((sum, grn) => {
          const rate = grn.purchaseOrder?.exchangeRate || 1.0;
          return sum + grn.items.reduce((itemSum, item) => {
            const price = getPoItemPrice(grn.purchaseOrder, item.itemCode);
            return itemSum + (item.newlyReceivedQty * (price / 100) * rate);
          }, 0);
        }, 0) * 100) / 100,
      });
    }

    // Top Suppliers by PO Value
    const supplierPOs = await prisma.purchaseOrder.groupBy({
      by: ["supplierId"],
      where: { orderDate: { gte: startOfYear } },
      _sum: { grandTotal: true },
      orderBy: { _sum: { grandTotal: "desc" } },
      take: 5,
    });

    const topSuppliers = await Promise.all(
      supplierPOs.map(async (s) => {
        const supplier = await prisma.supplier.findUnique({ where: { id: s.supplierId } });
        return {
          id: s.supplierId,
          name: supplier?.name || "Unknown",
          totalPOValue: s._sum.grandTotal,
        };
      })
    );

    // Category breakdown - need to fetch products and group manually
    const products = await prisma.product.findMany({
      select: { category: true, currentStock: true, defaultPurchasePrice: true },
    });

    const categoryProducts = products.reduce((acc, p) => {
      const cat = p.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
      acc[cat].count += 1;
      acc[cat].value += p.currentStock * p.defaultPurchasePrice;
      return acc;
    }, {} as Record<string, { count: number; value: number }>);

    const categoryBreakdown = Object.entries(categoryProducts).map(([cat, data]) => ({
      category: cat,
      productCount: data.count,
      value: data.value,
    }));

    return NextResponse.json({
      kpis: {
        monthlyPOSpend,
        yearlyPOSpend,
        monthlyGRNValue,
        yearlyGRNValue,
        monthlyPayments,
        yearlyPayments,
        totalProducts,
        lowStockCount: lowStockCount,
        outOfStockCount,
        inventoryValue: inventoryValue,
        totalSuppliers,
        activeSuppliers,
        pendingPOs,
        approvedPOs,
        inTransitShipments,
        pendingCustoms,
        pendingReturns,
        unpaidInvoiceValue,
        overdueAmount,
      },
      monthlyTrends,
      topSuppliers,
      categoryBreakdown: categoryBreakdown,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}