import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const search = searchParams.get("search");

    let where: any = {};
    if (accountId) where.accountId = accountId;
    if (from) where.journal = { date: { gte: new Date(from) } };
    if (to) where.journal = { ...where.journal, date: { lte: new Date(to) } };

    const lines = await prisma.journalLine.findMany({
      where,
      include: { journal: true, account: true },
      orderBy: [{ journal: { date: "asc" } }, { journal: { journalNumber: "asc" } }],
    });

    // Add running balance per account
    const accounts = (await prisma.account.findMany()).reduce((m, a) => ({ ...m, [a.id]: a }), {});

    const result = lines.map((l: any) => {
      const acc = accounts[l.accountId];
      const isCreditNormal = acc?.balanceType === "NORMAL_CREDIT";
      let delta = isCreditNormal ? (l.credit - l.debit) : (l.debit - l.credit);
      if (!acc) delta = 0;

      return {
        id: l.id,
        date: l.journal.date,
        journalNumber: l.journal.journalNumber,
        journalId: l.journal.id,
        sourceType: l.journal.sourceType,
        sourceId: l.journal.sourceId,
        description: l.journal.description,
        accountCode: acc?.code,
        accountName: acc?.name,
        debit: l.debit,
        credit: l.credit,
        runningBalance: delta, // client computes cumulative
      };
    });

    return NextResponse.json({ lines: result });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    return NextResponse.json({ error: "Failed to fetch journal entries" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { date, description, lines, sourceType, sourceId } = body;

    if (!date || !description || !lines || lines.length === 0) {
      return NextResponse.json({ error: "Date, description and lines are required" }, { status: 400 });
    }

    const totalDebit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
    const totalCredit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      return NextResponse.json({ error: "Journal must be balanced (debit = credit)" }, { status: 400 });
    }

    const year = new Date().getFullYear();
    const count = await prisma.journalEntry.count();
    const journalNumber = `JV-${year}-${String(count + 1).padStart(4, "0")}`;

    const journal = await prisma.journalEntry.create({
      data: {
        journalNumber,
        date: new Date(date),
        description,
        sourceType: sourceType || "MANUAL",
        sourceId: sourceId || null,
        lines: {
          create: lines.map((l: any) => ({
            accountId: l.accountId,
            debit: parseFloat(l.debit) || 0,
            credit: parseFloat(l.credit) || 0,
          })),
        },
      },
      include: { lines: { include: { account: true } } },
    });

    return NextResponse.json({ journal }, { status: 201 });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    return NextResponse.json({ error: "Failed to create journal entry" }, { status: 500 });
  }
}
