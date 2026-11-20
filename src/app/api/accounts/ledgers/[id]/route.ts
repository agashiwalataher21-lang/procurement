import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getLedgerTransactions } from "@/lib/posting";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sourceType = searchParams.get("sourceType");
    const search = searchParams.get("search");

    const account = await prisma.account.findUnique({ where: { id: params.id } });
    if (!account) return NextResponse.json({ error: "Account not found" }, { status: 404 });

    const ledger = await getLedgerTransactions(prisma, params.id, {
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      sourceType: sourceType || undefined,
      search: search || undefined,
    });

    if (!ledger) {
      return NextResponse.json({ error: "Failed to load ledger" }, { status: 404 });
    }

    return NextResponse.json(ledger);
  } catch (error) {
    console.error("Error fetching ledger:", error);
    return NextResponse.json({ error: "Failed to fetch ledger" }, { status: 500 });
  }
}
