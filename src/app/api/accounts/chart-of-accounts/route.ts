import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

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

    // Compute balances
    const accountsWithBalances = await Promise.all(
      accounts.map(async (a) => {
        const lines = await prisma.journalLine.findMany({ where: { accountId: a.id } });
        const debit = lines.reduce((s, l: any) => s + (l.debit || 0), 0);
        const credit = lines.reduce((s, l: any) => s + (l.credit || 0), 0);
        let balance = a.openingBalance || 0;
        if (a.balanceType === "NORMAL_CREDIT") balance = balance + credit - debit;
        else balance = balance + debit - credit;
        return { ...a, currentBalance: balance };
      })
    );

    return NextResponse.json({ accounts: accountsWithBalances });
  } catch (error) {
    console.error("Error fetching chart of accounts:", error);
    return NextResponse.json({ error: "Failed to fetch chart of accounts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { code, name, type, balanceType = "NORMAL_DEBIT", openingBalance = 0, status = "ACTIVE" } = body;

    if (!code || !name || !type) {
      return NextResponse.json({ error: "Code, name and type are required" }, { status: 400 });
    }

    // Check if code exists
    const existing = await prisma.account.findUnique({ where: { code } });
    if (existing) {
      return NextResponse.json({ error: `Account code ${code} already exists` }, { status: 400 });
    }

    const account = await prisma.account.create({
      data: { code, name, type, balanceType, openingBalance: parseFloat(openingBalance), status },
    });

    return NextResponse.json({ account }, { status: 201 });
  } catch (error) {
    console.error("Error creating account:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
