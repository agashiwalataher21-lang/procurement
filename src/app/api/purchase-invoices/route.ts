import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postPurchaseInvoice } from "@/lib/posting";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const poId = searchParams.get("poId");
    const supplierId = searchParams.get("supplierId");
    const status = searchParams.get("status");
    const search = searchParams.get("search");

    const where: any = {};
    if (poId) where.poId = poId;
    if (supplierId) where.supplierId = supplierId;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { purchaseOrder: { poNumber: { contains: search } } },
        { supplier: { name: { contains: search } } },
      ];
    }

    const invoices = await prisma.purchaseInvoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
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

    // 1.4 Advance-vs-invoice offset computation on GET:
    // poAdvances = sum of approved PO advance payments (no invoiceId)
    // directPaid = sum of approved direct invoice payments
    // appliedAdvance = Math.min(poAdvances, Math.max(0, grandTotal - directPaid))
    // totalPaid = appliedAdvance + directPaid
    // remainingBalance = Math.max(0, grandTotal - totalPaid)
    const enhancedInvoices = await Promise.all(
      invoices.map(async (inv) => {
        const directPaid = inv.payments.reduce((s, p) => s + p.amount, 0);

        // Unapplied PO advances on linked PO
        const poAdvances = inv.purchaseOrder
          ? inv.purchaseOrder.payments
              .filter((p) => !p.invoiceId)
              .reduce((s, p) => s + p.amount, 0)
          : 0;

        const appliedAdvance = Math.min(poAdvances, Math.max(0, inv.grandTotal - directPaid));
        const totalPaid = appliedAdvance + directPaid;
        const remainingBalance = Math.max(0, inv.grandTotal - totalPaid);

        // Auto-update status if invoice is not cancelled or draft
        let currentStatus = inv.status;
        if (inv.status !== "CANCELLED" && inv.status !== "DRAFT") {
          let targetStatus = "CONFIRMED";
          if (remainingBalance <= 1) {
            targetStatus = "PAID";
          } else if (totalPaid > 0) {
            targetStatus = "PARTIALLY_PAID";
          }

          if (targetStatus !== inv.status) {
            await prisma.purchaseInvoice.update({
              where: { id: inv.id },
              data: { status: targetStatus },
            });
            currentStatus = targetStatus;
          }
        }

        // Map items with PO comparison data
        const enhancedItems = inv.items.map((item) => {
          let poQuantity = 0;
          let poUnitPrice = 0;

          if (inv.purchaseOrder?.items) {
            const poItem = inv.purchaseOrder.items.find(
              (pi) => pi.itemCode === item.itemCode
            );
            if (poItem) {
              poQuantity = poItem.quantity;
              poUnitPrice = poItem.unitPrice;
            }
          }

          return {
            ...item,
            poQuantity,
            poUnitPrice,
            invoiceQuantity: item.quantity,
            invoiceUnitPrice: item.unitPrice,
            lineTotal: item.total,
          };
        });

        const invRate = inv.exchangeRate || 1.0;
        const grandTotalDec = inv.grandTotal / 100;
        const aedGrandTotal = Math.round((grandTotalDec * invRate + Number.EPSILON) * 100) / 100;
        const remainingBalDec = remainingBalance / 100;
        const aedRemainingBalance = Math.round((remainingBalDec * invRate + Number.EPSILON) * 100) / 100;

        return {
          ...inv,
          status: currentStatus,
          subtotal: inv.subtotal / 100,
          discountAmount: inv.discountAmount / 100,
          shippingAmount: inv.shippingAmount / 100,
          otherExpensesAmount: inv.otherExpensesAmount / 100,
          vatAmount: inv.vatAmount / 100,
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
        };
      })
    );

    return NextResponse.json({ invoices: enhancedInvoices });
  } catch (error: any) {
    console.error("Error fetching purchase invoices:", error);
    return NextResponse.json({ error: "Failed to fetch Purchase Invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const actorName = user?.name || "Purchase Manager";

    const body = await request.json();
    const {
      poId,
      supplierId,
      invoiceNumber,
      invoiceDate,
      dueDate,
      paymentTerms = "Net 30",
      notes,
      items,
      currency,
      exchangeRate,
      vatRate = 5,
      discountAmount = 0,
      shippingAmount = 0,
      otherExpensesAmount = 0,
    } = body;

    if (!poId || !supplierId || !invoiceNumber || !items || items.length === 0) {
      return NextResponse.json(
        { error: "PO, Supplier, Invoice Number, and items are required" },
        { status: 400 }
      );
    }

    const existingInvoice = await prisma.purchaseInvoice.findFirst({
      where: { invoiceNumber },
    });

    if (existingInvoice) {
      return NextResponse.json(
        { error: `Invoice number ${invoiceNumber} already exists` },
        { status: 400 }
      );
    }

    const purchaseOrder = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: true,
        payments: { where: { status: "APPROVED" } },
      },
    });

    if (!purchaseOrder) {
      return NextResponse.json({ error: "Purchase Order not found" }, { status: 404 });
    }

    // Convert and compute line items in integer fils with 3-way matching and negative checks
    let subtotalFils = 0;
    const invoiceItemsData = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const qty = parseFloat(item.invoiceQuantity) || parseFloat(item.quantity) || 0;
      const priceRaw = parseFloat(item.invoiceUnitPrice) || parseFloat(item.unitPrice) || 0;

      // 1. Negative quantity / price validation
      if (isNaN(qty) || qty <= 0) {
        return NextResponse.json(
          { error: `Line ${i + 1} (${item.itemCode || "Item"}): invoice quantity must be greater than 0` },
          { status: 400 }
        );
      }
      if (isNaN(priceRaw) || priceRaw < 0) {
        return NextResponse.json(
          { error: `Line ${i + 1} (${item.itemCode || "Item"}): unit price cannot be negative` },
          { status: 400 }
        );
      }

      // 2. 3-Way Matching: Check against original PO item quantities
      const matchingPoItem = purchaseOrder.items.find(
        (pi) => pi.itemCode === item.itemCode || (item.productId && pi.productId === item.productId)
      );

      if (matchingPoItem && !item.isExtra) {
        // Enforce quantity cap (allow max 5% tolerance for bulk items)
        const maxAllowedQty = matchingPoItem.quantity * 1.05;
        if (qty > maxAllowedQty) {
          return NextResponse.json(
            {
              error: `3-Way Match Failed: Invoiced quantity (${qty}) for item ${item.itemCode} exceeds PO ordered quantity (${matchingPoItem.quantity}) by more than allowed tolerance.`,
              itemCode: item.itemCode,
              poQuantity: matchingPoItem.quantity,
              invoicedQuantity: qty,
            },
            { status: 400 }
          );
        }
      }

      const unitPriceFils = Money.toFils(priceRaw);
      const discountFils = Money.toFils(item.discount || 0);

      // lineTotal = qty * unitPrice - discount (in fils)
      const lineTotalFils = Math.round(qty * unitPriceFils) - discountFils;
      subtotalFils += lineTotalFils;

      invoiceItemsData.push({
        productId: item.productId || null,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: qty,
        unitPrice: unitPriceFils,
        discount: discountFils,
        total: lineTotalFils,
        isExtraFromPo: item.isExtra || false,
      });
    }

    const discFils = Money.toFils(discountAmount);
    const shipFils = Money.toFils(shippingAmount);
    const otherExpFils = Money.toFils(otherExpensesAmount);

    // Currency lock: Invoice must strictly inherit the linked PO's currency and exchange rate
    if (currency && currency.toUpperCase().trim() !== purchaseOrder.currency.toUpperCase().trim()) {
      return NextResponse.json(
        { error: `Currency mismatch: Purchase Invoice currency is locked to linked Purchase Order currency (${purchaseOrder.currency})` },
        { status: 400 }
      );
    }

    const invoiceCurrency = purchaseOrder.currency || "AED";
    let invoiceExchangeRate = purchaseOrder.exchangeRate;
    if (invoiceCurrency === "AED") {
      invoiceExchangeRate = 1.0;
    } else if (isNaN(invoiceExchangeRate) || invoiceExchangeRate <= 0) {
      return NextResponse.json(
        { error: `Linked Purchase Order has an invalid exchange rate (${invoiceExchangeRate}) for foreign currency ${invoiceCurrency}` },
        { status: 400 }
      );
    }

    const principalFils = Math.max(0, subtotalFils - discFils);
    const vatRateNum = parseFloat(String(vatRate)) || 0;
    const vatAmountFils = Math.round((principalFils * vatRateNum) / 100);
    const grandTotalFils = principalFils + shipFils + otherExpFils + vatAmountFils;

    // 1.9 Transaction wrapping: Wrap creation, document, audit log, and GL posting in prisma.$transaction
    const invoice = await prisma.$transaction(async (tx) => {
      const createdInv = await tx.purchaseInvoice.create({
        data: {
          invoiceNumber,
          poId,
          supplierId,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          status: "CONFIRMED",
          currency: invoiceCurrency,
          exchangeRate: invoiceExchangeRate,
          subtotal: subtotalFils,
          discountAmount: discFils,
          shippingAmount: shipFils,
          otherExpensesAmount: otherExpFils,
          vatAmount: vatAmountFils,
          grandTotal: grandTotalFils,
          notes: `Payment Terms: ${paymentTerms}. ${notes || ""}`,
          items: {
            create: invoiceItemsData,
          },
        },
        include: {
          supplier: true,
          purchaseOrder: true,
          items: true,
        },
      });

      // Create document record
      await tx.document.create({
        data: {
          title: `Purchase Invoice - ${invoiceNumber}`,
          docType: "INVOICE",
          fileUrl: `/documents/invoices/${invoiceNumber}.pdf`,
          fileSize: "450 KB",
          mimeType: "application/pdf",
          supplierId,
          poId,
          invoiceId: createdInv.id,
          uploadedBy: actorName,
        },
      });

      // Create audit log with original currency and AED equivalent
      const grandTotalDec = grandTotalFils / 100;
      const aedEquiv = (grandTotalDec * invoiceExchangeRate).toFixed(2);
      await tx.auditLog.create({
        data: {
          employeeName: actorName,
          module: "Purchase Invoices",
          transactionNumber: invoiceNumber,
          action: "CREATE_INVOICE",
          updatedValue: `Invoice recorded for ${purchaseOrder.poNumber}. Total: ${invoiceCurrency} ${grandTotalDec.toFixed(2)} (AED ${aedEquiv} @ ${invoiceExchangeRate})`,
        },
      });

      // GL Journal posting inside transaction
      try {
        await postPurchaseInvoice(tx, createdInv);
      } catch (e) {
        console.warn("Invoice journal posting failed inside transaction:", e);
      }

      return createdInv;
    });

    // Compute advance offset numbers for response
    const poAdvances = purchaseOrder.payments
      .filter((p: any) => !p.invoiceId)
      .reduce((s: number, p: any) => s + p.amount, 0);
    const appliedAdvance = Math.min(poAdvances, grandTotalFils);
    const netBalance = Math.max(0, grandTotalFils - appliedAdvance);

    return NextResponse.json(
      {
        invoice: {
          ...invoice,
          appliedAdvance,
          netBalance,
          netPayable: Math.max(0, grandTotalFils - poAdvances),
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating purchase invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to create Purchase Invoice" }, { status: 500 });
  }
}
