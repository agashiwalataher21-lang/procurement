import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/items/:item_id/purchase-history
 *
 * Returns contextual purchase data for the PO / PI line-item context panel:
 *  - lastPurchaseRate / lastOrderedOn / lastVendorName (most recent approved bill)
 *  - currentStock (physical on-hand, Product.currentStock)
 *  - history[5] — last invoice lines + PO lines blended, newest first
 *
 * SQL equivalent — see scripts/ensure-purchase-history-indexes.sql
 */
export async function GET(
  _request: Request,
  { params }: { params: { item_id: string } }
) {
  try {
    const productId = params.item_id;
    if (!productId) {
      return NextResponse.json({ error: "item_id is required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        itemCode: true,
        itemName: true,
        currentStock: true,
        minStock: true,
        reorderLevel: true,
        defaultPurchasePrice: true,
        currency: true,
        unitOfMeasurement: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    // (1)-(3) Last purchase rate / date / vendor — most recent approved/paid invoice line.
    const lastInvoiceItem = await prisma.invoiceItem.findFirst({
      where: {
        productId,
        purchaseInvoice: {
          status: { in: ["CONFIRMED", "PAID", "PARTIALLY_PAID"] },
        },
      },
      include: {
        purchaseInvoice: {
          include: { supplier: { select: { id: true, name: true } } },
        },
      },
      orderBy: { purchaseInvoice: { invoiceDate: "desc" } },
    });

    // (5) Quick history — last 5 invoice lines (newest first)
    const invoiceHistory = await prisma.invoiceItem.findMany({
      where: {
        productId,
        purchaseInvoice: { status: { not: "CANCELLED" } },
      },
      include: {
        purchaseInvoice: {
          select: {
            invoiceNumber: true,
            invoiceDate: true,
            status: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { purchaseInvoice: { invoiceDate: "desc" } },
      take: 5,
    });

    // (5b) Quick history — last 5 PO lines (non-cancelled / non-draft)
    const poHistory = await prisma.purchaseOrderItem.findMany({
      where: {
        productId,
        purchaseOrder: { status: { notIn: ["CANCELLED", "DRAFT"] } },
      },
      include: {
        purchaseOrder: {
          select: {
            poNumber: true,
            orderDate: true,
            status: true,
            supplier: { select: { name: true } },
          },
        },
      },
      orderBy: { purchaseOrder: { orderDate: "desc" } },
      take: 5,
    });

    const history = [
      ...invoiceHistory.map((r) => ({
        date: r.purchaseInvoice.invoiceDate,
        documentNumber: r.purchaseInvoice.invoiceNumber,
        vendor: r.purchaseInvoice.supplier?.name || "-",
        quantity: r.quantity,
        unitCost: r.unitPrice,
        status: r.purchaseInvoice.status,
        sourceType: "INVOICE" as const,
      })),
      ...poHistory.map((r) => ({
        date: r.purchaseOrder.orderDate,
        documentNumber: r.purchaseOrder.poNumber,
        vendor: r.purchaseOrder.supplier?.name || "-",
        quantity: r.quantity,
        unitCost: r.unitPrice,
        status: r.purchaseOrder.status,
        sourceType: "PO" as const,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5)
      .map((r) => ({ ...r, date: new Date(r.date).toISOString().slice(0, 10) }));

    const last = lastInvoiceItem
      ? {
          rate: lastInvoiceItem.unitPrice,
          date: lastInvoiceItem.purchaseInvoice.invoiceDate.toISOString().slice(0, 10),
          vendor: lastInvoiceItem.purchaseInvoice.supplier?.name || "-",
          documentNumber: lastInvoiceItem.purchaseInvoice.invoiceNumber,
        }
      : history[0]
        ? {
            rate: history[0].unitCost,
            date: history[0].date,
            vendor: history[0].vendor,
            documentNumber: history[0].documentNumber,
          }
        : null;

    return NextResponse.json({
      item: product,
      summary: {
        lastPurchaseRate: last?.rate ?? null,
        lastOrderedOn: last?.date ?? null,
        lastVendorName: last?.vendor ?? null,
        lastDocumentNumber: last?.documentNumber ?? null,
        totalStockOnHand: product.currentStock,
      },
      history,
    });
  } catch (error) {
    console.error("Error fetching purchase history:", error);
    return NextResponse.json(
      { error: "Failed to fetch purchase history" },
      { status: 500 }
    );
  }
}
