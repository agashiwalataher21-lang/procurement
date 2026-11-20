import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { postSalesInvoice } from "@/lib/posting";
import { Money } from "@/lib/decimal";
import { getCurrentUser } from "@/lib/auth";

const VALID_STATUSES = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const customer = searchParams.get("customer");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const since = searchParams.get("since");

    const where: any = {};
    if (customer) where.customerName = { contains: customer, mode: "insensitive" };
    if (status) where.status = status;
    if (since) where.invoiceDate = { gte: new Date(since) };
    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
      ];
    }

    const invoices = await prisma.salesInvoice.findMany({
      where,
      orderBy: { invoiceDate: "desc" },
      include: {
        items: { include: { product: true } },
        payments: true,
      },
    });

    // Computed fields for each invoice
    const enriched = invoices.map((inv) => {
      const paid = inv.payments
        .filter((p) => p.status === "APPROVED")
        .reduce((s, p) => s + p.amount, 0);
      return {
        ...inv,
        paidAmount: paid,
        balance: Math.max(0, inv.grandTotal - paid),
      };
    });

    const totalSales = enriched.reduce((s, i) => s + i.grandTotal, 0);
    const totalPaid = enriched.reduce((s, i) => s + i.paidAmount, 0);
    const totalBalance = enriched.reduce((s, i) => s + i.balance, 0);

    return NextResponse.json({
      invoices: enriched,
      summary: {
        totalInvoices: enriched.length,
        totalSales,
        totalPaid,
        totalBalance,
      },
    });
  } catch (error) {
    console.error("Error fetching sales invoices:", error);
    return NextResponse.json({ error: "Failed to fetch sales invoices" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser(request);
    const creatorName = user?.name || "Admin";

    const body = await request.json();
    const {
      customerName,
      customerPhone,
      customerEmail,
      invoiceDate,
      dueDate,
      currency = "AED",
      exchangeRate = 1.0,
      items, // [{ productId?, itemCode, itemName, quantity, unitPrice, discount?, tax? }]
      discountAmount = 0,
      vatRate = 5,
      notes,
      status = "ISSUED",
      source,
      sourceId,
      salesAccountCode,
    } = body;
    const createdBy = creatorName;

    // --- Validation ---
    if (!customerName || !customerName.trim()) {
      return NextResponse.json({ error: "Customer name is required" }, { status: 400 });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "At least one line item is required" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status: ${status}` }, { status: 400 });
    }

    // Parse and validate line items
    const parsedItems = items.map((it: any, idx: number) => {
      const qty = parseFloat(it.quantity);
      const price = parseFloat(it.unitPrice);
      const discount = parseFloat(it.discount) || 0;
      const tax = parseFloat(it.tax) || 0;
      if (isNaN(qty) || qty <= 0) {
        throw new Error(`Item ${idx + 1}: quantity must be a positive number`);
      }
      if (isNaN(price) || price < 0) {
        throw new Error(`Item ${idx + 1}: unit price must be non-negative`);
      }
      const lineTotal = Money.round(Money.multiply(qty, price) - discount + tax);
      return {
        productId: it.productId || null,
        itemCode: (it.itemCode || `SALES-${idx + 1}`).toString(),
        itemName: (it.itemName || "Sales Item").toString(),
        quantity: qty,
        unitPrice: Money.round(price),
        discount: Money.round(discount),
        tax: Money.round(tax),
        total: lineTotal,
      };
    });

    const subtotal = Money.round(parsedItems.reduce((s, i) => s + i.total, 0));
    const disc = Money.round(parseFloat(discountAmount) || 0);
    const principal = Math.max(0, Money.subtract(subtotal, disc));
    const vatRateNum = parseFloat(String(vatRate)) || 0;
    const vatAmount = Money.calculateVAT(principal, vatRateNum);
    const grandTotal = Money.add(principal, vatAmount);

    if (grandTotal <= 0) {
      return NextResponse.json({ error: "Invoice total must be greater than 0" }, { status: 400 });
    }

    // Auto-generate invoice number: SI-YYYY-XXXX
    const year = new Date().getFullYear();
    const count = await prisma.salesInvoice.count();
    const invoiceNumber = `SI-${year}-${String(count + 1).padStart(4, "0")}`;

    const invoice = await prisma.$transaction(async (tx) => {
      const inv = await tx.salesInvoice.create({
        data: {
          invoiceNumber,
          customerName: customerName.trim(),
          customerPhone: customerPhone || null,
          customerEmail: customerEmail || null,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          currency,
          exchangeRate: parseFloat(exchangeRate) || 1.0,
          subtotal,
          discountAmount: disc,
          vatAmount,
          grandTotal,
          status,
          source: source || null,
          sourceId: sourceId || null,
          notes: notes || null,
          createdBy,
          items: { create: parsedItems },
        },
        include: { items: true, payments: true },
      });

      // Stock issue: decrement product stock (only if ISSUED or above, not DRAFT)
      if (status !== "DRAFT" && status !== "CANCELLED") {
        for (const it of parsedItems) {
          if (it.productId) {
            const prod = await tx.product.findUnique({ where: { id: it.productId } });
            if (!prod) {
              throw new Error(`Product not found for item ${it.itemCode}`);
            }
            if (prod.currentStock < it.quantity) {
              throw new Error(
                `Insufficient stock for ${prod.itemName}: have ${prod.currentStock}, need ${it.quantity}`
              );
            }
            await tx.product.update({
              where: { id: it.productId },
              data: { currentStock: { decrement: it.quantity } },
            });
            await tx.stockMovement.create({
              data: {
                productId: it.productId,
                itemCode: it.itemCode,
                movementType: "STOCK_ISSUE",
                quantity: -it.quantity,
                unitCost: it.unitPrice,
                totalCost: round2(it.quantity * it.unitPrice),
                referenceNumber: invoiceNumber,
                responsibleEmployee: createdBy,
                notes: `Sales invoice ${invoiceNumber}: issued to ${customerName}`,
              },
            });
          }
        }
      }

      // Post GL journal (Dr AR, Cr Sales, Cr VAT Output) — only for ISSUED and above
      if (status !== "DRAFT") {
        await postSalesInvoice(tx, {
          ...inv,
          salesAccountCode,
          customerName,
        });
      }

      // Audit log
      await tx.auditLog.create({
        data: {
          employeeName: createdBy,
          module: "Sales Invoices",
          transactionNumber: invoiceNumber,
          action: "CREATE_SALES_INVOICE",
          updatedValue: `Created sales invoice ${invoiceNumber} for ${customerName} — ${currency} ${grandTotal.toFixed(2)}`,
        },
      });

      // Notification
      await tx.notification.create({
        data: {
          title: "Sales Invoice Created",
          message: `${invoiceNumber}: ${currency} ${grandTotal.toFixed(2)} billed to ${customerName}.`,
          type: "SUCCESS",
          linkUrl: `/sales-invoices`,
        },
      });

      return inv;
    });

    return NextResponse.json({ invoice }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating sales invoice:", error);
    return NextResponse.json({ error: error.message || "Failed to create sales invoice" }, { status: 500 });
  }
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
