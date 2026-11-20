#!/usr/bin/env node
/**
 * Seeds the base Chart of Accounts (codes 1010-6050) into the database.
 * Run once after `npx prisma db push`. Safe to re-run: system accounts are
 * only created once (isSystem guard).
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const ACCOUNTS = [
  { code: "1010", name: "Cash on Hand", type: "ASSET", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "1020", name: "Bank Account", type: "ASSET", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "1030", name: "VAT Input", type: "ASSET", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "1040", name: "Inventory", type: "ASSET", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "2010", name: "Accounts Payable", type: "LIABILITY", balanceType: "NORMAL_CREDIT", openingBalance: 0, isSystem: true },
  { code: "2020", name: "VAT Output", type: "LIABILITY", balanceType: "NORMAL_CREDIT", openingBalance: 0, isSystem: true },
  { code: "2025", name: "Purchase Clearing", type: "LIABILITY", balanceType: "NORMAL_CREDIT", openingBalance: 0, isSystem: true },
  { code: "2040", name: "Advances to Suppliers", type: "LIABILITY", balanceType: "NORMAL_CREDIT", openingBalance: 0, isSystem: true },
  { code: "5010", name: "Purchases", type: "EXPENSE", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "6010", name: "Shipping Expenses", type: "EXPENSE", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "6020", name: "Customs Clearance", type: "EXPENSE", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "6030", name: "Clearing Fees", type: "EXPENSE", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "6040", name: "Transport Costs", type: "EXPENSE", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
  { code: "6050", name: "Office Expenses / General", type: "EXPENSE", balanceType: "NORMAL_DEBIT", openingBalance: 0, isSystem: true },
];

async function main() {
  console.log("Seeding Chart of Accounts...");
  let created = 0;
  for (const a of ACCOUNTS) {
    const rec = await prisma.account.upsert({
      where: { code: a.code },
      update: { name: a.name, type: a.type, balanceType: a.balanceType, isSystem: true },
      create: { ...a },
    });
    created++;
    console.log(`  ${rec.code} ${rec.name}`);
  }

  // Opening journals for cash/bank with no opening balances
  for (const a of ACCOUNTS) {
    if (!a.isSystem || a.openingBalance !== 0) continue;
    // skip accounts with default openingBalance 0 — no journal needed.
  }

  console.log(`Seeded ${created} accounts`);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); process.exit(1); });
