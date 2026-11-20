import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postExpense, reverseJournal } from "@/lib/posting";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const category = searchParams.get("category");

    const where: any = {};
    if (accountId) where.accountId = accountId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (category) where.category = category;

    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: "desc" },
    });

    return NextResponse.json({ expenses });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      date,
      category,
      accountId,
      amount,
      currency = "AED",
      paymentMethod = "CASH",
      bankAccountId,
      supplierId,
      description,
      receiptUrl,
      status = "PAID",
    } = body;

    if (!accountId || !category || !amount) {
      return NextResponse.json({ error: "Account, category and amount are required" }, { status: 400 });
    }

    const amountNum = parseFloat(amount);
    if (amountNum <= 0) {
      return NextResponse.json({ error: "Amount must be positive" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: accountId } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const year = new Date().getFullYear();
    const count = await prisma.expense.count();
    const expenseNumber = `EXP-${year}-${String(count + 1).padStart(4, "0")}`;

    const expense = await prisma.expense.create({
      data: {
        expenseNumber,
        date: date ? new Date(date) : new Date(),
        category,
        accountId,
        amount: amountNum,
        currency,
        paymentMethod,
        bankAccountId: bankAccountId || null,
        supplierId: supplierId || null,
        description: description || "",
        receiptUrl: receiptUrl || null,
        status,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: "Accountant",
        module: "Expenses",
        transactionNumber: expenseNumber,
        action: "CREATE_EXPENSE",
        updatedValue: `${currency} ${amountNum.toFixed(2)} — ${account.name} (${category})`,
      },
    });

    // Post double-entry journal
    try {
      await prisma.$transaction(() => postExpense(prisma, expense));
    } catch (e) {
      console.warn("Expense journal posting failed (non-fatal):", e);
    }

    return NextResponse.json({ expense }, { status: 201 });
  } catch (error) {
    console.error("Error creating expense:", error);
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}
