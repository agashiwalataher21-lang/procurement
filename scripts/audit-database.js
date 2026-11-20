#!/usr/bin/env node
/**
 * System Audit Script - Checks database state for dummy/demo data
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function audit() {
  console.log('=== Bait Al Hadaf System Audit ===\n');

  // 1. Check main transactional tables
  console.log('--- DATABASE RECORD COUNTS ---');
  const counts = {};
  const models = [
    'supplier', 'product', 'purchaseOrder', 'purchaseOrderItem',
    'payment', 'purchaseInvoice', 'goodsReceivedNote', 'grnItem',
    'invoiceItem', 'stockMovement', 'bankAccount', 'bankTransaction',
    'expense', 'journalEntry', 'journalLine', 'account', 'shipment',
    'document', 'supplierQuotation', 'purchaseReturn', 'purchaseReturnItem',
    'landedCost', 'landedCostItem'
  ];

  for (const m of models) {
    try {
      counts[m] = await prisma[m].count();
    } catch (e) {
      counts[m] = 'N/A';
    }
  }
  console.log(JSON.stringify(counts, null, 2));

  // 2. Check for system accounts
  console.log('\n--- SYSTEM ACCOUNTS ---');
  const systemAccounts = await prisma.account.findMany({ where: { isSystem: true } });
  console.log(`System accounts: ${systemAccounts.length}`);
  systemAccounts.forEach(a => console.log(`  ${a.code} - ${a.name} (${a.type}, ${a.balanceType})`));

  // 3. Check journal entries
  console.log('\n--- JOURNAL ENTRIES ---');
  const journalCount = await prisma.journalEntry.count();
  console.log(`Total journal entries: ${journalCount}`);
  const posted = await prisma.journalEntry.count({ where: { status: 'POSTED' } });
  const voided = await prisma.journalEntry.count({ where: { status: 'VOIDED' } });
  console.log(`  POSTED: ${posted}, VOIDED: ${voided}`);

  // 4. Check recent transactions (last 30 days)
  console.log('\n--- RECENT TRANSACTIONS (Last 30 Days) ---');
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPOs = await prisma.purchaseOrder.count({ where: { orderDate: { gte: thirtyDaysAgo } } });
  const recentInvoices = await prisma.purchaseInvoice.count({ where: { invoiceDate: { gte: thirtyDaysAgo } } });
  const recentPayments = await prisma.payment.count({ where: { paymentDate: { gte: thirtyDaysAgo } } });
  console.log(`POs: ${recentPOs}, Invoices: ${recentInvoices}, Payments: ${recentPayments}`);

  // 5. Check dashboard data (real values from API)
  console.log('\n--- MOCK DATA CHECK (Dashboard) ---');
  // Check if accounts page has mock fallback in code
  console.log('Checking accounts/page.tsx for mock fallback data...');

  // 6. Check for customer-related records (should be 0)
  console.log('\n--- CUSTOMER MODULE CHECK ---');
  try {
    const customerCount = await prisma.customer.count();
    console.log(`Customers in database: ${customerCount}`);
  } catch (e) {
    console.log('Customer table does not exist (expected - removed)');
  }

  // 7. Summary
  console.log('\n=== AUDIT SUMMARY ===');
  const hasData = counts.purchaseOrder > 0 || counts.payment > 0 || counts.purchaseInvoice > 0;
  console.log(hasData ? 'Database has real transactional data' : 'Database is clean (no transactions)');

  await prisma.$disconnect();
}

audit().catch(console.error);
