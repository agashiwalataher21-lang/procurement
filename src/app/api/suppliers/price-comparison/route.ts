import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");

    // Get all products with their quotations
    const whereClause: any = {};
    if (productId) {
      whereClause.id = productId;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        quotations: {
          include: {
            supplier: true,
          },
          orderBy: { quotedPrice: "asc" },
        },
        poItems: {
          include: {
            purchaseOrder: {
              include: {
                supplier: true,
                invoices: true,
                grns: true,
              },
            },
          },
          orderBy: { purchaseOrder: { createdAt: "desc" } },
          take: 50, // Last 50 PO items for price history
        },
      },
    });

    // Build price comparison data
    const comparisonData = products.map((product) => {
      const supplierPrices = product.quotations.map((q) => ({
        supplierId: q.supplierId,
        supplierName: q.supplier.name,
        supplierCode: q.supplier.supplierId,
        quotedPrice: q.quotedPrice,
        previousPrice: q.previousPrice,
        moq: q.moq,
        leadTimeDays: q.leadTimeDays,
        isCheapest: q.isCheapest,
        lastUpdated: q.updatedAt,
      }));

      // Get last purchase price from POs
      const lastPurchase = product.poItems.find(
        (item) => item.purchaseOrder.status === "FULLY_RECEIVED" || item.purchaseOrder.status === "PARTIALLY_RECEIVED"
      );
      const lastPurchasePrice = lastPurchase ? lastPurchase.unitPrice : null;
      const lastPurchaseSupplier = lastPurchase?.purchaseOrder.supplier.name;
      const lastPurchaseDate = lastPurchase?.purchaseOrder.createdAt;

      // Calculate price change from last purchase
      let priceChangePercent = null;
      if (lastPurchasePrice && supplierPrices.length > 0) {
        const currentCheapest = Math.min(...supplierPrices.map((s) => s.quotedPrice));
        priceChangePercent = ((currentCheapest - lastPurchasePrice) / lastPurchasePrice) * 100;
      }

      return {
        productId: product.id,
        itemCode: product.itemCode,
        itemName: product.itemName,
        brand: product.brand,
        defaultPurchasePrice: product.defaultPurchasePrice,
        supplierPrices,
        cheapestSupplier: supplierPrices[0] || null,
        lastPurchasePrice,
        lastPurchaseSupplier,
        lastPurchaseDate,
        priceChangePercent,
        totalSuppliersQuoting: supplierPrices.length,
      };
    });

    return NextResponse.json({ comparisonData });
  } catch (error) {
    console.error("Error fetching price comparison:", error);
    return NextResponse.json({ error: "Failed to fetch price comparison data" }, { status: 500 });
  }
}