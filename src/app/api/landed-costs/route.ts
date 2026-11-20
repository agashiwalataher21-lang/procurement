import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const landedCosts = await prisma.landedCost.findMany({
      orderBy: { date: "desc" },
      include: {
        purchaseOrder: true,
        shipment: true,
      },
    });
    return NextResponse.json({ landedCosts });
  } catch (error) {
    console.error("Error fetching landed costs:", error);
    return NextResponse.json({ error: "Failed to fetch landed costs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { poId, shipmentId, allocationMethod, expenses, items } = body;

    const count = await prisma.landedCost.count();
    const landedCostNumber = `LC-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const totalPurchaseCost = items.reduce((sum: number, i: any) => sum + (i.purchaseTotal || 0), 0);
    const totalExpenses = (expenses.freight || 0) + (expenses.customsDuty || 0) + (expenses.clearing || 0) + (expenses.transport || 0) + (expenses.other || 0);

    // Calculate allocations based on method
    const allocatedItems = items.map((item: any) => {
      let allocatedExpense = 0;
      const purchaseTotal = item.purchaseTotal || 0;

      if (allocationMethod === "BY_VALUE") {
        allocatedExpense = totalExpenses > 0 && totalPurchaseCost > 0
          ? (purchaseTotal / totalPurchaseCost) * totalExpenses
          : 0;
      } else if (allocationMethod === "BY_QUANTITY") {
        const totalQty = items.reduce((s: number, i: any) => s + i.quantity, 0);
        allocatedExpense = totalExpenses > 0 && totalQty > 0
          ? (item.quantity / totalQty) * totalExpenses
          : 0;
      }

      const finalLandedCost = purchaseTotal + allocatedExpense;
      const finalUnitLandedCost = item.quantity > 0 ? finalLandedCost / item.quantity : 0;

      return {
        productId: item.productId,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: item.quantity,
        purchaseUnitPrice: item.unitPrice,
        purchaseTotal,
        allocatedExpense,
        finalLandedCost,
        finalUnitLandedCost,
      };
    });

    const grandTotalLandedCost = totalPurchaseCost + totalExpenses;

    const landedCost = await prisma.landedCost.create({
      data: {
        landedCostNumber,
        poId,
        shipmentId,
        allocationMethod,
        totalPurchaseCost,
        totalFreightAmount: expenses.freight || 0,
        totalCustomsDuty: expenses.customsDuty || 0,
        totalClearingCharges: expenses.clearing || 0,
        totalLocalTransport: expenses.transport || 0,
        totalOtherExpenses: expenses.other || 0,
        totalLandedExpenses: totalExpenses,
        grandTotalLandedCost,
        status: "CONFIRMED",
        items: {
          create: allocatedItems,
        },
      },
      include: {
        items: true,
        purchaseOrder: true,
        shipment: true,
      },
    });

    return NextResponse.json({ landedCost }, { status: 201 });
  } catch (error) {
    console.error("Error creating landed cost:", error);
    return NextResponse.json({ error: "Failed to create landed cost" }, { status: 500 });
  }
}