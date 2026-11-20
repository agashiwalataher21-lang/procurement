# Project Memory Index

- [System Cleanup & Accounts Module Plan](.claude/plans/frolicking-purring-pixel.md) — approved plan for cleanup + double-entry accounting implementation.

- [Chart of Accounts Seeded](scripts/seed-charts.js) — 14 base accounts (Cash 1010, Bank 1020, VAT Input 1030, Inventory 1040, AP 2010, VAT Output 2020, Purchase Clearing 2025, Purchases 5010, various expenses 6010-6050).

- [Posting Engine Created](src/lib/posting.ts) — functions: `postPurchaseGrn`, `postPurchaseInvoice`, `postSupplierPayment`, `postExpense`, `postBankTransaction`, `reverseJournal`, `reverseAllForSource`, `getLedgerTransactions`, `getAccountBalance`.

- [API Routes Updated](src/app/api/):
  - `purchase-invoices/route.ts` — posts journal on invoice creation
  - `grn/route.ts` — posts journal on GRN confirmation
  - `payments/route.ts` — posts journal + creates BankTransaction on payment
  - `banking/transactions/route.ts` — posts journal on bank transaction creation
  - `expenses/` — new CRUD API for expenses with journal posting
  - `accounts/chart-of-accounts/` — CRUD for accounts
  - `accounts/journal/` — manual journal entries with balancing
  - `accounts/ledgers/` — account list + individual ledger detail
  - `reports/route.ts` — extended with reports 14-18 (Trial Balance, P&L, Balance Sheet, Cash Flow, Supplier Outstanding)

- [PO Void Behavior](src/app/api/purchase-orders/[id]/route.ts) — changed from hard-delete cascade to soft-delete with reversal journals (keeps financial history).

- [Backup Taken](Backups/dev-2026-11-09-170930.db) — 282 KB, SQLite database before Phase 2 schema changes.

- [Chart of Accounts Data](prisma/dev.db) — 14 system accounts (isSystem: true, status: ACTIVE), cannot be deleted.
