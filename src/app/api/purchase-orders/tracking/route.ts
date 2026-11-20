import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        status: {
          in: ["APPROVED", "PARTIALLY_RECEIVED", "DELAYED"],
        },
      },
      include: {
        supplier: true,
        items: true,
      },
      orderBy: { orderDate: "asc" },
    });

    const now = new Date();
    let totalPendingCapital = 0;
    let delayedOrdersCount = 0;

    const ageingBuckets = {
      "0-7": { count: 0, value: 0, orders: [] as any[] },
      "8-15": { count: 0, value: 0, orders: [] as any[] },
      "16-30": { count: 0, value: 0, orders: [] as any[] },
      "30+": { count: 0, value: 0, orders: [] as any[] },
    };

    const trackedOrders = purchaseOrders.map((po) => {
      const orderDate = new Date(po.orderDate);
      const deliveryDate = new Date(po.expectedDeliveryDate);

      const daysSinceOrder = Math.max(0, Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)));
      const daysOverdue = now > deliveryDate ? Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

      let orderedQty = 0;
      let receivedQty = 0;
      po.items.forEach((item) => {
        orderedQty += item.quantity;
        receivedQty += item.receivedQty;
      });

      const pendingQty = Math.max(0, orderedQty - receivedQty);
      const pendingRatio = orderedQty > 0 ? pendingQty / orderedQty : 0;
      const pendingValue = po.grandTotal * pendingRatio;
      const receivedValue = po.grandTotal - pendingValue;

      totalPendingCapital += pendingValue;
      if (daysOverdue > 0) delayedOrdersCount++;

      // Assign to Ageing Bucket
      const orderSummary = {
        id: po.id,
        poNumber: po.poNumber,
        supplierName: po.supplier.name,
        orderDate: po.orderDate,
        expectedDeliveryDate: po.expectedDeliveryDate,
        daysSinceOrder,
        daysOverdue,
        totalPOValue: po.grandTotal,
        currency: po.currency,
        orderedQty,
        receivedQty,
        pendingQty,
        receivedValue,
        pendingValue,
        isDelayed: daysOverdue > 0,
        status: po.status,
      };

      if (daysSinceOrder <= 7) {
        ageingBuckets["0-7"].count++;
        ageingBuckets["0-7"].value += pendingValue;
        ageingBuckets["0-7"].orders.push(orderSummary);
      } else if (daysSinceOrder <= 15) {
        ageingBuckets["8-15"].count++;
        ageingBuckets["8-15"].value += pendingValue;
        ageingBuckets["8-15"].orders.push(orderSummary);
      } else if (daysSinceOrder <= 30) {
        ageingBuckets["16-30"].count++;
        ageingBuckets["16-30"].value += pendingValue;
        ageingBuckets["16-30"].orders.push(orderSummary);
      } else {
        ageingBuckets["30+"].count++;
        ageingBuckets["30+"].value += pendingValue;
        ageingBuckets["30+"].orders.push(orderSummary);
      }

      return orderSummary;
    });

    return NextResponse.json({
      totalTrackedOrders: purchaseOrders.length,
      totalPendingCapital,
      delayedOrdersCount,
      ageingBuckets,
      orders: trackedOrders,
    });
  } catch (error) {
    console.error("Error in PO tracking API:", error);
    return NextResponse.json({ error: "Failed to load tracking data" }, { status: 500 });
  }
}
