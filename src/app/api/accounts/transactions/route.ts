import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.toLowerCase() || "";
    const type = searchParams.get("type") || "ALL";
    const status = searchParams.get("status") || "ALL";
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    // Fetch transactions from all financial tables
    const [payments, invoices, journals] = await Promise.all([
      prisma.payment.findMany({
        include: { supplier: true, purchaseOrder: true, invoice: true },
        orderBy: { paymentDate: "desc" },
      }),
      prisma.purchaseInvoice.findMany({
        include: { supplier: true, purchaseOrder: true },
        orderBy: { invoiceDate: "desc" },
      }),
      prisma.journalEntry.findMany({
        include: { lines: { include: { account: true } } },
        orderBy: { date: "desc" },
      }),
    ]);

    const transactions: any[] = [];

    // 1. Map Payments
    payments.forEach((p) => {
      const origAmt = p.amount / 100;
      const rate = p.exchangeRate || 1.0;
      const aedAmt = Math.round((origAmt * rate + Number.EPSILON) * 100) / 100;
      transactions.push({
        id: p.id,
        date: p.paymentDate.toISOString(),
        transactionNumber: p.paymentNumber,
        description: `Payment to ${p.supplier?.name || "Supplier"}${p.invoice ? ` for ${p.invoice.invoiceNumber}` : p.purchaseOrder ? ` advance for ${p.purchaseOrder.poNumber}` : ""}`,
        transactionType: p.invoiceId ? "INVOICE_PAYMENT" : p.poId ? "PO_ADVANCE" : "PAYMENT",
        entityName: p.supplier?.name || "Supplier",
        reference: p.bankReference || p.chequeNumber || p.purchaseOrder?.poNumber || p.invoice?.invoiceNumber || "—",
        currency: p.currency || "AED",
        originalAmount: origAmt,
        exchangeRate: rate,
        aedAmount: aedAmt,
        debit: aedAmt,
        credit: 0,
        status: p.status,
        viewUrl: `/payments/${p.id}`,
      });
    });

    // 2. Map Purchase Invoices
    invoices.forEach((inv) => {
      const origAmt = inv.grandTotal / 100;
      const rate = inv.exchangeRate || 1.0;
      const aedAmt = Math.round((origAmt * rate + Number.EPSILON) * 100) / 100;
      transactions.push({
        id: inv.id,
        date: inv.invoiceDate.toISOString(),
        transactionNumber: inv.invoiceNumber,
        description: `Vendor bill from ${inv.supplier?.name || "Supplier"}${inv.purchaseOrder ? ` (${inv.purchaseOrder.poNumber})` : ""}`,
        transactionType: "PURCHASE_INVOICE",
        entityName: inv.supplier?.name || "Supplier",
        reference: inv.purchaseOrder?.poNumber || "—",
        currency: inv.currency || "AED",
        originalAmount: origAmt,
        exchangeRate: rate,
        aedAmount: aedAmt,
        debit: 0,
        credit: aedAmt,
        status: inv.status,
        viewUrl: `/purchase-invoices/${inv.id}`,
      });
    });

    // 3. Map Journal Entries
    journals.forEach((j) => {
      const totalDebit = j.lines.reduce((s, l) => s + l.debit, 0) / 100;
      transactions.push({
        id: j.id,
        date: j.date.toISOString(),
        transactionNumber: j.journalNumber,
        description: j.description,
        transactionType: "JOURNAL_ENTRY",
        entityName: j.sourceType || "General Ledger",
        reference: j.sourceId ? `${j.sourceType}:${j.sourceId.slice(-6)}` : "—",
        currency: "AED",
        originalAmount: totalDebit,
        exchangeRate: 1.0,
        aedAmount: totalDebit,
        debit: totalDebit,
        credit: totalDebit,
        status: j.status,
        viewUrl: `/accounts?tab=journal`,
      });
    });

    // Filter and Sort
    let filtered = transactions.filter((t) => {
      if (search) {
        const matches =
          t.transactionNumber.toLowerCase().includes(search) ||
          t.description.toLowerCase().includes(search) ||
          t.entityName.toLowerCase().includes(search) ||
          t.reference.toLowerCase().includes(search);
        if (!matches) return false;
      }
      if (type !== "ALL" && t.transactionType !== type) return false;
      if (status !== "ALL" && t.status !== status) return false;
      if (from && new Date(t.date) < new Date(from)) return false;
      if (to && new Date(t.date) > new Date(to)) return false;
      return true;
    });

    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      transactions: filtered,
      summary: {
        totalCount: filtered.length,
        totalAedValue: filtered.reduce((s, t) => s + t.aedAmount, 0),
      },
    });
  } catch (error) {
    console.error("Error fetching financial transactions:", error);
    return NextResponse.json({ error: "Failed to fetch transactions" }, { status: 500 });
  }
}
