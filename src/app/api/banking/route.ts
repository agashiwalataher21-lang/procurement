import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const accounts = await prisma.bankAccount.findMany({
      orderBy: { createdAt: "asc" },
      include: { transactions: { orderBy: { date: "desc" }, take: 200 } },
    });

    const enriched = accounts.map((a) => {
      const credits = a.transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
      const debits = a.transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
      const balance = a.openingBalance + credits - debits;
      const pending = a.transactions.filter((t) => t.status === "PENDING").length;
      const unreconciled = a.transactions.filter((t) => t.status !== "RECONCILED").length;
      return {
        ...a,
        balance,
        totalCredits: credits,
        totalDebits: debits,
        pendingCount: pending,
        unreconciledCount: unreconciled,
        transactionCount: a.transactions.length,
      };
    });

    const totalBank = enriched.filter((a) => a.classifiedBy === "BANK" && a.status === "ACTIVE").reduce((s, a) => s + a.balance, 0);
    const totalCash = enriched.filter((a) => a.classifiedBy === "CASH" && a.status === "ACTIVE").reduce((s, a) => s + a.balance, 0);

    // Bank-linked payments (for the "bank transactions" view)
    const bankPayments = await prisma.payment.findMany({
      where: { paymentMethod: { in: ["BANK_TRANSFER", "CHEQUE"] } },
      include: { supplier: true },
      orderBy: { paymentDate: "desc" },
      take: 100,
    });

    return NextResponse.json({
      accounts: enriched,
      totals: { totalBank, totalCash, totalCombined: totalBank + totalCash },
      bankPayments: bankPayments.map((p) => ({
        id: p.id,
        paymentNumber: p.paymentNumber,
        date: p.paymentDate.toISOString().slice(0, 10),
        supplier: p.supplier?.name || "—",
        amount: p.amount,
        currency: p.currency,
        method: p.paymentMethod,
        bankReference: p.bankReference || "—",
        status: p.status,
      })),
    });
  } catch (error) {
    console.error("Error fetching banking data:", error);
    return NextResponse.json({ error: "Failed to fetch banking data" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { accountName, bankName, accountNumber, iban, accountType, currency, openingBalance, classifiedBy, notes } = body;

    if (!accountName || !bankName || !accountNumber) {
      return NextResponse.json({ error: "Account name, bank name and account number are required" }, { status: 400 });
    }

    const account = await prisma.bankAccount.create({
      data: {
        accountName,
        bankName,
        accountNumber,
        iban: iban || null,
        accountType: accountType || "CURRENT",
        currency: currency || "AED",
        openingBalance: parseFloat(openingBalance) || 0,
        classifiedBy: classifiedBy || "BANK",
        notes: notes || null,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: "Accountant",
        module: "Banking",
        transactionNumber: accountNumber,
        action: "CREATE_BANK_ACCOUNT",
        updatedValue: `Created ${accountType || "CURRENT"} account ${accountName} at ${bankName} (${accountNumber})`,
      },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating bank account:", error);
    if (error?.code === "P2002") return NextResponse.json({ error: "Account number already exists" }, { status: 400 });
    return NextResponse.json({ error: "Failed to create bank account" }, { status: 500 });
  }
}
