import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postPurchaseGrn } from "@/lib/posting";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId");
    const supplierId = searchParams.get("supplierId");
    const search = searchParams.get("search");

    const where: any = {};
    if (poId) where.poId = poId;
    if (supplierId) where.supplierId = supplierId;
    if (search) {
      where.OR = [
        { grnNumber: { contains: search } },
        { purchaseOrder: { poNumber: { contains: search } } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const grns = await prisma.goodsReceivedNote.findMany({
      where,
      orderBy: { receivedDate: "desc" },
      include: {
        supplier: true,
        purchaseOrder: true,
        items: true,
      },
    });

    return NextResponse.json({ grns });
  } catch (error: any) {
    console.error("Error fetching GRNs:", error);
    return NextResponse.json({ error: "Failed to fetch Goods Received Notes" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Storekeeper";

    const body = await request.json();
    const {
      poId,
      supplierId,
      receivedDate,
      notes,
      items, // array of { productId, itemCode, itemName, orderedQuantity, previouslyReceivedQty, newlyReceivedQty, condition, notes }
    } = body;

    if (!poId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Purchase Order ID and items are required" },
        { status: 400 }
      );
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: { items: true, supplier: true },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    // 1.6 GRN integrity: resolve missing productId by itemCode (or altItemCode/oemCode).
    // If no product exists, reject the line with a specific error!
    const resolvedItems = [];
    for (const item of items) {
      let resolvedProductId = item.productId;

      if (!resolvedProductId && item.itemCode) {
        const found = await prisma.product.findFirst({
          where: {
            OR: [
              { itemCode: item.itemCode },
              { altItemCode: item.itemCode },
              { oemCode: item.itemCode },
            ],
          },
        });

        if (found) {
          resolvedProductId = found.id;
        } else {
          return NextResponse.json(
            {
              error: `GRN validation failed: Unresolvable product for line item with itemCode "${item.itemCode}". Product must exist in catalog before receiving stock.`,
              itemCode: item.itemCode,
              itemName: item.itemName,
            },
            { status: 400 }
          );
        }
      }

      if (!resolvedProductId) {
        return NextResponse.json(
          {
            error: `GRN validation failed: Item "${item.itemName || "Unknown"}" has neither a valid productId nor an itemCode registered in the system.`,
          },
          { status: 400 }
        );
      }

      resolvedItems.push({
        ...item,
        productId: resolvedProductId,
      });
    }

    // Generate unique GRN Number: GRN-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.goodsReceivedNote.count();
    const grnNumber = `GRN-${year}-${String(count + 1).padStart(4, "0")}`;

    // 1.9 Wrap entire GRN flow (GRN, Items, StockMovements, currentStock increments, PO status update, Document, AuditLog) in prisma.$transaction
    const grn = await prisma.$transaction(async (tx) => {
      const grnItemsData = [];
      let allItemsFullyReceived = true;

      for (let i = 0; i < resolvedItems.length; i++) {
        const item = resolvedItems[i];
        const newlyReceived = parseFloat(item.newlyReceivedQty);
        const ordered = parseFloat(item.orderedQuantity) || 0;
        const prevReceived = parseFloat(item.previouslyReceivedQty) || 0;

        // Negative quantity validation
        if (isNaN(newlyReceived) || newlyReceived < 0) {
          throw new Error(`Line ${i + 1} (${item.itemCode}): newly received quantity cannot be negative`);
        }

        const totalAfterThis = prevReceived + newlyReceived;

        // Over-receipt protection: block receipts exceeding PO ordered quantity by > 5%
        const poItem = purchaseOrder.items.find(
          (pi) => pi.itemCode === item.itemCode || (item.productId && pi.productId === item.productId)
        );
        const maxPermitted = (poItem?.quantity || ordered) * 1.05;

        if (totalAfterThis > maxPermitted && poItem) {
          throw new Error(
            `Over-receipt rejected: Total cumulative received (${totalAfterThis}) for item ${item.itemCode} exceeds ordered quantity (${poItem.quantity}) beyond 5% tolerance.`
          );
        }

        const pending = Math.max(0, ordered - totalAfterThis);

        if (totalAfterThis < ordered) {
          allItemsFullyReceived = false;
        }

        grnItemsData.push({
          productId: item.productId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          orderedQuantity: ordered,
          previouslyReceivedQty: prevReceived,
          newlyReceivedQty: newlyReceived,
          pendingQty: pending,
          condition: item.condition || "Good",
          notes: item.notes || null,
        });

        // Update PO item received quantity in DB atomically
        const targetPoItem = purchaseOrder.items.find(
          (pi) => pi.itemCode === item.itemCode || (item.productId && pi.productId === item.productId)
        );

        if (targetPoItem && newlyReceived > 0) {
          await tx.purchaseOrderItem.update({
            where: { id: targetPoItem.id },
            data: {
              receivedQty: targetPoItem.receivedQty + newlyReceived,
            },
          });
        }
      }

      // Create GoodsReceivedNote record
      const createdGrn = await tx.goodsReceivedNote.create({
        data: {
          grnNumber,
          poId,
          supplierId: supplierId || purchaseOrder.supplierId,
          receivedDate: receivedDate ? new Date(receivedDate) : new Date(),
          receivedBy: actorName,
          notes,
          status: "CONFIRMED",
          items: {
            create: grnItemsData,
          },
        },
        include: {
          supplier: true,
          purchaseOrder: true,
          items: true,
        },
      });

      // Update Purchase Order Status
      const newPoStatus = allItemsFullyReceived ? "FULLY_RECEIVED" : "PARTIALLY_RECEIVED";
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: { status: newPoStatus },
      });

      // Create Document record
      await tx.document.create({
        data: {
          title: `Goods Received Note - ${grnNumber}`,
          docType: "GRN",
          fileUrl: `/documents/grn/${grnNumber}.pdf`,
          fileSize: "320 KB",
          mimeType: "application/pdf",
          supplierId: createdGrn.supplierId,
          poId,
          grnId: createdGrn.id,
          uploadedBy: actorName,
        },
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          employeeName: actorName,
          module: "Goods Received",
          transactionNumber: grnNumber,
          action: "CONFIRM_GRN",
          updatedValue: `Received delivery for ${purchaseOrder.poNumber} (${newPoStatus}). Items updated in inventory.`,
        },
      });

      // In-app Notification
      await tx.notification.create({
        data: {
          title: "Goods Received (GRN)",
          message: `${grnNumber} confirmed for ${purchaseOrder.poNumber}. Status updated to ${newPoStatus.replace("_", " ")}.`,
          type: "SUCCESS",
          linkUrl: `/grn/${createdGrn.id}`,
        },
      });

      // 1.6 & 1.9 Write StockMovement + stock increment for every line with newlyReceivedQty > 0
      for (const item of createdGrn.items) {
        if (item.newlyReceivedQty > 0 && item.productId) {
          const poUnitPrice = (purchaseOrder.items.find((pi: any) => pi.itemCode === item.itemCode)?.unitPrice) || 0;
          const totalCostFils = Math.round(item.newlyReceivedQty * poUnitPrice);

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              itemCode: item.itemCode,
              movementType: "GOODS_RECEIVED",
              quantity: item.newlyReceivedQty,
              unitCost: poUnitPrice,
              totalCost: totalCostFils,
              referenceNumber: createdGrn.grnNumber,
              responsibleEmployee: actorName,
              notes: `GRN ${createdGrn.grnNumber}: received from PO ${purchaseOrder.poNumber}`,
            },
          });

          await tx.product.update({
            where: { id: item.productId },
            data: {
              currentStock: { increment: item.newlyReceivedQty },
            },
          });
        }
      }

      // Post double-entry journal inside transaction
      try {
        const grnItemsWithPrices = createdGrn.items.map((i: any) => ({
          quantity: i.newlyReceivedQty,
          unitPrice: (purchaseOrder.items.find((pi: any) => pi.itemCode === i.itemCode)?.unitPrice) || 0,
        }));
        await postPurchaseGrn(tx, { grn: createdGrn, po: purchaseOrder, items: grnItemsWithPrices });
      } catch (e) {
        console.warn("GRN journal posting notice:", e);
      }

      return createdGrn;
    });

    return NextResponse.json({ grn }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating GRN:", error);
    return NextResponse.json({ error: error.message || "Failed to create Goods Received Note" }, { status: 500 });
  }
}
