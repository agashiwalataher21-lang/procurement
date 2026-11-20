import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Real data from Prisma — no mock figures
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const [invoices, payments, bankAccounts, products] = await Promise.all([
      prisma.purchaseInvoice.findMany({
        where: { status: { not: "CANCELLED" } },
        include: {
          supplier: true,
          payments: { where: { status: "APPROVED" } },
          purchaseOrder: {
            include: { payments: { where: { status: "APPROVED" } } },
          },
        },
      }),
      prisma.payment.findMany({ where: { status: "APPROVED" }, include: { supplier: true }, orderBy: { paymentDate: "desc" }, take: 200 }),
      prisma.bankAccount.findMany({ where: { status: "ACTIVE" }, include: { transactions: true } }),
      prisma.product.findMany({ where: { status: "ACTIVE" } }),
    ]);

    // Accounts Payable: outstanding invoices taking direct payments & PO advances into account, converted to base AED
    let totalAccountsPayable = 0;
    invoices.forEach((inv) => {
      const directPaid = inv.payments.reduce((s, p) => s + p.amount, 0);
      const poAdvances = inv.purchaseOrder
        ? inv.purchaseOrder.payments
            .filter((p) => !p.invoiceId)
            .reduce((s, p) => s + p.amount, 0)
        : 0;
      const appliedAdvance = Math.min(poAdvances, Math.max(0, inv.grandTotal - directPaid));
      const netRemainingFils = Math.max(0, inv.grandTotal - directPaid - appliedAdvance);
      const rate = inv.exchangeRate || 1.0;
      totalAccountsPayable += (netRemainingFils / 100) * rate;
    });

    // Bank / cash balances from Banking module (stored in fils)
    let totalBank = 0;
    let totalCash = 0;
    bankAccounts.forEach((a) => {
      const credits = a.transactions.filter((t) => t.type === "CREDIT").reduce((s, t) => s + t.amount, 0);
      const debits = a.transactions.filter((t) => t.type === "DEBIT").reduce((s, t) => s + t.amount, 0);
      const balanceFils = a.openingBalance + credits - debits;
      const balance = balanceFils / 100;
      if (a.classifiedBy === "CASH") totalCash += balance;
      else totalBank += balance;
    });

    // Inventory value in standard currency units (defaultPurchasePrice is in fils)
    const inventoryValue = products.reduce((s, p) => s + p.currentStock * ((p.defaultPurchasePrice || 0) / 100), 0);
    const totalRevenue = inventoryValue;
    // Expenses: actual invoice bills converted to AED
    const totalExpenses = invoices.reduce((s, i) => s + (i.grandTotal / 100) * (i.exchangeRate || 1.0), 0);
    const netProfit = totalRevenue - totalExpenses;

    // Accounts Receivable — no customer sales model; keep 0 rather than inventing data
    const totalAccountsReceivable = 0;

    const recentTransactions = payments.slice(0, 8).map((p) => {
      const rate = p.exchangeRate || 1.0;
      const amountDec = p.amount / 100;
      const aedAmount = Math.round((amountDec * rate + Number.EPSILON) * 100) / 100;
      return {
        id: p.id,
        date: p.paymentDate.toISOString().slice(0, 10),
        description: `Payment to ${p.supplier?.name || "Supplier"}`,
        type: "expense" as const,
        category: "Accounts Payable",
        amount: aedAmount,
        originalAmount: amountDec,
        currency: p.currency || "AED",
        exchangeRate: rate,
        status: "completed" as const,
        reference: p.paymentNumber,
      };
    });

    // Include bank transactions (credits/debits) in recent list
    const bankTx = bankAccounts.flatMap((a) =>
      a.transactions.map((t) => ({
        id: t.id,
        date: t.date.toISOString().slice(0, 10),
        description: t.description,
        type: (t.type === "CREDIT" ? "income" : "expense") as "income" | "expense",
        category: t.category,
        amount: t.amount / 100,
        originalAmount: t.amount / 100,
        currency: a.currency || "AED",
        exchangeRate: 1.0,
        status: "completed" as const,
        reference: t.transactionNumber || t.reference || "",
      }))
    );

    const allTx = [...recentTransactions, ...bankTx].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 12);

    const data = {
      summary: {
        totalCash: Number(totalCash.toFixed(2)),
        totalBank: Number(totalBank.toFixed(2)),
        totalAccountsReceivable,
        totalAccountsPayable: Number(totalAccountsPayable.toFixed(2)),
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalExpenses: Number(totalExpenses.toFixed(2)),
        netProfit: Number(netProfit.toFixed(2)),
      },
      recentTransactions: allTx,
    };

    return NextResponse.json(data, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("Error fetching account dashboard data:", error);
    return NextResponse.json({ error: "Failed to fetch account dashboard data" }, { status: 500 });
  }
}