import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId");

    if (!poId) {
      // Return summary of all POs with matching status
      const pos = await prisma.purchaseOrder.findMany({
        where: {
          status: { in: ["APPROVED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED"] },
        },
        include: {
          supplier: true,
          items: { include: { product: true } },
          grns: { include: { items: true } },
          invoices: { include: { items: true } },
          payments: true,
        },
        orderBy: { orderDate: "desc" },
        take: 50,
      });

      const matchingData = pos.map((po) => {
        const grnItems = po.grns.flatMap((g) => g.items);
        const invoiceItems = po.invoices.flatMap((i) => i.items);

        const matchedItems = po.items.filter((item) => {
          const grnReceived = grnItems
            .filter((gi) => gi.itemCode === item.itemCode)
            .reduce((sum, gi) => sum + gi.newlyReceivedQty, 0);
          const invBilled = invoiceItems
            .filter((ii) => ii.itemCode === item.itemCode)
            .reduce((sum, ii) => sum + ii.quantity, 0);
          return grnReceived > 0 && invBilled > 0;
        });

        return {
          poId: po.id,
          poNumber: po.poNumber,
          supplierName: po.supplier.name,
          orderDate: po.orderDate,
          grandTotal: po.grandTotal,
          status: po.status,
          itemsCount: po.items.length,
          matchedItemsCount: matchedItems.length,
          isFullyMatched:
            po.grns.length > 0 &&
            po.invoices.length > 0 &&
            matchedItems.length === po.items.length &&
            po.payments.length > 0,
          hasDiscrepancies: false, // To be calculated
        };
      });

      return NextResponse.json({ matchingData });
    }

    // Detailed three-way matching for specific PO
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        supplier: true,
        items: { include: { product: true } },
        grns: { include: { items: true } },
        invoices: { include: { items: true } },
        payments: true,
      },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    // Build line-by-line comparison
    const comparisonLines = po.items.map((item) => {
      const grnReceived = po.grns
        .flatMap((g) => g.items)
        .filter((gi) => gi.itemCode === item.itemCode)
        .reduce((sum, gi) => sum + gi.newlyReceivedQty, 0);

      const invoiceBilled = po.invoices
        .flatMap((i) => i.items)
        .filter((ii) => ii.itemCode === item.itemCode)
        .reduce((sum, ii) => sum + ii.quantity, 0);

      const invoiceAmount = po.invoices
        .flatMap((i) => i.items)
        .filter((ii) => ii.itemCode === item.itemCode)
        .reduce((sum, ii) => sum + ii.total, 0);

      const poTotal = item.quantity * item.unitPrice;
      const varianceQty = invoiceBilled - grnReceived;
      const varianceAmount = invoiceAmount - poTotal;

      return {
        itemCode: item.itemCode,
        itemName: item.itemName,
        poQuantity: item.quantity,
        poUnitPrice: item.unitPrice,
        poTotal,
        grnReceived,
        invoiceBilled,
        invoiceAmount,
        varianceQty,
        varianceAmount,
        isQtyMatched: grnReceived === invoiceBilled,
        isAmountMatched: Math.abs(varianceAmount) < 0.01,
        status: grnReceived === invoiceBilled && Math.abs(varianceAmount) < 0.01 ? "MATCHED" : "DISCREPANCY",
      };
    });

    // Calculate totals
    const totals = {
      poSubtotal: po.subtotal,
      invoiceSubtotal: po.invoices.reduce((sum, inv) => sum + inv.subtotal, 0),
      poVat: po.vatAmount,
      invoiceVat: po.invoices.reduce((sum, inv) => sum + inv.vatAmount, 0),
      poGrandTotal: po.grandTotal,
      invoiceGrandTotal: po.invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
      totalPayments: po.payments.reduce((sum, p) => sum + p.amount, 0),
      outstandingBalance: po.grandTotal - po.payments.reduce((sum, p) => sum + p.amount, 0),
    };

    const hasDiscrepancies = comparisonLines.some((l) => l.status === "DISCREPANCY");

    return NextResponse.json({
      po: {
        id: po.id,
        poNumber: po.poNumber,
        supplier: po.supplier,
        orderDate: po.orderDate,
        status: po.status,
      },
      comparisonLines,
      totals,
      hasDiscrepancies,
    });
  } catch (error) {
    console.error("Error fetching three-way matching data:", error);
    return NextResponse.json({ error: "Failed to fetch matching data" }, { status: 500 });
  }
}