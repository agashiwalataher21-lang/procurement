import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";
    const { id } = params;

    const body = await request.json();
    const { name, symbol, rateToAED, unitsPerAED, status } = body;

    const existing = await prisma.currency.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 });
    }

    let newRate = existing.rateToAED;
    let newUnits = existing.unitsPerAED;

    if (unitsPerAED !== undefined && !isNaN(parseFloat(unitsPerAED)) && parseFloat(unitsPerAED) > 0) {
      const u = parseFloat(unitsPerAED);
      newUnits = u;
      newRate = 1 / u;
    } else if (rateToAED !== undefined && !isNaN(parseFloat(rateToAED)) && parseFloat(rateToAED) > 0) {
      const r = parseFloat(rateToAED);
      newRate = r;
      newUnits = 1 / r;
    }

    const updated = await prisma.currency.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(symbol !== undefined && { symbol: symbol.trim() }),
        rateToAED: newRate,
        unitsPerAED: newUnits,
        ...(status !== undefined && { status }),
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Currencies",
        transactionNumber: updated.code,
        action: "UPDATE_CURRENCY_RATE",
        previousValue: `1 ${updated.code} = ${existing.rateToAED} AED (1 AED = ${existing.unitsPerAED})`,
        updatedValue: `1 ${updated.code} = ${updated.rateToAED} AED (1 AED = ${updated.unitsPerAED})`,
      },
    });

    return NextResponse.json({ currency: updated });
  } catch (error: any) {
    console.error("Error updating currency:", error);
    return NextResponse.json({ error: error.message || "Failed to update currency" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";
    const { id } = params;

    const currency = await prisma.currency.findUnique({ where: { id } });
    if (!currency) {
      return NextResponse.json({ error: "Currency not found" }, { status: 404 });
    }

    if (currency.isBase) {
      return NextResponse.json({ error: "Cannot delete the base reporting currency (AED)" }, { status: 400 });
    }

    await prisma.currency.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Currencies",
        transactionNumber: currency.code,
        action: "DELETE_CURRENCY",
        updatedValue: `Deleted currency ${currency.code} (${currency.name})`,
      },
    });

    return NextResponse.json({ message: "Currency deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting currency:", error);
    return NextResponse.json({ error: error.message || "Failed to delete currency" }, { status: 500 });
  }
}
