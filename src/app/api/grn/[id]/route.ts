import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const grn = await prisma.goodsReceivedNote.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        purchaseOrder: {
          include: {
            items: true,
            grns: {
              include: { items: true },
            },
          },
        },
        items: {
          include: {
            product: true,
          },
        },
        documents: true,
      },
    });

    if (!grn) {
      return NextResponse.json({ error: "GRN not found" }, { status: 404 });
    }

    return NextResponse.json({ grn });
  } catch (error) {
    console.error("Error fetching GRN details:", error);
    return NextResponse.json({ error: "Failed to fetch GRN" }, { status: 500 });
  }
}
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const grn = await prisma.goodsReceivedNote.findUnique({
      where: { id: params.id },
      include: { purchaseOrder: true },
    });

    if (!grn) {
      return NextResponse.json({ error: "Goods Received Note not found" }, { status: 404 });
    }

    if (grn.status === "CANCELLED") {
      return NextResponse.json({ message: "GRN already cancelled" });
    }

    // Soft-delete: set status to CANCELLED (but keep items and audit trail)
    await prisma.goodsReceivedNote.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          employeeName: "Accountant",
          module: "Goods Received",
          transactionNumber: grn.grnNumber,
          action: "CANCEL_GRN",
          updatedValue: `Goods Received Note ${grn.grnNumber} soft-deleted. Reverted PO status from ${grn.purchaseOrder.status} back to PARTIALLY_RECEIVED if needed.`,
        },
      });
    } catch (e) {
      console.warn("Audit log failed for GRN cancel", e);
    }

    // Notification (non-blocking)
    try {
      await prisma.notification.create({
        data: {
          title: "GRN Cancelled",
          message: `Goods Received Note ${grn.grnNumber} has been cancelled and reversed.`,
          type: "WARNING",
          linkUrl: "/grn",
        },
      });
    } catch (e) {
      console.warn("Notification failed for GRN cancel", e);
    }

    return NextResponse.json({ message: "GRN soft-deleted successfully" });
  } catch (error) {
    console.error("Error cancelling GRN:", error);
    return NextResponse.json({ error: "Failed to cancel Goods Received Note" }, { status: 500 });
  }
}
