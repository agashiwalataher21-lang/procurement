import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "stock-on-hand";
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const category = searchParams.get("category");

    const whereClause: any = { status: "ACTIVE" };
    if (category && category !== "ALL") {
      whereClause.category = category;
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        poItems: { include: { purchaseOrder: true } },
        grnItems: { include: { goodsReceivedNote: true } },
      },
      orderBy: { itemCode: "asc" },
    });

    let reportData: any[] = [];

    switch (reportType) {
      case "stock-on-hand":
        reportData = products.map((p) => ({
          itemCode: p.itemCode,
          itemName: p.itemName,
          brand: p.brand,
          category: p.category,
          currentStock: p.currentStock,
          unitCost: p.defaultPurchasePrice,
          totalValue: p.currentStock * p.defaultPurchasePrice,
          location: "Dubai Logistics Hub",
          status: p.currentStock > 0 ? "In Stock" : "Out of Stock",
        }));
        break;

      case "low-stock":
        reportData = products
          .filter((p) => p.currentStock > 0 && p.currentStock <= p.reorderLevel)
          .map((p) => ({
            itemCode: p.itemCode,
            itemName: p.itemName,
            brand: p.brand,
            currentStock: p.currentStock,
            reorderLevel: p.reorderLevel,
            safetyStock: p.safetyStock,
            unitCost: p.defaultPurchasePrice,
            deficit: Math.max(0, p.reorderLevel - p.currentStock),
          }));
        break;

      case "out-of-stock":
        reportData = products
          .filter((p) => p.currentStock === 0)
          .map((p) => ({
            itemCode: p.itemCode,
            itemName: p.itemName,
            brand: p.brand,
            lastRestockDate: null,
            reorderLevel: p.reorderLevel,
          }));
        break;

      case "reorder-stock":
        reportData = products
          .filter((p) => {
            const incoming = p.poItems.reduce((sum, item) => {
              if (["APPROVED", "PARTIALLY_RECEIVED"].includes(item.purchaseOrder.status)) {
                return sum + (item.quantity - item.receivedQty);
              }
              return sum;
            }, 0);
            return (p.currentStock + incoming) <= p.reorderLevel;
          })
          .map((p) => {
            const incoming = p.poItems.reduce((sum, item) => {
              if (["APPROVED", "PARTIALLY_RECEIVED"].includes(item.purchaseOrder.status)) {
                return sum + (item.quantity - item.receivedQty);
              }
              return sum;
            }, 0);
            return {
              itemCode: p.itemCode,
              itemName: p.itemName,
              currentStock: p.currentStock,
              incomingQty: incoming,
              projectedStock: p.currentStock + incoming,
              reorderPoint: p.reorderLevel,
              safetyStock: p.safetyStock,
              leadTimeDays: p.supplierLeadTime,
              suggestedOrderQty: Math.max(1, p.maxStock - (p.currentStock + incoming)),
            };
          });
        break;

      case "fast-moving":
        // Simulated based on high GRN quantity in last 30 days
        reportData = products
          .map((p) => {
            const receivedQty = p.grnItems.reduce((sum, item) => {
              const grnDate = new Date(item.goodsReceivedNote.receivedDate);
              const thirtyDaysAgo = new Date();
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              if (grnDate >= thirtyDaysAgo) {
                return sum + item.newlyReceivedQty;
              }
              return sum;
            }, 0);
            return {
              itemCode: p.itemCode,
              itemName: p.itemName,
              brand: p.brand,
              currentStock: p.currentStock,
              last30DaysReceived: receivedQty,
              avgDailyUsage: receivedQty / 30,
              turnoverRate: p.currentStock > 0 ? (receivedQty / 30 / p.currentStock) * 100 : 0,
            };
          })
          .filter((p) => p.last30DaysReceived > 0)
          .sort((a, b) => b.last30DaysReceived - a.last30DaysReceived)
          .slice(0, 20);
        break;

      case "slow-moving":
        reportData = products
          .map((p) => {
            const receivedQty = p.grnItems.reduce((sum, item) => {
              const grnDate = new Date(item.goodsReceivedNote.receivedDate);
              const ninetyDaysAgo = new Date();
              ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
              if (grnDate >= ninetyDaysAgo) {
                return sum + item.newlyReceivedQty;
              }
              return sum;
            }, 0);
            return {
              itemCode: p.itemCode,
              itemName: p.itemName,
              brand: p.brand,
              currentStock: p.currentStock,
              last90DaysReceived: receivedQty,
              daysSinceLastReceipt: p.grnItems.length > 0 ? Math.floor((Date.now() - new Date(Math.max(...p.grnItems.map(i => new Date(i.goodsReceivedNote.receivedDate).getTime()))).getTime()) / (1000 * 60 * 60 * 24)) : 999,
            };
          })
          .filter((p) => p.last90DaysReceived === 0 && p.currentStock > 0)
          .sort((a, b) => b.daysSinceLastReceipt - a.daysSinceLastReceipt);
        break;

      case "dead-stock":
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        reportData = products
          .filter((p) => {
            const hasRecentGRN = p.grnItems.some((item) => {
              const grnDate = new Date(item.goodsReceivedNote.receivedDate);
              return grnDate >= sixMonthsAgo;
            });
            return p.currentStock > 0 && !hasRecentGRN;
          })
          .map((p) => ({
            itemCode: p.itemCode,
            itemName: p.itemName,
            brand: p.brand,
            currentStock: p.currentStock,
            unitValue: p.defaultPurchasePrice,
            totalValue: p.currentStock * p.defaultPurchasePrice,
            monthsOld: ">6 months no movement",
          }));
        break;

      case "stock-valuation":
        const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.defaultPurchasePrice), 0);
        const categoryValues: { [key: string]: number } = {};
        products.forEach((p) => {
          if (!categoryValues[p.category]) categoryValues[p.category] = 0;
          categoryValues[p.category] += p.currentStock * p.defaultPurchasePrice;
        });
        reportData = Object.entries(categoryValues).map(([cat, val]) => ({
          category: cat,
          totalValue: val,
          percentage: (val / totalValue) * 100,
        }));
        break;

      case "stock-ageing":
        reportData = products
          .filter((p) => p.currentStock > 0)
          .map((p) => {
            const avgAge = p.grnItems.length > 0
              ? Math.floor((Date.now() - new Date(Math.max(...p.grnItems.map(i => new Date(i.goodsReceivedNote.receivedDate).getTime()))).getTime()) / (1000 * 60 * 60 * 24 * 30))
              : 0;
            return {
              itemCode: p.itemCode,
              itemName: p.itemName,
              currentStock: p.currentStock,
              unitCost: p.defaultPurchasePrice,
              totalValue: p.currentStock * p.defaultPurchasePrice,
              ageCategory: avgAge === 0 ? "No Movement" : avgAge <= 1 ? "0-30 Days" : avgAge <= 3 ? "31-90 Days" : avgAge <= 6 ? "91-180 Days" : ">180 Days",
              avgAgeMonths: avgAge,
            };
          });
        break;

      default:
        reportData = products.map((p) => ({
          itemCode: p.itemCode,
          itemName: p.itemName,
          currentStock: p.currentStock,
        }));
    }

    return NextResponse.json({ reportData, totalItems: reportData.length });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}