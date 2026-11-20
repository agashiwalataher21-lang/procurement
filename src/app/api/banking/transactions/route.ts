import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postBankTransaction } from "@/lib/posting";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bankAccountId, date, description, reference, type, amount, category, notes } = body;

    if (!bankAccountId || !description || !amount) {
      return NextResponse.json({ error: "Bank account, description and amount are required" }, { status: 400 });
    }

    const account = await prisma.bankAccount.findUnique({ where: { id: bankAccountId } });
    if (!account) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

    const count = await prisma.bankTransaction.count({ where: { bankAccountId } });
    const transactionNumber = `BT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const tx = await prisma.bankTransaction.create({
      data: {
        bankAccountId,
        transactionNumber,
        date: date ? new Date(date) : new Date(),
        description,
        reference: reference || null,
        type: type === "CREDIT" ? "CREDIT" : "DEBIT",
        amount: parseFloat(amount) || 0,
        currency: account.currency,
        category: category || "OTHER",
        notes: notes || null,
        status: "CLEARED",
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: "Accountant",
        module: "Banking",
        transactionNumber,
        action: "CREATE_BANK_TRANSACTION",
        updatedValue: `${tx.type} ${account.currency} ${tx.amount.toFixed(2)} — ${description} (${account.accountName})`,
      },
    });

    // Post double-entry journal for bank transaction (GL impact)
    try {
      await prisma.$transaction(() => postBankTransaction(prisma, tx));
    } catch (e) {
      console.warn("Bank transaction journal posting failed (non-fatal):", e);
    }

    return NextResponse.json({ transaction: tx }, { status: 201 });
  } catch (error) {
    console.error("Error creating bank transaction:", error);
    return NextResponse.json({ error: "Failed to create bank transaction" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { ids, status } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
      return NextResponse.json({ error: "Transaction ids and status are required" }, { status: 400 });
    }
    const result = await prisma.bankTransaction.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
    return NextResponse.json({ updated: result.count });
  } catch (error) {
    console.error("Error updating bank transactions:", error);
    return NextResponse.json({ error: "Failed to update transactions" }, { status: 500 });
  }
}
