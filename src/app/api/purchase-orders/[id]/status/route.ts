import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const body = await request.json();
    const { status, notes } = body;

    // Resolve approver identity from session, never from client body
    const actorName = user?.name || "Admin";

    const validStatuses = [
      "DRAFT",
      "PENDING_APPROVAL",
      "APPROVED",
      "PARTIALLY_RECEIVED",
      "FULLY_RECEIVED",
      "PARTIALLY_INVOICED",
      "FULLY_INVOICED",
      "CLOSED",
      "CANCELLED",
    ];

    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const currentPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    });

    if (!currentPO) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // State Transition Matrix: prevent illegal backward jumps and resurrecting terminal states
    const ALLOWED_TRANSITIONS: Record<string, string[]> = {
      DRAFT: ["PENDING_APPROVAL", "APPROVED", "CANCELLED"],
      PENDING_APPROVAL: ["APPROVED", "DRAFT", "CANCELLED"],
      APPROVED: ["PARTIALLY_RECEIVED", "FULLY_RECEIVED", "CANCELLED"],
      PARTIALLY_RECEIVED: ["FULLY_RECEIVED", "PARTIALLY_INVOICED", "FULLY_INVOICED", "CLOSED"],
      FULLY_RECEIVED: ["PARTIALLY_INVOICED", "FULLY_INVOICED", "CLOSED"],
      PARTIALLY_INVOICED: ["FULLY_INVOICED", "CLOSED"],
      FULLY_INVOICED: ["CLOSED"],
      CLOSED: [], // Terminal
      CANCELLED: [], // Terminal
    };

    const allowedNext = ALLOWED_TRANSITIONS[currentPO.status] || [];
    if (currentPO.status !== status && !allowedNext.includes(status)) {
      return NextResponse.json(
        {
          error: `Illegal state transition: Cannot transition Purchase Order from "${currentPO.status}" to "${status}". Allowed transitions: [${allowedNext.join(", ") || "None - Terminal State"}]`,
          currentStatus: currentPO.status,
          targetStatus: status,
          allowedTransitions: allowedNext,
        },
        { status: 400 }
      );
    }

    // 1.3 SoD enforcement: The user who created a PO cannot approve it (unless Admin or single-user mode)
    if (status === "APPROVED") {
      const creatorName = currentPO.createdBy?.trim().toLowerCase();
      const approverCandidate = actorName.trim().toLowerCase();
      const userCount = await prisma.user.count();

      if (userCount > 1 && creatorName && creatorName === approverCandidate && user?.role !== "ADMIN") {
        return NextResponse.json(
          {
            error: "Segregation of Duties violation: The user who created this purchase order cannot approve it.",
            details: {
              createdBy: currentPO.createdBy,
              attemptedBy: actorName,
            },
          },
          { status: 403 }
        );
      }
    }

    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status,
        approvedBy: status === "APPROVED" ? actorName : currentPO.approvedBy,
      },
      include: { supplier: true },
    });

    // Record in Audit Log
    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Purchase Orders",
        transactionNumber: updatedPO.poNumber,
        action: `PO_STATUS_CHANGED_TO_${status}`,
        previousValue: currentPO.status,
        updatedValue: status,
      },
    });

    // Create notification if approved
    if (status === "APPROVED") {
      await prisma.notification.create({
        data: {
          title: "PO Approved",
          message: `PO ${updatedPO.poNumber} has been approved by ${actorName}. Ready for goods receiving or advance payments.`,
          type: "SUCCESS",
          linkUrl: `/purchase-orders/${updatedPO.id}`,
        },
      });
    }

    return NextResponse.json({ purchaseOrder: updatedPO });
  } catch (error: any) {
    console.error("Error updating PO status:", error);
    return NextResponse.json({ error: error.message || "Failed to update PO status" }, { status: 500 });
  }
}
