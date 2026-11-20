import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const supplierId = searchParams.get("supplierId");

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { code: { contains: search } },
        { name: { contains: search } },
      ];
    }

    const accounts = await prisma.account.findMany({
      where,
      orderBy: { code: "asc" },
    });

    // Get supplier transactions for ledgers
    const supplierTransactions = await prisma.journalLine.findMany({
      where: {
        journal: { status: { not: "VOIDED" } },
        account: { code: "2010" }, // AP account
      },
      include: {
        account: true,
        journal: true,
      },
      orderBy: [{ journal: { date: "asc" } }],
    });

    // Build transaction rows with supplier info
    const transactionRows: any[] = [];
    let runningBalance = 0;
    const activeSupplierId = supplierId && supplierId !== "all" ? supplierId : null;

    for (const line of supplierTransactions) {
      const journal = line.journal;
      // Get supplier from related records (invoice, payment, GRN)
      let supplierName = "-";
      let resolvedSupplierId: string | null = null;

      if (journal.sourceType === "INVOICE") {
        const invoice = await prisma.purchaseInvoice.findUnique({
          where: { id: journal.sourceId },
          include: { supplier: true },
        });
        resolvedSupplierId = invoice?.supplierId || null;
        supplierName = invoice?.supplier?.name || "-";
      } else if (journal.sourceType === "PAYMENT") {
        const payment = await prisma.payment.findUnique({
          where: { id: journal.sourceId },
          include: { supplier: true },
        });
        resolvedSupplierId = payment?.supplierId || null;
        supplierName = payment?.supplier?.name || "-";
      } else if (journal.sourceType === "GRN") {
        const grn = await prisma.goodsReceivedNote.findUnique({
          where: { id: journal.sourceId },
          include: { supplier: true },
        });
        resolvedSupplierId = grn?.supplierId || null;
        supplierName = grn?.supplier?.name || "-";
      }

      // Calculate running balance for AP
      if (journal.sourceType === "INVOICE") {
        runningBalance += line.credit || 0;
      } else if (journal.sourceType === "PAYMENT") {
        runningBalance -= line.debit || 0;
      }

      // Filter by supplier ID if one is selected (frontend sends Supplier.id)
      if (activeSupplierId && resolvedSupplierId !== activeSupplierId) continue;

      transactionRows.push({
        date: journal.date.toISOString().slice(0, 10),
        journalNumber: journal.journalNumber,
        accountName: line.account.name,
        supplierId: resolvedSupplierId,
        supplierName,
        description: journal.description,
        debit: line.debit || 0,
        credit: line.credit || 0,
        runningBalance,
      });
    }

    return NextResponse.json({ ledgers: transactionRows });
  } catch (error) {
    console.error("Error fetching ledgers:", error);
    return NextResponse.json({ error: "Failed to fetch ledgers" }, { status: 500 });
  }
}
