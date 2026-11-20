import { PrismaClient } from "@prisma/client"
import * as fs from "fs"

const prisma = new PrismaClient()
const NL = String.fromCharCode(10)

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
]

async function main() {
  console.log("=== MONEY MIGRATION: Float -> Int (fils) ===" + NL)
  const backupPath = "backups/dev.db.bak"
  if (!fs.existsSync(backupPath)) {
    throw new Error("Backup not found at " + backupPath + ". Please run: cp prisma/dev.db " + backupPath)
  }
  console.log("Backup verified at " + backupPath + NL)

  let totalRows = 0
  for (const m of MIGRATION_CONFIG) {
    const table = m.table
    const cols = m.cols
    console.log("Processing: " + table + " (" + cols.join(", ") + ")")

    const exists = await prisma.$queryRawUnsafe<any[]>(
      "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
      table
    )
    if (!exists || exists.length === 0) {
      console.log("  Skip: table does not exist" + NL)
      continue
    }

    const info = await prisma.$queryRawUnsafe<any[]>("PRAGMA table_info(\"" + table + "\")")
    const newDefs = info.map((c: any) => {
      if (cols.includes(c.name)) return "\"" + c.name + "\" INTEGER"
      return "\"" + c.name + "\" " + c.type
    })

    const createSql = "CREATE TABLE \"" + table + "_new\" (" + NL + "  " + newDefs.join("," + NL + "  ") + NL + ")"
    const insCols = info.map((c: any) => "\"" + c.name + "\"").join(", ")
    const selCols = info.map((c: any) => {
      if (cols.includes(c.name)) return "CAST(ROUND(\"" + c.name + "\" * 100) AS INTEGER)"
      return "\"" + c.name + "\""
    }).join(", ")

    try {
      await prisma.$transaction(async (tx) => {
        await tx.$executeRawUnsafe(createSql)
        await tx.$executeRawUnsafe(
          "INSERT INTO \"" + table + "_new\" (" + insCols + ") SELECT " + selCols + " FROM \"" + table + "\""
        )
        await tx.$executeRawUnsafe("DROP TABLE \"" + table + "\"")
        await tx.$executeRawUnsafe("ALTER TABLE \"" + table + "_new\" RENAME TO \"" + table + "\"")
      })
      const count = await prisma.$queryRawUnsafe<any[]>("SELECT COUNT(*) as r FROM \"" + table + "\"")
      const r = Number(count[0].r)
      totalRows += r
      console.log("  OK: " + r + " rows" + NL)
    } catch (err: any) {
      console.error("  FAIL: " + err.message + NL)
      throw err
    }
  }

  console.log("=== MIGRATION COMPLETE ===" + NL)
  console.log("Total rows copied: " + totalRows + NL)

  const po = await prisma.purchaseOrder.findFirst({ select: { poNumber: true, grandTotal: true } })
  const pay = await prisma.payment.findFirst({ select: { paymentNumber: true, amount: true } })
  const inv = await prisma.purchaseInvoice.findFirst({ select: { invoiceNumber: true, grandTotal: true } })
  console.log("Sample records:")
  console.log("  PO " + po?.poNumber + ": grandTotal = " + po?.grandTotal + " (fils)")
  console.log("  Payment " + pay?.paymentNumber + ": amount = " + pay?.amount + " (fils)")
  console.log("  Invoice " + inv?.invoiceNumber + ": grandTotal = " + inv?.grandTotal + " (fils)" + NL)

  await prisma.$disconnect()
}

main().catch((e: any) => {
  console.error("FAILED:", e.message)
  process.exit(1)
})