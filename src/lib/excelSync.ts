/**
 * Excel Sync Bridge — Bait Al Hadaf ERP
 * Bridges Zoho (sales) ↔ Local SQLite (procurement + inventory)
 * Uses SheetJS (xlsx ^0.18.5) already installed in package.json
 *
 * EXPORT: Produces multi-sheet Excel workbooks for sharing with Zoho / management
 * IMPORT: Reads Zoho-exported Excel files and upserts local records
 */

import * as XLSX from "xlsx";
import { prisma } from "@/lib/prisma";
import { Money } from "@/lib/decimal";

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────
export interface ExcelSyncResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

export interface SyncOptions {
  /** ISO date string — only process records on/after this date */
  since?: string;
  /** Whether to overwrite existing local records with Zoho data */
  overwrite?: boolean;
  /** User name to stamp on audit logs */
  createdBy?: string;
}

// ─────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────

/** Convert Excel serial date (number or string) to JS Date */
function excelDateToJs(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof v === "number") {
    // Excel epoch: Dec 30 1899
    return new Date((v - 25569) * 86400 * 1000);
  }
  return null;
}

function num(v: unknown, fallback = 0): number {
  const n = parseFloat(String(v ?? ""));
  return isNaN(n) ? fallback : n;
}

function str(v: unknown, fallback = ""): string {
  return v != null ? String(v).trim() : fallback;
}

// ─────────────────────────────────────────────
// SECTION 1 — EXPORT
// ─────────────────────────────────────────────

/**
 * Generate a full ERP export workbook (Buffer) with sheets:
 *   1. Sales Invoices
 *   2. Sales Receipts
 *   3. Purchase Orders
 *   4. Purchase Invoices
 *   5. Products (inventory snapshot)
 *   6. Chart of Accounts
 *   7. P&L Summary
 */
