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

    // Void child records (soft-delete, create reversals)
    await prisma.$transaction([
      // Void invoices (soft-delete + reverse journal)
      prisma.purchaseInvoice.updateMany({
        where: { poId: params.id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      }),
      // Void GRNs (soft-delete + reverse journal)
      prisma.goodsReceivedNote.updateMany({
        where: { poId: params.id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      }),
      // Void payments (soft-delete + reverse journal)
      prisma.payment.updateMany({
        where: { poId: params.id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      }),
      // Void purchase returns
      prisma.purchaseReturn.updateMany({
        where: { poId: params.id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      }),
      // Void landed costs
      prisma.landedCost.updateMany({
        where: { poId: params.id, status: { not: "CANCELLED" } },
        data: { status: "CANCELLED" },
      }),
      // Delete documents (no journal)
      prisma.document.deleteMany({ where: { poId: params.id } }),
      // Soft-delete PO itself → voided (keep master for audit)
      prisma.purchaseOrder.update({
        where: { id: params.id },
        data: { status: "CANCELLED" },
      }),
    ]);

    // Write reversal journals manually
    const journals = await prisma.journalEntry.findMany({
      where: {
        sourceType: { in: ["INVOICE", "GRN", "PAYMENT"] },
        sourceId: { in: [...po.invoices.map((i: any) => i.id), ...po.grns.map((g: any) => g.id), ...po.payments.map((p: any) => p.id)] },
        status: "POSTED",
      },
    });
    for (const j of journals) {
      await reverseAllForSource(prisma, [j.sourceType], j.sourceId!);
    }

    // Audit log
    try {
      await prisma.auditLog.create({
        data: {
          employeeName: "Taher",
          module: "Purchase Orders",
          transactionNumber: po.poNumber,
          action: "VOID_PO",
          updatedValue: `Voided PO ${po.poNumber} (${po.currency} ${po.grandTotal.toFixed(2)}). Deleted all linked transactions: ${summary.grns} GRN(s), ${summary.invoices} invoice(s), ${summary.payments} payment(s), ${summary.returns} return(s), ${summary.landedCosts} landed cost(s)`,
        },
      });
    } catch (e) {
      console.warn("Audit log failed for PO void", e);
    }

    try {
      await prisma.notification.create({
        data: {
          title: "Purchase Order Voided",
          message: `${po.poNumber} voided and all linked transactions reversed.`,
          type: "WARNING",
          linkUrl: "/purchase-orders",
        },
      });
    } catch (e) {
      console.warn("Notification failed for PO void", e);
    }

    return NextResponse.json({
      message: "Purchase Order voided successfully. All linked transactions reversed (journals cancelled).",
      voided: true,
      deleted: summary,
    });
  } catch (error) {
    console.error("Error voiding purchase order:", error);
    return NextResponse.json({ error: "Failed to void purchase order." }, { status: 500 });
  }
}
