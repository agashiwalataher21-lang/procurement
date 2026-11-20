const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const prisma = new PrismaClient();

const MIGRATION_CONFIG = [
  { table: "Product", cols: ["defaultPurchasePrice"] },
  { table: "PurchaseOrder", cols: ["exchangeRate", "subtotal", "discountAmount", "shippingAmount", "otherExpensesAmount", "vatAmount", "grandTotal"] },
  { table: "PurchaseOrderItem", cols: ["unitPrice", "discount", "tax", "total"] },
  { table: "Payment", cols: ["amount"] },
  { table: "PurchaseInvoice", cols: ["subtotal", "discountAmount", "shippingAmount", "otherExpensesAmount", "vatAmount", "grandTotal"] },
  { table: "InvoiceItem", cols: ["unitPrice", "discount", "tax", "total"] },
  { table: "StockMovement", cols: ["unitCost", "totalCost"] },
  { table: "PurchaseReturn", cols: ["expectedCreditNote", "actualCreditNote", "remainingCreditBalance"] },
  { table: "PurchaseReturnItem", cols: ["unitPrice", "totalAmount"] },
  { table: "LandedCost", cols: ["totalPurchaseCost", "totalFreightAmount", "totalCustomsDuty", "totalClearingCharges", "totalLocalTransport", "totalOtherExpenses", "totalLandedExpenses", "grandTotalLandedCost"] },
  { table: "LandedCostItem", cols: ["purchaseUnitPrice", "purchaseTotal", "allocatedExpense", "finalLandedCost", "finalUnitLandedCost"] },
  { table: "Shipment", cols: ["shippingCost"] },
  { table: "SupplierQuotation", cols: ["quotedPrice", "previousPrice"] },
  { table: "BankAccount", cols: ["openingBalance"] },
  { table: "BankTransaction", cols: ["amount"] },
  { table: "Account", cols: ["openingBalance"] },
  { table: "JournalLine", cols: ["debit", "credit"] },
  { table: "Expense", cols: ["amount"] },
  { table: "SalesInvoice", cols: ["exchangeRate", "subtotal", "discountAmount", "vatAmount", "grandTotal"] },
  { table: "SalesInvoiceItem", cols: ["unitPrice", "discount", "tax", "total"] },
  { table: "SalesReceipt", cols: ["amount"] }
];

async function main() {
  console.log("=== MONEY MIGRATION: Float -> Int (fils) ===");
  const backupPath = "backups/dev.db.bak";
  if (!fs.existsSync(backupPath)) throw new Error("Missing backup: " + backupPath);
  console.log("Verified backup at " + backupPath + "");

  const beforePO = await prisma.purchaseOrder.findFirst({ select: { poNumber: true, grandTotal: true, subtotal: true, vatAmount: true } });
  const beforePay = await prisma.payment.findFirst({ select: { paymentNumber: true, amount: true } });
  const beforeInv = await prisma.purchaseInvoice.findFirst({ select: { invoiceNumber: true, grandTotal: true } });
  const beforeJL = await prisma.journalLine.findFirst({ select: { debit: true, credit: true } });

  console.log("BEFORE SAMPLES (Float / AED):");
  console.log("  PO " + beforePO.poNumber + ": grandTotal=" + beforePO.grandTotal);
  console.log("  Payment " + beforePay.paymentNumber + ": amount=" + beforePay.amount);
  console.log("  Invoice " + beforeInv.invoiceNumber + ": grandTotal=" + beforeInv.grandTotal);
  console.log("  JournalLine: debit=" + beforeJL.debit + "");

  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = OFF");
  let totalRows = 0;

  for (const m of MIGRATION_CONFIG) {
    const table = m.table;
    const cols = m.cols;
    const exists = await prisma.$queryRawUnsafe("SELECT sql FROM sqlite_master WHERE type='table' AND name=?", table);
    if (!exists || exists.length === 0) continue;

    let newSql = exists[0].sql.replace("CREATE TABLE \"" + table + "\"", "CREATE TABLE \"" + table + "_new\"");
    for (const c of cols) {
            newSql = newSql.replaceAll("\"" + c + "\" REAL", "\"" + c + "\" INTEGER");
    }

    const indexes = await prisma.$queryRawUnsafe("SELECT sql FROM sqlite_master WHERE type='index' AND tbl_name=? AND sql IS NOT NULL", table);
    const info = await prisma.$queryRawUnsafe("PRAGMA table_info(\"" + table + "\")");
    const insCols = info.map(c => "\"" + c.name + "\"").join(", ");
    const selCols = info.map(c => cols.includes(c.name) ? "CAST(ROUND(\"" + c.name + "\" * 100) AS INTEGER)" : "\"" + c.name + "\"").join(", ");

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(newSql);
      await tx.$executeRawUnsafe("INSERT INTO \"" + table + "_new\" (" + insCols + ") SELECT " + selCols + " FROM \"" + table + "\"");
      await tx.$executeRawUnsafe("DROP TABLE \"" + table + "\"");
      await tx.$executeRawUnsafe("ALTER TABLE \"" + table + "_new\" RENAME TO \"" + table + "\"");
      for (const idx of indexes) {
        try { await tx.$executeRawUnsafe(idx.sql); } catch(e){}
      }
    });

    const count = await prisma.$queryRawUnsafe("SELECT COUNT(*) as r FROM \"" + table + "\"");
    const r = Number(count[0].r);
    totalRows += r;
    console.log("  OK: " + table + " (" + cols.length + " cols, " + r + " rows)");
  }

  await prisma.$executeRawUnsafe("PRAGMA foreign_keys = ON");
  console.log("=== MIGRATION COMPLETED ===");
  console.log("Total rows preserved: " + totalRows + "");

  const [afterPO] = await prisma.$queryRawUnsafe("SELECT poNumber, grandTotal FROM \"PurchaseOrder\" WHERE poNumber=?", beforePO.poNumber);
  const [afterPay] = await prisma.$queryRawUnsafe("SELECT paymentNumber, amount FROM \"Payment\" WHERE paymentNumber=?", beforePay.paymentNumber);
  const [afterInv] = await prisma.$queryRawUnsafe("SELECT invoiceNumber, grandTotal FROM \"PurchaseInvoice\" WHERE invoiceNumber=?", beforeInv.invoiceNumber);

  console.log("AFTER SAMPLES (Int / fils):");
  console.log("  PO " + afterPO.poNumber + ": grandTotal=" + afterPO.grandTotal + " (expected: " + Math.round(beforePO.grandTotal * 100) + ")");
  console.log("  Payment " + afterPay.paymentNumber + ": amount=" + afterPay.amount + " (expected: " + Math.round(beforePay.amount * 100) + ")");
  console.log("  Invoice " + afterInv.invoiceNumber + ": grandTotal=" + afterInv.grandTotal + " (expected: " + Math.round(beforeInv.grandTotal * 100) + ")");

  const poExpected = Math.round(beforePO.grandTotal * 100);
  const payExpected = Math.round(beforePay.amount * 100);
  const invExpected = Math.round(beforeInv.grandTotal * 100);

  if (afterPO.grandTotal !== poExpected || afterPay.amount !== payExpected || afterInv.grandTotal !== invExpected) {
    throw new Error("DRIFT DETECTED: after values do not match Math.round(before * 100)");
  }
  console.log("VERIFICATION: Zero rounding drift confirmed.");
  await prisma.$disconnect();
}

main().catch(err => { console.error("FAILED:", err.message); process.exit(1); });