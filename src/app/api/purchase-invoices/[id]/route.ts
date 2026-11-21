import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id },
      include: {
        supplier: true,
        purchaseOrder: {
          include: {
            items: true,
            payments: { where: { status: "APPROVED" } },
          },
        },
        items: true,
        payments: { where: { status: "APPROVED" } },
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    // Direct payments on the invoice
    const directPaid = invoice.payments.reduce((s, p) => s + p.amount, 0);

    // Unapplied PO advances on linked PO
    const poAdvances = invoice.purchaseOrder
      ? invoice.purchaseOrder.payments
          .filter((p) => !p.invoiceId)
          .reduce((s, p) => s + p.amount, 0)
      : 0;

    const appliedAdvance = Math.min(poAdvances, Math.max(0, invoice.grandTotal - directPaid));
    const totalPaid = appliedAdvance + directPaid;
    const remainingBalance = Math.max(0, invoice.grandTotal - totalPaid);

    // Auto-update status if invoice is not cancelled or draft
    let currentStatus = invoice.status;
    if (invoice.status !== "CANCELLED" && invoice.status !== "DRAFT") {
      let targetStatus = "CONFIRMED";
      if (remainingBalance <= 1) {
        targetStatus = "PAID";
      } else if (totalPaid > 0) {
        targetStatus = "PARTIALLY_PAID";
      }

      if (targetStatus !== invoice.status) {
        await prisma.purchaseInvoice.update({
          where: { id: invoice.id },
          data: { status: targetStatus },
        });
        currentStatus = targetStatus;
      }
    }

    // Get PO items for comparison
    let poItems: any[] = [];
    if (invoice.purchaseOrder?.items) {
      poItems = invoice.purchaseOrder.items;
    }

    // Enhance items with PO comparison data
    const enhancedItems = invoice.items.map((item) => {
      const poItem = poItems.find((pi) => pi.itemCode === item.itemCode);
      return {
        ...item,
        poQuantity: poItem?.quantity || 0,
        poUnitPrice: poItem?.unitPrice || 0,
        lineTotal: item.total,
      };
    });

    const invRate = invoice.exchangeRate || 1.0;
    const grandTotalDec = invoice.grandTotal / 100;
    const aedGrandTotal = Math.round((grandTotalDec * invRate + Number.EPSILON) * 100) / 100;
    const remainingBalDec = remainingBalance / 100;
    const aedRemainingBalance = Math.round((remainingBalDec * invRate + Number.EPSILON) * 100) / 100;

    return NextResponse.json({
      invoice: {
        ...invoice,
        status: currentStatus,
        subtotal: invoice.subtotal / 100,
        discountAmount: invoice.discountAmount / 100,
        shippingAmount: invoice.shippingAmount / 100,
        otherExpensesAmount: invoice.otherExpensesAmount / 100,
        vatAmount: invoice.vatAmount / 100,
        grandTotal: grandTotalDec,
        aedGrandTotal,
        aedEquivalent: aedGrandTotal,
        directPaid: directPaid / 100,
        appliedAdvance: appliedAdvance / 100,
        totalPaid: totalPaid / 100,
        paidAmount: totalPaid / 100,
        remainingBalance: remainingBalDec,
        netBalance: remainingBalDec,
        aedRemainingBalance,
        items: enhancedItems.map((it) => ({
          ...it,
          unitPrice: it.unitPrice / 100,
          discount: it.discount / 100,
          total: it.total / 100,
          lineTotal: it.lineTotal / 100,
          poUnitPrice: it.poUnitPrice / 100,
        })),
      },
    });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "Failed to fetch invoice" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      invoiceNumber,
      poId,
      supplierId,
      invoiceDate,
      dueDate,
      paymentTerms = "Net 30",
      notes,
      items,
    } = body;

    const existingInvoice = await prisma.purchaseInvoice.findUnique({
      where: { id: params.id },
    });

    if (!existingInvoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    let subtotalFils = 0;
    const invoiceItemsData = items.map((item: any) => {
      const qty = parseFloat(item.invoiceQuantity) || parseFloat(item.quantity) || 0;
      const priceRaw = parseFloat(item.invoiceUnitPrice) || parseFloat(item.unitPrice) || 0;
      const unitPriceFils = Money.toFils(priceRaw);
      const discountFils = Money.toFils(item.discount || 0);
      const lineTotalFils = Math.round(qty * unitPriceFils) - discountFils;
      subtotalFils += lineTotalFils;
      return {
        id: item.id,
        productId: item.productId || null,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: qty,
        unitPrice: unitPriceFils,
        discount: discountFils,
        total: lineTotalFils,
        isExtraFromPo: item.isExtra || false,
      };
    });

    const vatAmountFils = Math.round(subtotalFils * 0.05);
    const grandTotalFils = subtotalFils + vatAmountFils;

    const updatedInvoice = await prisma.purchaseInvoice.update({
      where: { id: params.id },
      data: {
        invoiceNumber,
        poId,
        supplierId,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : existingInvoice.invoiceDate,
        dueDate: dueDate ? new Date(dueDate) : existingInvoice.dueDate,
        status: existingInvoice.status,
        currency: existingInvoice.currency,
        exchangeRate: existingInvoice.exchangeRate,
        subtotal: subtotalFils,
        vatAmount: vatAmountFils,
        grandTotal: grandTotalFils,
        notes: `Payment Terms: ${paymentTerms}. ${notes || ""}`,
        items: {
          deleteMany: {},
          create: invoiceItemsData,
        },
      },
      include: {
        supplier: true,
        purchaseOrder: true,
        items: true,
      },
    });

    return NextResponse.json({ invoice: updatedInvoice });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "Failed to update invoice" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const invoice = await prisma.purchaseInvoice.findUnique({
      where: { id: params.id },
      include: { supplier: true },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    const user = await getCurrentUser(request);
    const actorName = user?.name || "Admin";

    await prisma.$transaction(async (tx) => {
      // 1. Delete linked journal lines & entries
      const journals = await tx.journalEntry.findMany({
        where: { sourceType: "INVOICE", sourceId: params.id },
        select: { id: true },
      });
      if (journals.length > 0) {
        const jIds = journals.map((j: any) => j.id);
        await tx.journalLine.deleteMany({ where: { journalId: { in: jIds } } });
        await tx.journalEntry.deleteMany({ where: { id: { in: jIds } } });
      }

      // 2. Unlink or delete direct invoice payments & their journals
      const directPayments = await tx.payment.findMany({ where: { invoiceId: params.id } });
      for (const p of directPayments) {
        const pJournals = await tx.journalEntry.findMany({ where: { sourceType: "PAYMENT", sourceId: p.id }, select: { id: true } });
        if (pJournals.length > 0) {
          const pjIds = pJournals.map((j: any) => j.id);
          await tx.journalLine.deleteMany({ where: { journalId: { in: pjIds } } });
          await tx.journalEntry.deleteMany({ where: { id: { in: pjIds } } });
        }
        await tx.document.deleteMany({ where: { paymentId: p.id } });
        await tx.payment.delete({ where: { id: p.id } });
      }

      // 3. Delete documents and line items
      await tx.document.deleteMany({ where: { invoiceId: params.id } });
      await tx.invoiceItem.deleteMany({ where: { invoiceId: params.id } });

      // 4. Delete the invoice itself
      await tx.purchaseInvoice.delete({ where: { id: params.id } });

      // 5. Update linked PO status if applicable
      if (invoice.poId) {
        const remainingInvoices = await tx.purchaseInvoice.findMany({
          where: { poId: invoice.poId },
        });
        const newStatus = remainingInvoices.length === 0 ? "APPROVED" : "PARTIALLY_INVOICED";
        await tx.purchaseOrder.update({
          where: { id: invoice.poId },
          data: { status: newStatus },
        });
      }
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: actorName,
        module: "Purchase Invoices",
        transactionNumber: invoice.invoiceNumber,
        action: "DELETE_INVOICE",
        updatedValue: `Deleted invoice ${invoice.invoiceNumber} (${invoice.supplier?.currency || 'AED'} ${(invoice.grandTotal / 100).toFixed(2)}) and reversed all general ledger entries`,
      },
    });

    return NextResponse.json({ message: "Invoice deleted successfully and general ledger updated" });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "Failed to delete invoice" }, { status: 500 });
  }
}
