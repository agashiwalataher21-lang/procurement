import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { reverseAllForSource, postPurchaseInvoice } from "@/lib/posting";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        payments: {
          orderBy: { paymentDate: "desc" },
        },
        grns: {
          include: {
            items: true,
          },
          orderBy: { receivedDate: "desc" },
        },
        invoices: {
          include: {
            items: true,
          },
          orderBy: { invoiceDate: "desc" },
        },
        documents: true,
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    const serializedPO = {
      ...purchaseOrder,
      subtotal: purchaseOrder.subtotal / 100,
      discountAmount: purchaseOrder.discountAmount / 100,
      shippingAmount: purchaseOrder.shippingAmount / 100,
      otherExpensesAmount: purchaseOrder.otherExpensesAmount / 100,
      vatAmount: purchaseOrder.vatAmount / 100,
      grandTotal: purchaseOrder.grandTotal / 100,
      items: purchaseOrder.items.map((it) => ({
        ...it,
        unitPrice: it.unitPrice / 100,
        discount: it.discount / 100,
        tax: it.tax / 100,
        total: it.total / 100,
      })),
      payments: purchaseOrder.payments.map((p) => ({ ...p, amount: p.amount / 100 })),
    };

    // Calculations for payments and balances (in standard currency units)
    const totalPaid = serializedPO.payments.reduce((sum, p) => (p.status === "APPROVED" ? sum + p.amount : sum), 0);
    const poBalance = serializedPO.grandTotal - totalPaid;

    // Delivery stats
    let totalOrderedQty = 0;
    let totalReceivedQty = 0;
    serializedPO.items.forEach((item) => {
      totalOrderedQty += item.quantity;
      totalReceivedQty += item.receivedQty;
    });

    const pendingQty = totalOrderedQty - totalReceivedQty;
    const receivedValue = (serializedPO.grandTotal * (totalOrderedQty > 0 ? totalReceivedQty / totalOrderedQty : 0));
    const pendingValue = serializedPO.grandTotal - receivedValue;

    // Ageing & delay calculation
    const now = new Date();
    const orderDate = new Date(serializedPO.orderDate);
    const deliveryDate = new Date(serializedPO.expectedDeliveryDate);
    const daysSinceOrder = Math.max(0, Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysOverdue = now > deliveryDate && pendingQty > 0
      ? Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return NextResponse.json({
      purchaseOrder: serializedPO,
      tracking: {
        totalPaid,
        poBalance,
        totalOrderedQty,
        totalReceivedQty,
        pendingQty,
        receivedValue,
        pendingValue,
        daysSinceOrder,
        daysOverdue,
        isDelayed: daysOverdue > 0,
      },
    });
  } catch (error) {
    console.error("Error fetching purchase order:", error);
    return NextResponse.json({ error: "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const {
      supplierId,
      orderDate,
      expectedDeliveryDate,
      currency,
      items,
      discountAmount = 0,
      shippingAmount = 0,
      otherExpensesAmount = 0,
      vatRate = 5,
      notes,
    } = body;

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier and at least one item are required" },
        { status: 400 }
      );
    }

    const existingPO = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
    });

    if (!existingPO) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    // Calculate totals
    let subtotal = 0;
    const poItemsData = items.map((item: any) => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unitPrice) || 0;
      const itemDiscount = parseFloat(item.discount) || 0;
      const total = qty * price - itemDiscount;
      subtotal += total;
      return {
        id: item.id,
        productId: item.productId || null,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: qty,
        unitPrice: price,
        discount: itemDiscount,
        total,
      };
    });

    const disc = parseFloat(discountAmount) || 0;
    const ship = parseFloat(shippingAmount) || 0;
    const exp = parseFloat(otherExpensesAmount) || 0;
    const principalAmount = Math.max(0, subtotal - disc);
    const vatAmount = (principalAmount * (parseFloat(vatRate) || 0)) / 100;
    const grandTotal = principalAmount + ship + exp + vatAmount;

    // Update PO
    const updatedPO = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        supplierId,
        orderDate: orderDate ? new Date(orderDate) : existingPO.orderDate,
        expectedDeliveryDate: expectedDeliveryDate ? new Date(expectedDeliveryDate) : existingPO.expectedDeliveryDate,
        currency,
        items: {
          deleteMany: {},
          create: poItemsData,
        },
        discountAmount: disc,
        shippingAmount: ship,
        otherExpensesAmount: exp,
        vatAmount,
        grandTotal,
        notes: notes || existingPO.notes,
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    return NextResponse.json({ purchaseOrder: updatedPO });
  } catch (error) {
    console.error("Error updating purchase order:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        invoices: true,
        payments: true,
        grns: true,
        purchaseReturns: true,
        landedCosts: true,
        documents: true,
      },
    });

    if (!po) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    if (po.status === "CANCELLED") {
      return NextResponse.json({ error: "Purchase Order already voided." }, { status: 400 });
    }

    const summary = {
      grns: po.grns.length,
      invoices: po.invoices.length,
      payments: po.payments.length,
      returns: po.purchaseReturns.length,
      landedCosts: po.landedCosts.length,
      documents: po.documents.length,
    };

    await prisma.$transaction(async (tx) => {
      const allLinkedInvoiceIds = po.invoices.map((i: any) => i.id);
      const allLinkedGrnIds = po.grns.map((g: any) => g.id);
      const allLinkedPaymentIds = po.payments.map((p: any) => p.id);
      const allSourceIds = [params.id, ...allLinkedInvoiceIds, ...allLinkedGrnIds, ...allLinkedPaymentIds];

      // 1. Delete all associated journal lines and entries
      const journals = await tx.journalEntry.findMany({
        where: {
          OR: [
            { sourceId: { in: allSourceIds } },
            { sourceType: "PURCHASE_ORDER", sourceId: params.id },
          ],
        },
        select: { id: true },
      });
      if (journals.length > 0) {
        const jIds = journals.map((j: any) => j.id);
        await tx.journalLine.deleteMany({ where: { journalId: { in: jIds } } });
        await tx.journalEntry.deleteMany({ where: { id: { in: jIds } } });
      }

      // 2. Delete child documents
      await tx.document.deleteMany({
        where: {
          OR: [
            { poId: params.id },
            { invoiceId: { in: allLinkedInvoiceIds } },
            { grnId: { in: allLinkedGrnIds } },
            { paymentId: { in: allLinkedPaymentIds } },
          ],
        },
      });

      // 3. Delete returns & landed costs
      await tx.purchaseReturnItem.deleteMany({ where: { purchaseReturn: { poId: params.id } } });
      await tx.purchaseReturn.deleteMany({ where: { poId: params.id } });
      await tx.landedCostItem.deleteMany({ where: { landedCost: { poId: params.id } } });
      await tx.landedCost.deleteMany({ where: { poId: params.id } });

      // 4. Delete payments
      await tx.payment.deleteMany({ where: { poId: params.id } });

      // 5. Delete invoices & items
      await tx.invoiceItem.deleteMany({ where: { invoiceId: { in: allLinkedInvoiceIds } } });
      await tx.purchaseInvoice.deleteMany({ where: { poId: params.id } });

      // 6. Delete GRNs & items
      await tx.grnItem.deleteMany({ where: { grnId: { in: allLinkedGrnIds } } });
      await tx.goodsReceivedNote.deleteMany({ where: { poId: params.id } });

      // 7. Delete PO items & PO itself
      await tx.purchaseOrderItem.deleteMany({ where: { poId: params.id } });
      await tx.purchaseOrder.delete({ where: { id: params.id } });
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        employeeName: "Admin",
        module: "Purchase Orders",
        transactionNumber: po.poNumber,
        action: "DELETE_PO",
        updatedValue: `Deleted PO ${po.poNumber} (${po.currency} ${(po.grandTotal / 100).toFixed(2)}) and all associated invoices, GRNs, and payments.`,
      },
    });

    return NextResponse.json({
      message: "Purchase Order and all associated records deleted successfully.",
      deleted: true,
      summary,
    });
  } catch (error) {
    console.error("Error voiding purchase order:", error);
    return NextResponse.json({ error: "Failed to void purchase order." }, { status: 500 });
  }
}
