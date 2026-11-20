import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const movementType = searchParams.get("type");

    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    if (movementType) {
      where.movementType = movementType;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        product: true,
      },
    });

    // Calculate running balance
    let runningBalance = 0;
    const movementsWithBalance = movements.map((m) => {
      const qty = parseFloat(String(m.quantity));
      runningBalance += qty;
      return {
        ...m,
        runningBalance,
        movementTypeLabel: getMovementTypeLabel(m.movementType),
      };
    });

    // Get product summary if filtered by product
    let productSummary = null;
    if (productId) {
      const product = await prisma.product.findUnique({ where: { id: productId } });
      if (product) {
        productSummary = {
          itemCode: product.itemCode,
          itemName: product.itemName,
          currentStock: product.currentStock,
          category: product.category,
          unitOfMeasurement: product.unitOfMeasurement,
        };
      }
    }

    return NextResponse.json({ movements: movementsWithBalance, summary: productSummary });
  } catch (error) {
    console.error("Error fetching stock movements:", error);
    return NextResponse.json({ error: "Failed to fetch stock movements" }, { status: 500 });
  }
}

function getMovementTypeLabel(type: string): string {
  const labels: { [key: string]: string } = {
    OPENING_STOCK: "Opening Stock",
    GOODS_RECEIVED: "Goods Received (GRN)",
    SUPPLIER_RETURN: "Supplier Return",
    STOCK_ISSUE: "Stock Issue / Sales",
    STOCK_ADJUSTMENT: "Stock Adjustment",
    LOCATION_TRANSFER: "Location Transfer",
  };
  return labels[type] || type;
}
