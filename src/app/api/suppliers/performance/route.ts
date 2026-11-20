import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    // Get all suppliers with their transaction history
    const suppliers = await prisma.supplier.findMany({
      include: {
        purchaseOrders: true,
        payments: true,
        grns: { include: { items: true } },
        invoices: true,
      },
    });

    const performanceData = suppliers.map((supplier) => {
      // Total orders (Purchase Orders)
      const totalOrders = supplier.purchaseOrders.length;

      // Total spent
      const totalSpent = supplier.purchaseOrders.reduce((sum, po) => sum + po.grandTotal, 0);

      // Outstanding balance = Grand Total - Sum of approved payments
      const totalPayments = supplier.payments.reduce((sum, p) => sum + p.amount, 0);
      const outstandingBalance = Math.max(0, totalSpent - totalPayments);

      // On-time delivery rate
      const deliveredOrders = supplier.grns.filter((grn) => grn.status === "CONFIRMED");
      const onTimeDeliveries = deliveredOrders.filter((grn) => {
        const po = supplier.purchaseOrders.find((p) => p.id === grn.poId);
        if (!po) return false;
        return new Date(grn.receivedDate) <= new Date(po.expectedDeliveryDate);
      });
      const onTimeDeliveryRate =
        deliveredOrders.length > 0
          ? (onTimeDeliveries.length / deliveredOrders.length) * 100
          : 100;

      // Average lead time
      const leadTimes = deliveredOrders
        .map((grn) => {
          const po = supplier.purchaseOrders.find((p) => p.id === grn.poId);
          if (!po) return null;
          const orderDate = new Date(po.orderDate);
          const receivedDate = new Date(grn.receivedDate);
          const days = (receivedDate.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
          return Math.max(0, days);
        })
        .filter((d) => d !== null);

      const avgLeadTimeDays = leadTimes.length > 0
        ? leadTimes.reduce((sum, d) => sum + d, 0) / leadTimes.length
        : 0;

      // Shortage percentage (from GRN items with "Shortage" condition)
      const totalReceived = deliveredOrders.reduce((sum, grn) => {
        return sum + grn.items.reduce((itemSum, item) => itemSum + item.newlyReceivedQty, 0);
      }, 0);
      const shortageItems = deliveredOrders.reduce((sum, grn) => {
        return sum + grn.items.filter((i) => i.condition === "Shortage").reduce((itemSum, item) => itemSum + item.newlyReceivedQty, 0);
      }, 0);
      const shortagePercent = totalReceived > 0 ? (shortageItems / totalReceived) * 100 : 0;

      // Damaged percentage
      const damagedItems = deliveredOrders.reduce((sum, grn) => {
        return sum + grn.items.filter((i) => i.condition === "Damaged").reduce((itemSum, item) => itemSum + item.newlyReceivedQty, 0);
      }, 0);
      const damagedPercent = totalReceived > 0 ? (damagedItems / totalReceived) * 100 : 0;

      // Price variance (simplified - compare to last purchase)
      const priceVariancePercent = 0; // Simplified for now

      // Calculate overall performance score (0-100)
      let performanceScore = 100;
      performanceScore -= (100 - onTimeDeliveryRate) * 0.4;
      if (avgLeadTimeDays > 14) {
        performanceScore -= Math.min(20, (avgLeadTimeDays - 14) * 2);
      }
      performanceScore -= shortagePercent * 1.5;
      performanceScore -= damagedPercent * 2;
      performanceScore = Math.max(0, Math.min(100, performanceScore));

      return {
        supplierId: supplier.id,
        supplierCode: supplier.supplierId,
        supplierName: supplier.name,
        totalOrders,
        totalSpent,
        onTimeDeliveryRate,
        avgLeadTimeDays,
        shortagePercent,
        damagedPercent,
        priceVariancePercent,
        outstandingBalance,
        performanceScore,
        lastOrderDate: supplier.purchaseOrders.length > 0 ? supplier.purchaseOrders[0].orderDate : null,
      };
    });

    // Sort by performance score (descending)
    performanceData.sort((a, b) => b.performanceScore - a.performanceScore);

    return NextResponse.json({ performanceData });
  } catch (error) {
    console.error("Error fetching supplier performance:", error);
    return NextResponse.json({ error: "Failed to fetch supplier performance" }, { status: 500 });
  }
}
