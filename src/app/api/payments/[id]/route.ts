import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Money } from "@/lib/decimal";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        purchaseOrder: { include: { payments: true } },
        invoice: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const serializedPayment = {
      ...payment,
      amount: payment.amount / 100,
    };

    // Calculate PO context if linked (convert to standard currency units)
    let poContext = null;
    if (payment.poId && payment.purchaseOrder) {
      const po = payment.purchaseOrder;
      const totalPaid = po.payments.reduce((sum: number, p: any) => (p.status === "APPROVED" ? sum + p.amount : sum), 0);
      poContext = {
        poNumber: po.poNumber,
        poTotal: po.grandTotal / 100,
        poTotalPaid: totalPaid / 100,
        poRemainingBalance: (po.grandTotal - totalPaid) / 100,
      };
    }

    return NextResponse.json({ payment: serializedPayment, poContext });
  } catch (error: any) {
    console.error("Error fetching payment:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch payment" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Accountant";

    const body = await request.json();
    const {
      supplierId,
      poId,
      invoiceId,
      amount,
      currency = "AED",
      paymentMethod = "BANK_TRANSFER",
      bankReference,
      paymentDate,
      notes,
      status = "APPROVED",
    } = body;

    const paymentAmount = parseFloat(amount);
    if (!supplierId || isNaN(paymentAmount) || paymentAmount <= 0) {
      return NextResponse.json(
        { error: "Supplier and a valid positive amount are required" },
        { status: 400 }
      );
    }

    const paymentAmountFils = Money.toFils(paymentAmount);

    const existingPayment = await prisma.payment.findUnique({
      where: { id: params.id },
    });

    if (!existingPayment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (poId) {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: poId },
        include: { payments: { where: { status: "APPROVED" } } },
      });
      if (!po) {
        return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
      }
    }

    const payment = await prisma.payment.update({
      where: { id: params.id },
      data: {
        supplierId,
        poId: poId || null,
        invoiceId: invoiceId || null,
        amount: paymentAmountFils,
        currency,
        paymentMethod,
        bankReference: bankReference || null,
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        notes: notes || null,
        recordedBy: actorName,
        status,
      },
      include: {
        supplier: true,
        purchaseOrder: true,
        invoice: true,
      },
    });

    await prisma.document.updateMany({
      where: { paymentId: params.id },
      data: {
        title: `Payment Receipt - ${payment.paymentNumber}`,
      },
    });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Payments",
        transactionNumber: payment.paymentNumber,
        action: "UPDATE_PAYMENT",
        updatedValue: `Updated payment ${payment.paymentNumber}: ${currency} ${paymentAmount.toFixed(2)} to ${payment.supplier.name}`,
      },
    });

    return NextResponse.json({ payment: { ...payment, amount: payment.amount / 100 } });
  } catch (error: any) {
    console.error("Error updating payment:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Accountant";

    const payment = await prisma.payment.findUnique({
      where: { id: params.id },
      include: { supplier: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Delete associated journal entries
      const journals = await tx.journalEntry.findMany({
        where: { sourceType: "PAYMENT", sourceId: params.id },
        select: { id: true },
      });
      if (journals.length > 0) {
        const jIds = journals.map((j: any) => j.id);
        await tx.journalLine.deleteMany({ where: { journalId: { in: jIds } } });
        await tx.journalEntry.deleteMany({ where: { id: { in: jIds } } });
      }

      // 2. Delete linked documents
      await tx.document.deleteMany({ where: { paymentId: params.id } });

      // 3. Delete payment
      await tx.payment.delete({ where: { id: params.id } });
    });

    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Payments",
        transactionNumber: payment.paymentNumber,
        action: "DELETE_PAYMENT",
        updatedValue: `Deleted payment ${payment.paymentNumber} (${payment.currency} ${(payment.amount / 100).toFixed(2)}) to ${payment.supplier.name}`,
      },
    });

    return NextResponse.json({ message: "Payment deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting payment:", error);
    return NextResponse.json({ error: error.message || "Failed to delete payment" }, { status: 500 });
  }
}
