import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reverseJournal, postExpense } from "@/lib/posting";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { journalEntry: true },
    });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    return NextResponse.json({ expense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    return NextResponse.json({ error: "Failed to fetch expense" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { status } = body;
    if (!status) return NextResponse.json({ error: "Status is required" }, { status: 400 });

    const expense = await prisma.expense.findUnique({ where: { id: params.id } });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    const updated = await prisma.expense.update({
      where: { id: params.id },
      data: { status },
    });

    // Reverse journal if expense paid -> unpaid
    if (expense.status === "PAID" && status === "UNPAID") {
      try {
        if (expense.journalEntryId) {
          await reverseJournal(prisma, "EXPENSE", expense.id, "expense unpaid reversal");
        }
      } catch (e) {
        console.warn("Expense reversal failed (non-fatal):", e);
      }
    }
    // Post journal if expense unpaid -> paid
    else if (expense.status === "UNPAID" && status === "PAID") {
      try {
        await prisma.$transaction(() => postExpense(prisma, updated));
      } catch (e) {
        console.warn("Expense journal posting failed (non-fatal):", e);
      }
    }

    return NextResponse.json({ expense: updated });
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: { journalEntry: true },
    });
    if (!expense) return NextResponse.json({ error: "Expense not found" }, { status: 404 });

    // Void via reversal (soft delete)
    if (expense.journalEntryId) {
      await reverseJournal(prisma, "EXPENSE", expense.id, "expense void");
    }

    await prisma.expense.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: "Accountant",
        module: "Expenses",
        transactionNumber: expense.expenseNumber,
        action: "CANCEL_EXPENSE",
        updatedValue: `Expense ${expense.expenseNumber} voided`,
      },
    });

    return NextResponse.json({ message: "Expense voided successfully" });
  } catch (error) {
    console.error("Error voiding expense:", error);
    return NextResponse.json({ error: "Failed to void expense" }, { status: 500 });
  }
}
