import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Monthly purchases
    const monthlyPOs = await prisma.purchaseOrder.findMany({
      where: {
        orderDate: { gte: startOfMonth },
        status: { not: "CANCELLED" },
      },
    });
    const monthlyPurchases = Math.round(
      monthlyPOs.reduce((sum, po) => sum + (po.grandTotal / 100) * (po.exchangeRate || 1), 0) * 100
    ) / 100;

    // Total POs
    const totalPOs = await prisma.purchaseOrder.count({
      where: { status: { not: "CANCELLED" } },
    });

    // Pending POs
    const pendingPOs = await prisma.purchaseOrder.count({
      where: { status: "PENDING_APPROVAL" },
    });

    // Overdue POs
    const overduePOs = await prisma.purchaseOrder.count({
      where: {
        expectedDeliveryDate: { lt: now },
        status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] },
      },
    });

    // Total payments
    const payments = await prisma.payment.findMany({
      where: { status: "APPROVED" },
    });
    const totalPayments = Math.round(
      payments.reduce((sum, p) => sum + (p.amount / 100) * (p.exchangeRate || 1), 0) * 100
    ) / 100;

    // Outstanding balances
    const allApprovedPOs = await prisma.purchaseOrder.findMany({
      where: {
        status: { in: ["APPROVED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED", "PARTIALLY_INVOICED"] },
      },
      include: { payments: { where: { status: "APPROVED" } } },
    });
    const outstandingBalances = Math.round(
      allApprovedPOs.reduce((sum, po) => {
        const paidAmount = po.payments.reduce((s, p) => s + p.amount, 0);
        const rem = Math.max(0, po.grandTotal - paidAmount);
        return sum + (rem / 100) * (po.exchangeRate || 1);
      }, 0) * 100
    ) / 100;

    // Total GRNs
    const totalGRNs = await prisma.goodsReceivedNote.count();

    // Pending deliveries
    const pendingDeliveries = await prisma.purchaseOrder.count({
      where: {
        status: { in: ["APPROVED", "PARTIALLY_RECEIVED"] },
      },
    });

    // Uninvoiced GRNs
    const uninvoicedGRNs = await prisma.goodsReceivedNote.count({
      where: {
        purchaseOrder: {
          status: { notIn: ["FULLY_INVOICED", "CLOSED", "CANCELLED"] },
        },
      },
    });

    return NextResponse.json({
      monthlyPurchases,
      totalPOs,
      pendingPOs,
      overduePOs,
      totalPayments,
      outstandingBalances,
      totalGRNs,
      pendingDeliveries,
      uninvoicedGRNs,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      {
        monthlyPurchases: 0,
        totalPOs: 0,
        pendingPOs: 0,
        overduePOs: 0,
        totalPayments: 0,
        outstandingBalances: 0,
        totalGRNs: 0,
        pendingDeliveries: 0,
        uninvoicedGRNs: 0,
      },
      { status: 500 }
    );
  }
}
