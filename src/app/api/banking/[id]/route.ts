import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const account = await prisma.bankAccount.update({
      where: { id: params.id },
      data: {
        accountName: body.accountName,
        bankName: body.bankName,
        accountNumber: body.accountNumber,
        iban: body.iban || null,
        accountType: body.accountType,
        currency: body.currency,
        openingBalance: body.openingBalance !== undefined ? parseFloat(body.openingBalance) : undefined,
        classifiedBy: body.classifiedBy,
        status: body.status,
        notes: body.notes || null,
      },
    });
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error updating bank account:", error);
    return NextResponse.json({ error: "Failed to update bank account" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const account = await prisma.bankAccount.findUnique({ where: { id: params.id } });
    if (!account) return NextResponse.json({ error: "Bank account not found" }, { status: 404 });

    // Soft-delete: deactivate (keeps transaction history intact)
    await prisma.bankAccount.update({ where: { id: params.id }, data: { status: "INACTIVE" } });

    await prisma.auditLog.create({
      data: {
        employeeName: "Accountant",
        module: "Banking",
        transactionNumber: account.accountNumber,
        action: "DEACTIVATE_BANK_ACCOUNT",
        updatedValue: `Deactivated ${account.accountName} at ${account.bankName}`,
      },
    });

    return NextResponse.json({ message: "Bank account deactivated" });
  } catch (error) {
    console.error("Error deactivating bank account:", error);
    return NextResponse.json({ error: "Failed to deactivate bank account" }, { status: 500 });
  }
}