export async function exportToExcel(opts: SyncOptions = {}): Promise<Buffer> {
  const since = opts.since ? new Date(opts.since) : undefined;

  // ── 1. Sales Invoices ──────────────────────────────────
  const salesInvoices = await prisma.salesInvoice.findMany({
    where: since ? { invoiceDate: { gte: since } } : undefined,
    include: { items: true, payments: { where: { status: "APPROVED" } } },
    orderBy: { invoiceDate: "desc" },
  });

  const siRows = salesInvoices.flatMap((inv) => {
    const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
    return inv.items.map((it) => ({
      "Invoice #": inv.invoiceNumber,
      "Customer": inv.customerName,
      "Phone": inv.customerPhone ?? "",
      "Email": inv.customerEmail ?? "",
      "Invoice Date": inv.invoiceDate.toISOString().split("T")[0],
      "Due Date": inv.dueDate?.toISOString().split("T")[0] ?? "",
      "Status": inv.status,
      "Item Code": it.itemCode,
      "Item Name": it.itemName,
      "Qty": it.quantity,
      "Unit Price (AED)": it.unitPrice,
      "Discount (AED)": it.discount,
      "VAT (AED)": it.tax,
      "Line Total (AED)": it.total,
      "Invoice Subtotal": inv.subtotal,
      "Invoice VAT": inv.vatAmount,
      "Invoice Total": inv.grandTotal,
      "Paid (AED)": paid,
      "Balance (AED)": Math.max(0, inv.grandTotal - paid),
      "Currency": inv.currency,
      "Source": inv.source ?? "",
      "Source ID": inv.sourceId ?? "",
      "Notes": inv.notes ?? "",
    }));
  });

  // ── 2. Sales Receipts ──────────────────────────────────
  const salesReceipts = await prisma.salesReceipt.findMany({
    where: since ? { receiptDate: { gte: since } } : undefined,
    include: { salesInvoice: true },
    orderBy: { receiptDate: "desc" },
  });

  const srRows = salesReceipts.map((r) => ({
    "Receipt #": r.receiptNumber,
    "Invoice #": r.salesInvoice?.invoiceNumber ?? "",
    "Customer": r.customerName,
    "Receipt Date": r.receiptDate.toISOString().split("T")[0],
    "Amount (AED)": r.amount,
    "Currency": r.currency,
    "Payment Method": r.paymentMethod,
    "Bank Reference": r.bankReference ?? "",
    "Status": r.status,
    "Notes": r.notes ?? "",
    "Recorded By": r.recordedBy,
  }));

  // ── 3. Purchase Orders ─────────────────────────────────
  const pos = await prisma.purchaseOrder.findMany({
    where: since ? { orderDate: { gte: since } } : undefined,
    include: { supplier: true, items: true },
    orderBy: { orderDate: "desc" },
  });

  const poRows = pos.flatMap((po) =>
    po.items.map((it) => ({
      "PO #": po.poNumber,
      "Supplier": po.supplier?.name ?? "",
      "Order Date": po.orderDate.toISOString().split("T")[0],
      "Expected Delivery": po.expectedDeliveryDate.toISOString().split("T")[0],
      "Status": po.status,
      "Item Code": it.itemCode,
      "Item Name": it.itemName,
      "Qty Ordered": it.quantity,
      "Unit Price (AED)": it.unitPrice,
      "Line Total (AED)": it.total,
      "Currency": po.currency,
    }))
  );

  // ── 4. Purchase Invoices ───────────────────────────────
  const pinvs = await prisma.purchaseInvoice.findMany({
    where: since ? { invoiceDate: { gte: since } } : undefined,
    include: { supplier: true, purchaseOrder: true },
    orderBy: { invoiceDate: "desc" },
  });

  const piRows = pinvs.map((pi) => ({
    "Invoice #": pi.invoiceNumber,
    "Supplier": pi.supplier?.name ?? "",
    "PO #": pi.purchaseOrder?.poNumber ?? "",
    "Invoice Date": pi.invoiceDate.toISOString().split("T")[0],
    "Due Date": pi.dueDate?.toISOString().split("T")[0] ?? "",
    "Status": pi.status,
    "Subtotal (AED)": pi.subtotal,
    "VAT (AED)": pi.vatAmount,
    "Total (AED)": pi.grandTotal,
    "Currency": pi.purchaseOrder?.currency ?? "AED",
    "Notes": pi.notes ?? "",
  }));

  // ── 5. Products / Inventory ────────────────────────────
  const products = await prisma.product.findMany({
    orderBy: { itemName: "asc" },
  });

  const prodRows = products.map((p) => ({
    "Item Code": p.itemCode,
    "Item Name": p.itemName,
    "Category": p.category ?? "",
    "Unit": p.unitOfMeasurement ?? "",
    "Current Stock": p.currentStock,
    "Min Stock Level": p.minStock ?? 0,
    "Purchase Price (AED)": p.defaultPurchasePrice ?? 0,
    "Stock Value (AED)": Money.round((p.defaultPurchasePrice ?? 0) * p.currentStock),
    "Brand": p.brand ?? "",
    "Lead Time (Days)": p.supplierLeadTime ?? 0,
  }));

  // ── 6. Chart of Accounts ──────────────────────────────
  const accounts = await prisma.account.findMany({
    orderBy: { code: "asc" },
  });

  const coaRows = accounts.map((a) => ({
    "Code": a.code,
    "Name": a.name,
    "Type": a.type,
    "Normal Balance": a.balanceType,
    "Active": a.status === "ACTIVE" ? "Yes" : "No",
  }));

  // ── 7. P&L Summary ────────────────────────────────────
  const plSince = since ?? new Date(new Date().getFullYear(), 0, 1); // YTD default
  const [totalSalesRaw, expenseLines] = await Promise.all([
    prisma.salesInvoice.aggregate({
      where: { invoiceDate: { gte: plSince }, status: { notIn: ["DRAFT", "CANCELLED"] } },
      _sum: { grandTotal: true, vatAmount: true },
    }),
    prisma.journalLine.findMany({
      where: {
        journal: {
          date: { gte: plSince },
          status: { not: "VOIDED" },
        },
        account: { type: "EXPENSE" },
      },
      select: { debit: true, credit: true },
    }),
  ]);

  const totalRevenue = totalSalesRaw._sum.grandTotal ?? 0;
  const vatOnSales = totalSalesRaw._sum.vatAmount ?? 0;
  const revenueExVAT = Money.subtract(totalRevenue, vatOnSales);
  const totalExpenses = Money.round(
    expenseLines.reduce((s, l) => s + (l.debit - l.credit), 0)
  );
  const netProfit = Money.subtract(revenueExVAT, totalExpenses);

  const plRows = [
    { "Section": "Revenue", "Description": "Total Sales (incl. VAT)", "Amount (AED)": totalRevenue },
    { "Section": "Revenue", "Description": "VAT on Sales (5%)", "Amount (AED)": -vatOnSales },
    { "Section": "Revenue", "Description": "Net Revenue (ex-VAT)", "Amount (AED)": revenueExVAT },
    { "Section": "Expenses", "Description": "Total Expenses (GL)", "Amount (AED)": -totalExpenses },
    { "Section": "Net", "Description": "Net Profit / Loss", "Amount (AED)": netProfit },
  ];

  // ── Assemble workbook ──────────────────────────────────
  const wb = XLSX.utils.book_new();
  const addSheet = (name: string, rows: Record<string, unknown>[]) => {
    const ws = rows.length > 0 ? XLSX.utils.json_to_sheet(rows) : XLSX.utils.aoa_to_sheet([["No data"]]);
    // Auto-fit columns (approximate)
    if (rows.length > 0) {
      const keys = Object.keys(rows[0]);
      ws["!cols"] = keys.map((k) => ({
        wch: Math.max(k.length, ...rows.map((r) => String(r[k] ?? "").length)) + 2,
      }));
    }
    XLSX.utils.book_append_sheet(wb, ws, name);
  };

  addSheet("Sales Invoices", siRows);
  addSheet("Sales Receipts", srRows);
  addSheet("Purchase Orders", poRows);
  addSheet("Purchase Invoices", piRows);
  addSheet("Inventory", prodRows);
  addSheet("Chart of Accounts", coaRows);
  addSheet("P&L Summary", plRows);

  return Buffer.from(XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

// ─────────────────────────────────────────────
// SECTION 2 — IMPORT (Zoho Sales → Local Sales Invoices)
// ─────────────────────────────────────────────

/**
 * Import sales invoices from a Zoho-exported Excel buffer.
 *
 * Expected sheet name: "Sales Invoices" (or sheet index 0)
 * Required columns:
 *   Invoice Number, Customer Name, Invoice Date, Item Name, Quantity, Unit Price
 * Optional:
 *   Due Date, Phone, Email, Item Code, Discount, Tax, Status, Notes
 */
export async function importSalesFromExcel(
  buffer: Buffer,
  opts: SyncOptions = {}
): Promise<ExcelSyncResult> {
  const result: ExcelSyncResult = { success: false, imported: 0, skipped: 0, errors: [] };
  const createdBy = opts.createdBy ?? "Excel-Import";
  const overwrite = opts.overwrite ?? false;

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch (e: any) {
    result.errors.push(`Failed to parse Excel file: ${e.message}`);
    return result;
  }

  // Find the Sales Invoices sheet
  const sheetName =
    wb.SheetNames.find((n) => n.toLowerCase().includes("sales") && n.toLowerCase().includes("invoice")) ??
    wb.SheetNames[0];
  if (!sheetName) {
    result.errors.push("No sheets found in workbook");
    return result;
  }

  const ws = wb.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  if (rows.length === 0) {
    result.errors.push("Sheet is empty");
    return result;
  }

  // Group rows by Invoice Number (one row per line item in Zoho format)
  const invoiceMap = new Map<string, typeof rows>();
  for (const row of rows) {
    const invNum = str(row["Invoice Number"] ?? row["invoice_number"] ?? row["Invoice #"]);
    if (!invNum) { result.skipped++; continue; }
    if (!invoiceMap.has(invNum)) invoiceMap.set(invNum, []);
    invoiceMap.get(invNum)!.push(row);
  }

  for (const [invoiceNumber, lineRows] of Array.from(invoiceMap)) {
    try {
      const firstRow = lineRows[0];

      // Local invoice number: keep SI- prefix format, tag Zoho originals
      const localInvNumber = invoiceNumber.startsWith("SI-") ? invoiceNumber : `SI-ZH-${invoiceNumber}`;

      // Check if already imported — by number first, then by sourceId (dedup key)
      let existing = await prisma.salesInvoice.findUnique({ where: { invoiceNumber: localInvNumber } });
      if (!existing) {
        existing = await prisma.salesInvoice.findFirst({
          where: { source: "ZOHO", sourceId: invoiceNumber },
        });
      }
      if (existing && !overwrite) {
        result.skipped++;
        continue;
      }

      const customerName = str(firstRow["Customer Name"] ?? firstRow["customer_name"] ?? firstRow["Customer"]);
      if (!customerName) {
        result.errors.push(`${invoiceNumber}: missing Customer Name — skipped`);
        result.skipped++;
        continue;
      }

      const invoiceDate = excelDateToJs(firstRow["Invoice Date"] ?? firstRow["invoice_date"]) ?? new Date();
      const dueDate = excelDateToJs(firstRow["Due Date"] ?? firstRow["due_date"]);
      const sinceDate = opts.since ? new Date(opts.since) : null;
      if (sinceDate && invoiceDate < sinceDate) { result.skipped++; continue; }

      const statusRaw = str(firstRow["Status"] ?? firstRow["status"], "ISSUED").toUpperCase();
      const status = ["DRAFT", "ISSUED", "PARTIALLY_PAID", "PAID", "OVERDUE", "CANCELLED"].includes(statusRaw)
        ? statusRaw
        : "ISSUED";

      // Parse line items
      const parsedItems = lineRows
        .map((row, idx) => {
          const qty = num(row["Quantity"] ?? row["quantity"] ?? row["Qty"], 1);
          const price = num(row["Unit Price"] ?? row["unit_price"] ?? row["Rate"] ?? row["rate"], 0);
          const discount = num(row["Discount"] ?? row["discount"] ?? row["Discount Amount"], 0);
          const tax = num(row["Tax Amount"] ?? row["tax_amount"] ?? row["VAT"] ?? row["vat"], 0);
          const lineTotal = Money.round(Money.multiply(qty, price) - discount + tax);
          return {
            itemCode: str(row["Item Code"] ?? row["item_code"] ?? row["SKU"], `L${idx + 1}`),
            itemName: str(row["Item Name"] ?? row["item_name"] ?? row["Description"], "Item"),
            quantity: qty,
            unitPrice: Money.round(price),
            discount: Money.round(discount),
            tax: Money.round(tax),
            total: lineTotal,
            productId: null as string | null,
          };
        })
        .filter((it) => it.total >= 0);

      if (parsedItems.length === 0) {
        result.errors.push(`${invoiceNumber}: no valid line items — skipped`);
        result.skipped++;
        continue;
      }

      // Try to match products by itemCode
      for (const item of parsedItems) {
        const prod = await prisma.product.findFirst({ where: { itemCode: item.itemCode } });
        if (prod) item.productId = prod.id;
      }

      const subtotal = Money.round(parsedItems.reduce((s, i) => s + i.total, 0));
      const vatAmount = Money.round(parsedItems.reduce((s, i) => s + i.tax, 0));
      const grandTotal = subtotal; // items already include VAT per Zoho format

      if (existing && overwrite) {
        // Delete old items and recreate
        await prisma.salesInvoiceItem.deleteMany({ where: { invoiceId: existing.id } });
        await prisma.salesInvoice.update({
          where: { id: existing.id },
          data: {
            customerName,
            customerPhone: str(firstRow["Phone"] ?? firstRow["phone"]) || null,
            customerEmail: str(firstRow["Email"] ?? firstRow["email"]) || null,
            invoiceDate,
            dueDate,
            subtotal,
            vatAmount,
            grandTotal,
            status: status as any,
            source: "ZOHO",
            sourceId: invoiceNumber,
            notes: str(firstRow["Notes"] ?? firstRow["notes"]) || null,
            items: { create: parsedItems },
          },
        });
      } else {
        // Create fresh
        await prisma.salesInvoice.create({
          data: {
            invoiceNumber: localInvNumber,
            customerName,
            customerPhone: str(firstRow["Phone"] ?? firstRow["phone"]) || null,
            customerEmail: str(firstRow["Email"] ?? firstRow["email"]) || null,
            invoiceDate,
            dueDate,
            currency: str(firstRow["Currency"] ?? firstRow["currency"], "AED"),
            exchangeRate: 1.0,
            subtotal,
            vatAmount,
            grandTotal,
            status: status as any,
            source: "ZOHO",
            sourceId: invoiceNumber, // original Zoho ID for deduplication
            notes: str(firstRow["Notes"] ?? firstRow["notes"]) || null,
            createdBy,
            items: { create: parsedItems },
          },
        });
      }

      // Audit log
      await prisma.auditLog.create({
        data: {
          employeeName: createdBy,
          module: "Excel Sync",
          transactionNumber: invoiceNumber,
          action: existing && overwrite ? "EXCEL_SYNC_UPDATE" : "EXCEL_SYNC_IMPORT",
          updatedValue: `Synced from Zoho: ${invoiceNumber} — ${customerName} — AED ${grandTotal.toFixed(2)}`,
        },
      });

      result.imported++;
    } catch (err: any) {
      result.errors.push(`${invoiceNumber}: ${err.message}`);
      result.skipped++;
    }
  }

  result.success = result.errors.length === 0 || result.imported > 0;
  return result;
}

// ─────────────────────────────────────────────
// SECTION 3 — IMPORT (Zoho Products/Inventory → Local Products)
// ─────────────────────────────────────────────

/**
 * Sync product catalog from Zoho Inventory export.
 * Expected columns: Item Code, Item Name, Unit, Quantity on Hand, Purchase Rate, Sales Rate, Category
 */
export async function importProductsFromExcel(
  buffer: Buffer,
  opts: SyncOptions = {}
): Promise<ExcelSyncResult> {
  const result: ExcelSyncResult = { success: false, imported: 0, skipped: 0, errors: [] };
  const createdBy = opts.createdBy ?? "Excel-Import";
  const overwrite = opts.overwrite ?? false;

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: "buffer", cellDates: true });
  } catch (e: any) {
    result.errors.push(`Failed to parse Excel: ${e.message}`);
    return result;
  }

  const sheetName =
    wb.SheetNames.find((n) =>
      n.toLowerCase().includes("item") || n.toLowerCase().includes("product") || n.toLowerCase().includes("inventory")
    ) ?? wb.SheetNames[0];

  const ws = wb.Sheets[sheetName];
  const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

  for (const row of rows) {
    const itemCode = str(row["Item Code"] ?? row["item_code"] ?? row["SKU"] ?? row["sku"]);
    const itemName = str(row["Item Name"] ?? row["item_name"] ?? row["Description"]);
    if (!itemCode || !itemName) { result.skipped++; continue; }

    try {
      const existing = await prisma.product.findFirst({ where: { itemCode } });

      const data = {
        itemName,
        category: str(row["Category"] ?? row["category"], "Motorcycle Spare Parts"),
        unitOfMeasurement: str(row["Unit"] ?? row["unit"] ?? row["UOM"], "PCS"),
        currentStock: num(row["Quantity on Hand"] ?? row["stock"] ?? row["opening_stock"], 0),
        defaultPurchasePrice: num(row["Purchase Rate"] ?? row["purchase_rate"] ?? row["Cost Price"], 0),
        minStock: num(row["Reorder Point"] ?? row["reorder_level"] ?? row["Min Stock"], 10),
        supplierLeadTime: Math.round(num(row["Lead Time"] ?? row["lead_time"], 14)),
      };

      if (existing) {
        if (!overwrite) { result.skipped++; continue; }
        await prisma.product.update({ where: { id: existing.id }, data });
      } else {
        await prisma.product.create({ data: { itemCode, ...data } });
      }

      await prisma.auditLog.create({
        data: {
          employeeName: createdBy,
          module: "Excel Sync",
          transactionNumber: itemCode,
          action: existing ? "EXCEL_SYNC_PRODUCT_UPDATE" : "EXCEL_SYNC_PRODUCT_CREATE",
          updatedValue: `Product ${itemCode} — ${itemName} synced from Zoho`,
        },
      });

      result.imported++;
    } catch (err: any) {
      result.errors.push(`${itemCode}: ${err.message}`);
      result.skipped++;
    }
  }

  result.success = result.errors.length === 0 || result.imported > 0;
  return result;
}
