#!/usr/bin/env node
/**
 * System cleanup — removes ALL dummy/demo data while keeping system settings + audit trail.
 * Run ONCE locally (not an HTTP route — the app has no auth, so never expose this as an endpoint).
 * Usage: node scripts/cleanup-system.js
 * Safety: KEEPS Setting (9 rows), AuditLog (writes its own SYSTEM_CLEANUP row), BankAccount masters.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('=== Bait Al Hadaf System Cleanup ===');
  const count = async (m, f) => prisma[m].count(f ? { where: f } : {});

  // --- Before counts (report only) ---
  const before = {
    Setting: await count('setting'),
    AuditLog: await count('auditLog'),
    Supplier: await count('supplier'),
    Product: await count('product'),
    PurchaseOrder: await count('purchaseOrder'),
    Payment: await count('payment'),
    PurchaseInvoice: await count('purchaseInvoice'),
    GoodsReceivedNote: await count('goodsReceivedNote'),
    BankAccount: await count('bankAccount'),
    BankTransaction: await count('bankTransaction'),
    Notification: await count('notification'),
  };
  console.log('Before:', before);

  // --- Accounting tables ( exist after Phase 2; guard for older schema ) ---
  const acctTables = ['journalLine','journalEntry','expense','account'];
  let hasJournal = false;
  try { await prisma.journalEntry.count(); hasJournal = true; } catch {}

  // --- Delete in dependency order (children first, Restrict FKs) ---
  // 1. Documents reference 5 parents — delete first
  await prisma.document.deleteMany({});
  console.log('Document cleared');

  // 2. Direct child tables
  await prisma.supplierQuotation.deleteMany({});
  await prisma.payment.deleteMany({});
  console.log('SupplierQuotation + Payment cleared');

  // 3. Items (these have Cascade from parent, but explicit deleteMany retries cleanly)
  //    Order matters for Restrict children — delete child rows, then parent, then their items
  await prisma.purchaseReturnItem.deleteMany({});
  await prisma.purchaseReturn.deleteMany({});
  await prisma.invoiceItem.deleteMany({});
  await prisma.purchaseInvoice.deleteMany({});
  await prisma.grnItem.deleteMany({});
  await prisma.goodsReceivedNote.deleteMany({});
  await prisma.landedCostItem.deleteMany({});
  await prisma.landedCost.deleteMany({});
  console.log('Returns, Invoices, GRNs, LandedCosts cleared');

  // 4. PO items then POs
  await prisma.purchaseOrderItem.deleteMany({});
  await prisma.purchaseOrder.deleteMany({});
  console.log('PurchaseOrders cleared');

  // 5. Stock & bank transactions
  await prisma.stockMovement.deleteMany({});
  await prisma.bankTransaction.deleteMany({});
  console.log('StockMovements + BankTransactions cleared');

  // 6. Shipments, then masters
  await prisma.shipment.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.supplier.deleteMany({});
  console.log('Shipments, Products, Suppliers cleared');

  // 7. Accounting tables (Phase 2) — delete lines before entries (cascade), then expenses, then non-system accounts
  if (hasJournal) {
    await prisma.journalLine.deleteMany({});
    await prisma.journalEntry.deleteMany({});
    console.log('JournalLine + JournalEntry cleared');
    if (acctTables.includes('expense')) {
      try { await prisma.expense.deleteMany({}); console.log('Expense cleared'); } catch {}
    }
    if (acctTables.includes('account')) {
      try {
        await prisma.account.updateMany({ where: { isSystem: false }, data: { status: 'INACTIVE' } });
        console.log('Non-system Accounts deactivated (kept for history)');
      } catch {}
    }
  }

  // 8. Notifications (transient)
  await prisma.notification.deleteMany({});
  console.log('Notifications cleared');

  // --- Write audit row (keep trail) ---
  await prisma.auditLog.create({
    data: {
      employeeName: 'Admin',
      module: 'System',
      transactionNumber: 'SYS-CLEANUP',
      action: 'SYSTEM_CLEANUP',
      updatedValue: `Cleared dummy data: PO ${before.PurchaseOrder}, Invoice ${before.PurchaseInvoice}, Payment ${before.Payment}, GRN ${before.GoodsReceivedNote}, Supplier ${before.Supplier}, Product ${before.Product}, BankTransaction ${before.BankTransaction}. Kept Setting (${before.Setting}) + BankAccount masters.`,
    },
  });

  // --- After counts ---
  const after = {
    Setting: await count('setting'),
    AuditLog: await count('auditLog'),
    Supplier: await count('supplier'),
    Product: await count('product'),
    PurchaseOrder: await count('purchaseOrder'),
    Payment: await count('payment'),
    PurchaseInvoice: await count('purchaseInvoice'),
    GoodsReceivedNote: await count('goodsReceivedNote'),
    BankAccount: await count('bankAccount'),
    BankTransaction: await count('bankTransaction'),
    Notification: await count('notification'),
  };
  console.log('After:', after);
  console.log('=== Cleanup complete ===');
}

main()
  .catch((e) => { console.error('Cleanup failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
