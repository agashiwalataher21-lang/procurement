import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";

  if (!q || q.trim().length < 2) {
    return NextResponse.json({ results: [] });
  }

  const query = q.trim();

  try {
    const [suppliers, products, pos, invoices, grns, payments, documents] = await Promise.all([
      prisma.supplier.findMany({
        where: {
          OR: [
            { name: { contains: query } },
            { supplierId: { contains: query } },
            { contactPerson: { contains: query } },
            { email: { contains: query } },
            { phone: { contains: query } },
            { trn: { contains: query } },
          ],
        },
        take: 4,
      }),
      prisma.product.findMany({
        where: {
          OR: [
            { itemName: { contains: query } },
            { itemCode: { contains: query } },
            { altItemCode: { contains: query } },
            { oemCode: { contains: query } },
            { barcode: { contains: query } },
            { brand: { contains: query } },
            { modelCompatibility: { contains: query } },
          ],
        },
        take: 4,
      }),
      prisma.purchaseOrder.findMany({
        where: {
          OR: [
            { poNumber: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: 4,
      }),
      prisma.purchaseInvoice.findMany({
        where: {
          OR: [
            { invoiceNumber: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: 4,
      }),
      prisma.goodsReceivedNote.findMany({
        where: {
          OR: [
            { grnNumber: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: 4,
      }),
      prisma.payment.findMany({
        where: {
          OR: [
            { paymentNumber: { contains: query } },
            { bankReference: { contains: query } },
            { notes: { contains: query } },
          ],
        },
        take: 4,
      }),
      prisma.document.findMany({
        where: {
          OR: [
            { title: { contains: query } },
            { docType: { contains: query } },
          ],
        },
        take: 4,
      }),
    ]);

    const results = [
      ...suppliers.map((s) => ({
        type: "Supplier",
        title: `${s.supplierId} - ${s.name} (${s.country})`,
        url: `/suppliers/${s.id}`,
      })),
      ...products.map((p) => ({
        type: "Product",
        title: `${p.itemCode} - ${p.itemName} [OEM: ${p.oemCode || 'N/A'}]`,
        url: `/products`,
      })),
      ...pos.map((po) => ({
        type: "Purchase Order",
        title: `${po.poNumber} - AED ${po.grandTotal.toFixed(2)} (${po.status})`,
        url: `/purchase-orders/${po.id}`,
      })),
      ...invoices.map((inv) => ({
        type: "Invoice",
        title: `${inv.invoiceNumber} - AED ${inv.grandTotal.toFixed(2)}`,
        url: `/invoices`,
      })),
      ...grns.map((g) => ({
        type: "GRN",
        title: `${g.grnNumber} (PO Ref: ${g.poId})`,
        url: `/grn`,
      })),
      ...payments.map((pay) => ({
        type: "Payment",
        title: `${pay.paymentNumber} - AED ${pay.amount.toFixed(2)} (${pay.paymentMethod})`,
        url: `/payments`,
      })),
      ...documents.map((doc) => ({
        type: "Document",
        title: `${doc.title} (${doc.docType})`,
        url: `/documents`,
      })),
    ];

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
