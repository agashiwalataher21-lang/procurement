import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const poId = searchParams.get("poId");

    const where: any = {};
    if (supplierId) where.supplierId = supplierId;
    if (poId) where.poId = poId;

    const returns = await prisma.purchaseReturn.findMany({
      where,
      orderBy: { returnDate: "desc" },
      include: {
        supplier: true,
        purchaseOrder: true,
        grn: true,
        items: true,
      },
    });

    return NextResponse.json({ returns });
  } catch (error: any) {
    console.error("Error fetching returns:", error);
    return NextResponse.json({ error: "Failed to fetch returns" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Purchase Manager";

    const body = await request.json();
    const { supplierId, poId, grnId, reason, items, notes, expectedCreditNote = 0 } = body;

    const count = await prisma.purchaseReturn.count();
    const returnNumber = `RET-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const expectedCreditFils = Money.toFils(expectedCreditNote);

    // Validate line items
    if (items && Array.isArray(items)) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const q = parseFloat(item.quantity);
        const p = parseFloat(item.unitPrice || 0);
        if (isNaN(q) || q <= 0) {
          return NextResponse.json({ error: `Line ${i + 1} (${item.itemCode || "Item"}): return quantity must be greater than 0` }, { status: 400 });
        }
        if (isNaN(p) || p < 0) {
          return NextResponse.json({ error: `Line ${i + 1} (${item.itemCode || "Item"}): unit price cannot be negative` }, { status: 400 });
        }
      }
    }

    // 1.9 Wrap entire return creation and stock decrements inside prisma.$transaction
    const purchaseReturn = await prisma.$transaction(async (tx) => {
      const retItemsData = items
        ? items.map((item: any) => {
            const unitPriceFils = Money.toFils(item.unitPrice || 0);
            const qty = parseFloat(item.quantity);
            return {
              productId: item.productId || null,
              itemCode: item.itemCode,
              itemName: item.itemName,
              returnedQuantity: qty,
              unitPrice: unitPriceFils,
              totalAmount: Math.round(qty * unitPriceFils),
              reason: item.reason || null,
            };
          })
        : undefined;

      const ret = await tx.purchaseReturn.create({
        data: {
          returnNumber,
          supplierId,
          poId: poId || null,
          grnId: grnId || null,
          reason: reason || "Returned to supplier",
          expectedCreditNote: expectedCreditFils,
          actualCreditNote: 0,
          remainingCreditBalance: expectedCreditFils,
          responsibleEmployee: actorName,
          status: "CONFIRMED",
          notes: notes || null,
          items: retItemsData ? { create: retItemsData } : undefined,
        },
        include: {
          supplier: true,
          items: true,
        },
      });

      // Update product currentStock and record StockMovement for returns
      if (items) {
        for (const item of items) {
          if (item.productId) {
            const qty = parseFloat(item.quantity) || 0;
            const unitPriceFils = Money.toFils(item.unitPrice || 0);

            await tx.product.update({
              where: { id: item.productId },
              data: {
                currentStock: { decrement: qty },
              },
            });

            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                itemCode: item.itemCode,
                movementType: "SUPPLIER_RETURN",
                quantity: -qty,
                unitCost: unitPriceFils,
                totalCost: Math.round(-qty * unitPriceFils),
                referenceNumber: returnNumber,
                responsibleEmployee: actorName,
                notes: `Return ${returnNumber}: ${reason || "Goods returned to supplier"}`,
              },
            });
          }
        }
      }

      await tx.auditLog.create({
        data: {
          employeeName: actorName,
          module: "Purchase Returns",
          transactionNumber: returnNumber,
          action: "CREATE_PURCHASE_RETURN",
          updatedValue: `Created purchase return ${returnNumber} with expected credit of ${(expectedCreditFils / 100).toFixed(2)} AED`,
        },
      });

      return ret;
    });

    return NextResponse.json({ purchaseReturn }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating purchase return:", error);
    return NextResponse.json({ error: error.message || "Failed to create return" }, { status: 500 });
  }
}
