import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postPurchaseInvoice } from "@/lib/posting";
import { getCurrentUser } from "@/lib/auth";
import { Money } from "@/lib/decimal";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const supplierId = searchParams.get("supplierId") || "";

    const where: any = {};

    if (search) {
      where.OR = [
        { poNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
        { notes: { contains: search } },
      ];
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where,
      orderBy: { orderDate: "desc" },
      include: {
        supplier: true,
        items: true,
        payments: true,
        grns: true,
        invoices: true,
      },
    });

    const serialized = purchaseOrders.map((po) => ({
      ...po,
      subtotal: po.subtotal / 100,
      discountAmount: po.discountAmount / 100,
      shippingAmount: po.shippingAmount / 100,
      otherExpensesAmount: po.otherExpensesAmount / 100,
      vatAmount: po.vatAmount / 100,
      grandTotal: po.grandTotal / 100,
      items: po.items.map((it) => ({
        ...it,
        unitPrice: it.unitPrice / 100,
        discount: it.discount / 100,
        tax: it.tax / 100,
        total: it.total / 100,
      })),
      payments: po.payments.map((p) => ({ ...p, amount: p.amount / 100 })),
    }));

    return NextResponse.json({ purchaseOrders: serialized });
  } catch (error) {
    console.error("Error fetching purchase orders:", error);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const creatorName = user?.name || "Admin";

    const body = await request.json();
    const {
      supplierId,
      orderDate,
      expectedDeliveryDate,
      currency,
      exchangeRate = 1.0,
      items,
      discountAmount = 0,
      shippingAmount = 0,
      otherExpensesAmount = 0,
      vatRate = 5,
      notes,
    } = body;

    const poCurrency = (currency || "AED").toUpperCase().trim();
    let poRate = parseFloat(exchangeRate);
    if (poCurrency !== "AED") {
      if (isNaN(poRate) || poRate <= 0) {
        return NextResponse.json(
          { error: `Valid exchange rate to AED is required for foreign currency ${poCurrency}` },
          { status: 400 }
        );
      }
    } else {
      poRate = 1.0;
    }

    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: "Supplier and at least one item are required" },
        { status: 400 }
      );
    }

    // Auto-generate PO Number: PO-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.purchaseOrder.count();
    const poNumber = `PO-${year}-${String(count + 1).padStart(4, "0")}`;

    // Validate line items (negative quantity/price protection)
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const q = parseFloat(it.quantity);
      const p = parseFloat(it.unitPrice);
      if (isNaN(q) || q <= 0) {
        return NextResponse.json({ error: `Line ${i + 1} (${it.itemCode || "Item"}): quantity must be a positive number greater than 0` }, { status: 400 });
      }
      if (isNaN(p) || p < 0) {
        return NextResponse.json({ error: `Line ${i + 1} (${it.itemCode || "Item"}): unit price cannot be negative` }, { status: 400 });
      }
    }

    // Calculate line items totals in integer fils
    let subtotalFils = 0;
    const poItemsData = items.map((item: any) => {
      const qty = parseFloat(item.quantity);
      const priceRaw = parseFloat(item.unitPrice);
      const unitPriceFils = Money.toFils(priceRaw);
      const itemDiscountFils = Money.toFils(item.discount || 0);
      const totalFils = Math.round(qty * unitPriceFils) - itemDiscountFils;
      subtotalFils += totalFils;

      return {
        productId: item.productId || null,
        itemCode: item.itemCode,
        itemName: item.itemName,
        quantity: qty,
        unitPrice: unitPriceFils,
        discount: itemDiscountFils,
        total: totalFils,
      };
    });

    const discFils = Money.toFils(discountAmount);
    const shipFils = Money.toFils(shippingAmount);
    const expFils = Money.toFils(otherExpensesAmount);
    const principalFils = Math.max(0, subtotalFils - discFils);
    const vatRateNum = parseFloat(String(vatRate)) || 0;
    const vatAmountFils = Math.round((principalFils * vatRateNum) / 100);
    const grandTotalFils = principalFils + shipFils + expFils + vatAmountFils;

    const purchaseOrder = await prisma.purchaseOrder.create({
      data: {
        poNumber,
        supplierId,
        orderDate: orderDate ? new Date(orderDate) : new Date(),
        expectedDeliveryDate: new Date(expectedDeliveryDate || Date.now() + 14 * 86400000),
        status: "PENDING_APPROVAL",
        currency: poCurrency,
        exchangeRate: poRate,
        subtotal: subtotalFils,
        discountAmount: discFils,
        shippingAmount: shipFils,
        otherExpensesAmount: expFils,
        vatAmount: vatAmountFils,
        grandTotal: grandTotalFils,
        notes,
        createdBy: creatorName,
        items: {
          create: poItemsData,
        },
      },
      include: {
        supplier: true,
        items: true,
      },
    });

    // Create Notification for Admin
    await prisma.notification.create({
      data: {
        title: "New PO Created",
        message: `Purchase Order ${poNumber} for ${purchaseOrder.supplier.name} requires approval.`,
        type: "WARNING",
        linkUrl: `/purchase-orders/${purchaseOrder.id}`,
        recipientRole: "ADMIN",
      },
    });

    const grandTotalDec = grandTotalFils / 100;
    const aedEquiv = (grandTotalDec * poRate).toFixed(2);

    // Audit Log
    await prisma.auditLog.create({
      data: {
        employeeName: creatorName,
        module: "Purchase Orders",
        transactionNumber: poNumber,
        action: "CREATE_PO",
        updatedValue: `Created PO ${poNumber} value ${poCurrency} ${grandTotalDec.toFixed(2)} (AED ${aedEquiv} @ ${poRate})`,
      },
    });

    return NextResponse.json({ purchaseOrder }, { status: 201 });
  } catch (error) {
    console.error("Error creating purchase order:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
