import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.account.findUnique({
      where: { id: params.id },
    });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    return NextResponse.json({ account });
  } catch (error) {
    console.error("Error fetching account:", error);
    return NextResponse.json({ error: "Failed to fetch account" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { name, type, balanceType, openingBalance, status } = body;
    if (!name && !type && !balanceType && openingBalance === undefined && !status) {
      return NextResponse.json({ error: "At least one field to update is required" }, { status: 400 });
    }

    const account = await prisma.account.findUnique({ where: { id: params.id } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const updated = await prisma.account.update({
      where: { id: params.id },
      data: { name, type, balanceType, openingBalance: openingBalance !== undefined ? parseFloat(openingBalance) : undefined, status },
    });

    return NextResponse.json({ account: updated });
  } catch (error) {
    console.error("Error updating account:", error);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const account = await prisma.account.findUnique({ where: { id: params.id } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    if (account.isSystem) {
      return NextResponse.json({ error: "System accounts cannot be deleted" }, { status: 400 });
    }

    // Soft-deactivate instead of delete
    await prisma.account.update({
      where: { id: params.id },
      data: { status: "INACTIVE" },
    });

    return NextResponse.json({ message: "Account deactivated" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return NextResponse.json({ error: "Failed to delete account" }, { status: 500 });
  }
}
