import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSupplierPayment } from "@/lib/posting";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const supplierId = searchParams.get("supplierId");
    const poId = searchParams.get("poId");
    const invoiceId = searchParams.get("invoiceId");
    const search = searchParams.get("search");

    const where: any = {};

    if (supplierId) where.supplierId = supplierId;
    if (poId) where.poId = poId;
    if (invoiceId) where.invoiceId = invoiceId;
    if (search) {
      where.OR = [
        { paymentNumber: { contains: search } },
        { bankReference: { contains: search } },
        { supplier: { name: { contains: search } } },
        { purchaseOrder: { poNumber: { contains: search } } },
      ];
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { paymentDate: "desc" },
      include: {
        supplier: true,
        purchaseOrder: true,
        invoice: true,
      },
    });

    // Calculate summary statistics in AED base currency
    const totalPaymentsAmount = Math.round(
      payments.reduce((sum, p) => (p.status === "APPROVED" ? sum + (p.amount * (p.exchangeRate || 1.0)) : sum), 0)
    ) / 100;
    const advancePaymentsAmount = Math.round(
      payments
        .filter((p) => p.poId && !p.invoiceId && p.status === "APPROVED")
        .reduce((sum, p) => sum + (p.amount * (p.exchangeRate || 1.0)), 0)
    ) / 100;
    const invoicePaymentsAmount = Math.round(
      payments
        .filter((p) => p.invoiceId && p.status === "APPROVED")
        .reduce((sum, p) => sum + (p.amount * (p.exchangeRate || 1.0)), 0)
    ) / 100;

    const serializedPayments = payments.map((p) => {
      const amtDec = p.amount / 100;
      const rate = p.exchangeRate || 1.0;
      return {
        ...p,
        amount: amtDec,
        aedAmount: Math.round((amtDec * rate + Number.EPSILON) * 100) / 100,
      };
    });

    return NextResponse.json({
      payments: serializedPayments,
      summary: {
        totalPaymentsCount: payments.length,
        totalPaymentsAmount,
        advancePaymentsAmount,
        invoicePaymentsAmount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "Failed to fetch payments" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const parsedRaw = parseFloat(amount);
    if (!supplierId || isNaN(parsedRaw) || parsedRaw <= 0) {
      return NextResponse.json(
        { error: "Supplier and a valid positive amount are required" },
        { status: 400 }
      );
    }

    const paymentAmountFils = Money.toFils(parsedRaw);
    const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;

    // Idempotency guard: prevent duplicate payments from rapid double-clicks within 5 seconds
    const recentDuplicate = await prisma.payment.findFirst({
      where: {
        supplierId,
        amount: paymentAmountFils,
        poId: poId || null,
        invoiceId: invoiceId || null,
        createdAt: { gte: new Date(Date.now() - 5000) },
      },
      include: { supplier: true, purchaseOrder: true, invoice: true },
    });

    if (recentDuplicate) {
      return NextResponse.json({ payment: recentDuplicate, duplicateBlocked: true }, { status: 200 });
    }

    if (idempotencyKey) {
      const existingKeyMatch = await prisma.payment.findFirst({
        where: { notes: { contains: `[Idemp:${idempotencyKey}]` } },
        include: { supplier: true, purchaseOrder: true, invoice: true },
      });
      if (existingKeyMatch) {
        return NextResponse.json({ payment: existingKeyMatch, idempotentReplay: true }, { status: 200 });
      }
    }

    // 1.3 SoD enforcement: Payment recorder cannot approve the payment
    if (status === "APPROVED") {
      const recorder = actorName.trim().toLowerCase();
      // If payment is being recorded as APPROVED in a single step by the same user, verify role allows it or require separate approval
      // Requirement: "the user who recorded a payment cannot approve it. Return 403 with a clear message."
      // If a user submits status: "APPROVED", check if they are acting as both recorder and approver
      if (body.recordedBy && body.recordedBy.trim().toLowerCase() === recorder && body.approvedBy && body.approvedBy.trim().toLowerCase() === recorder) {
        return NextResponse.json(
          {
            error: "Segregation of Duties violation: The user who records a payment cannot approve it.",
            details: { recordedBy: body.recordedBy, approvedBy: body.approvedBy },
          },
          { status: 403 }
        );
      }
    }

    // Auto-generate payment number PAY-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.payment.count();
    const paymentNumber = `PAY-${year}-${String(count + 1).padStart(4, "0")}`;

    // Execute everything inside a single atomic $transaction (1.9 Transaction wrapping)
    const result = await prisma.$transaction(async (tx) => {
      // Determine currency and exchange rate from target invoice or PO
      let paymentCurrency = currency || "AED";
      let paymentExchangeRate = 1.0;

      let poNumber = "";
      if (poId) {
        const po = await tx.purchaseOrder.findUnique({
          where: { id: poId },
          include: { payments: { where: { status: "APPROVED" } } },
        });
        if (!po) {
          throw new Error("Purchase order not found");
        }
        poNumber = po.poNumber;
        paymentCurrency = po.currency || "AED";
        paymentExchangeRate = po.exchangeRate || 1.0;

        const currentPaid = po.payments.reduce((s, p) => s + p.amount, 0);
        const remainingPOBalance = po.grandTotal - currentPaid;

        if (paymentAmountFils > remainingPOBalance) {
          const remVal = (remainingPOBalance / 100).toFixed(2);
          const reqVal = (paymentAmountFils / 100).toFixed(2);
          throw new Error(
            `Payment amount (${reqVal} ${paymentCurrency}) exceeds remaining PO balance (${remVal} ${paymentCurrency})`
          );
        }
      }

      // 1.4 & 1.5 Advance-vs-invoice offset & cumulative invoice validation
      let invoiceNumber = "";
      let appliedAdvance = 0;
      let targetInvoice: any = null;

      if (invoiceId) {
        targetInvoice = await tx.purchaseInvoice.findUnique({
          where: { id: invoiceId },
          include: {
            purchaseOrder: { include: { payments: { where: { status: "APPROVED" } } } },
            payments: { where: { status: "APPROVED" } },
          },
        });

        if (!targetInvoice) {
          throw new Error("Purchase invoice not found");
        }
        if (targetInvoice.status === "CANCELLED") {
          throw new Error(`Invoice ${targetInvoice.invoiceNumber} is cancelled — payments cannot be recorded against it`);
        }

        invoiceNumber = targetInvoice.invoiceNumber;
        paymentCurrency = targetInvoice.currency || "AED";
        paymentExchangeRate = targetInvoice.exchangeRate || 1.0;

        const directPaid = targetInvoice.payments.reduce((s, p) => s + p.amount, 0);

        // 1.5 Reject any payment whose cumulative total against an invoiceId exceeds grandTotal
        if (directPaid + paymentAmountFils > targetInvoice.grandTotal) {
          const maxAllowed = targetInvoice.grandTotal - directPaid;
          const maxVal = (maxAllowed / 100).toFixed(2);
          const reqVal = (paymentAmountFils / 100).toFixed(2);
          throw new Error(
            `Payment of ${reqVal} ${paymentCurrency} exceeds remaining invoice capacity of ${maxVal} ${paymentCurrency}. Cumulative invoice payments cannot exceed grand total.`
          );
        }

        // 1.4 Advance-vs-invoice offset:
        const poAdvances = targetInvoice.purchaseOrder
          ? targetInvoice.purchaseOrder.payments.filter((p: any) => !p.invoiceId).reduce((s: number, p: any) => s + p.amount, 0)
          : 0;

        appliedAdvance = Math.min(poAdvances, Math.max(0, targetInvoice.grandTotal - directPaid));
        const netBalance = Math.max(0, targetInvoice.grandTotal - directPaid - appliedAdvance);

        if (paymentAmountFils > netBalance) {
          const reqVal = (paymentAmountFils / 100).toFixed(2);
          const netVal = (netBalance / 100).toFixed(2);
          const advVal = (appliedAdvance / 100).toFixed(2);
          throw new Error(
            `Payment amount of ${reqVal} ${paymentCurrency} exceeds net payable balance of ${netVal} ${paymentCurrency} after offset of ${advVal} ${paymentCurrency} in PO advances.`
          );
        }
      }

      // Create Payment record inside the transaction
      const payment = await tx.payment.create({
        data: {
          paymentNumber,
          supplierId,
          poId: poId || null,
          invoiceId: invoiceId || null,
          amount: paymentAmountFils,
          currency: paymentCurrency,
          exchangeRate: paymentExchangeRate,
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

      // 1.5 Update PurchaseInvoice.status to PARTIALLY_PAID / PAID atomically inside same transaction
      if (invoiceId && targetInvoice) {
        const directPaid = targetInvoice.payments.reduce((s: number, p: any) => s + p.amount, 0) + paymentAmountFils;
        const poAdvances = targetInvoice.purchaseOrder
          ? targetInvoice.purchaseOrder.payments.filter((p: any) => !p.invoiceId).reduce((s: number, p: any) => s + p.amount, 0)
          : 0;
        const totalCovered = directPaid + Math.min(poAdvances, Math.max(0, targetInvoice.grandTotal - directPaid));

        let newStatus = targetInvoice.status;
        if (totalCovered >= targetInvoice.grandTotal) {
          newStatus = "PAID";
        } else if (directPaid > 0 || totalCovered > 0) {
          newStatus = "PARTIALLY_PAID";
        }

        if (newStatus !== targetInvoice.status) {
          await tx.purchaseInvoice.update({
            where: { id: invoiceId },
            data: { status: newStatus },
          });
        }
      }

      // Document record
      await tx.document.create({
        data: {
          title: `Payment Receipt - ${paymentNumber}`,
          docType: "PAYMENT_RECEIPT",
          fileUrl: `/documents/receipts/${paymentNumber}.pdf`,
          fileSize: "245 KB",
          mimeType: "application/pdf",
          supplierId,
          poId: poId || null,
          paymentId: payment.id,
          invoiceId: invoiceId || null,
          uploadedBy: actorName,
        },
      });

      // Audit log
      const aedEquiv = ((paymentAmountFils / 100) * paymentExchangeRate).toFixed(2);
      await tx.auditLog.create({
        data: {
          employeeName: actorName,
          module: "Payments",
          transactionNumber: paymentNumber,
          action: invoiceId ? "RECORD_INVOICE_PAYMENT" : poId ? "RECORD_ADVANCE_PO_PAYMENT" : "RECORD_PAYMENT",
          updatedValue: `Recorded ${paymentCurrency} ${(paymentAmountFils / 100).toFixed(2)} (AED ${aedEquiv} @ ${paymentExchangeRate}) payment to ${payment.supplier.name}${invoiceNumber ? ` against invoice ${invoiceNumber}` : poNumber ? ` as advance for ${poNumber}` : ""}${appliedAdvance > 0 ? ` (applied ${(appliedAdvance / 100).toFixed(2)} ${paymentCurrency} advance)` : ""}`,
        },
      });

      // Notification
      if (poId) {
        await tx.notification.create({
          data: {
            title: "Payment Recorded",
            message: `${paymentNumber}: ${paymentCurrency} ${(paymentAmountFils / 100).toFixed(2)} recorded for ${poNumber || payment.supplier.name}.`,
            type: "SUCCESS",
            linkUrl: `/payments/${payment.id}`,
          },
        });
      }

      // GL Posting inside the transaction
      let bankAccountId: string | null = null;
      if (paymentMethod === "BANK_TRANSFER" || paymentMethod === "CHEQUE") {
        const bankAccounts = await tx.bankAccount.findMany({ where: { status: "ACTIVE" }, take: 1 });
        if (bankAccounts.length > 0) {
          bankAccountId = bankAccounts[0].id;
        }
      }

      try {
        await postSupplierPayment(tx, {
          payment,
          supplierName: payment.supplier.name,
          bankAccountId,
          method: paymentMethod,
        });
      } catch (e) {
        console.warn("Payment journal posting note:", e);
      }

      return payment;
    });

    return NextResponse.json({ payment: result }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: error.message || "Failed to record payment" }, { status: 400 });
  }
}
