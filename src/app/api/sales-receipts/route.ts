import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSalesReceipt } from "@/lib/posting";
import { getCurrentUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since");
    const where: any = {};
    if (since) where.receiptDate = { gte: new Date(since) };

    const receipts = await prisma.salesReceipt.findMany({
      where,
      orderBy: { receiptDate: "desc" },
      include: { salesInvoice: true },
    });
    return NextResponse.json({ receipts });
  } catch (error) {
    console.error("Error fetching sales receipts:", error);
    return NextResponse.json({ error: "Failed to fetch sales receipts" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Accountant";

    const body = await request.json();
    const {
      salesInvoiceId,
      customerName,
      receiptDate,
      amount,
      currency = "AED",
      paymentMethod = "BANK_TRANSFER",
      bankReference,
      notes,
      status = "APPROVED",
    } = body;
    const recordedBy = actorName;

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json(
        { error: "A valid positive amount is required" },
        { status: 400 }
      );
    }
    if (!["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"].includes(paymentMethod)) {
      return NextResponse.json({ error: "Invalid payment method" }, { status: 400 });
    }

    let invoice = null;
    let resolvedCustomer = customerName;
    if (salesInvoiceId) {
      invoice = await prisma.salesInvoice.findUnique({
        where: { id: salesInvoiceId },
        include: { payments: { where: { status: "APPROVED" } } },
      });
      if (!invoice) {
        return NextResponse.json({ error: "Sales invoice not found" }, { status: 404 });
      }
      if (invoice.status === "CANCELLED") {
        return NextResponse.json(
          { error: "Cannot record receipt against a cancelled invoice" },
          { status: 400 }
        );
      }
      resolvedCustomer = invoice.customerName;
      const alreadyPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);
      const remaining = Math.max(0, invoice.grandTotal - alreadyPaid);
      if (amt > remaining + 0.01) {
        return NextResponse.json(
          {
            error: `Receipt amount (${amt.toFixed(2)}) exceeds remaining invoice balance (${remaining.toFixed(2)})`,
          },
          { status: 400 }
        );
      }
    }
    if (!resolvedCustomer || !resolvedCustomer.trim()) {
      return NextResponse.json(
        { error: "Customer name is required when no sales invoice is specified" },
        { status: 400 }
      );
    }

    const year = new Date().getFullYear();
    const count = await prisma.salesReceipt.count();
    const receiptNumber = `SR-${year}-${String(count + 1).padStart(4, "0")}`;

    const receipt = await prisma.$transaction(async (tx) => {
      const rec = await tx.salesReceipt.create({
        data: {
          receiptNumber,
          salesInvoiceId: salesInvoiceId || null,
          customerName: resolvedCustomer,
          receiptDate: receiptDate ? new Date(receiptDate) : new Date(),
          amount: amt,
          currency,
          paymentMethod,
          bankReference: bankReference || null,
          notes: notes || null,
          status,
          recordedBy,
        },
        include: { salesInvoice: true },
      });

      if (status === "APPROVED") {
        await postSalesReceipt(tx, rec);
      }

      // Auto-transition invoice status
      if (invoice) {
        const paid = invoice.payments.reduce((s, p) => s + p.amount, 0) + amt;
        if (paid >= invoice.grandTotal - 0.01) {
          await tx.salesInvoice.update({ where: { id: invoice.id }, data: { status: "PAID" } });
        } else if (paid > 0) {
          await tx.salesInvoice.update({
            where: { id: invoice.id },
            data: { status: "PARTIALLY_PAID" },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          employeeName: recordedBy,
          module: "Sales Receipts",
          transactionNumber: receiptNumber,
          action: "CREATE_SALES_RECEIPT",
          updatedValue: `Recorded ${currency} ${amt.toFixed(2)} receipt from ${resolvedCustomer}${
            invoice ? ` against ${invoice.invoiceNumber}` : ""
          }`,
        },
      });

      return rec;
    });

    return NextResponse.json({ receipt }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sales receipt:", error);
    return NextResponse.json(
      { error: error.message || "Failed to record sales receipt" },
      { status: 500 }
    );
  }
}
