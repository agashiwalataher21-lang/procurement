# PHASE 0 — DISCOVERY REPORT
Date: 2026-11-16 · Scope: **P0 only** (Phase 2/3 skipped unless scope changes)

> A prior session left the repo mid-edit. This report first documents the **repair** performed
> before any new work, then the verified state of the codebase, the confirmed decisions, the
> file-by-file change plan, the migration plan, the rollback plan, and the hard safety limits.

---

## 0. Prior-session repair (done before this report)

The previous session ended in an **unsafe state**: `src/lib/decimal.ts` had been changed to
round money to the nearest integer (`Math.round(n)`) even though the database still stores all
money columns as `REAL` (Float, in AED). Any new write would have rounded `11787.30 → 11787`
— a 100× value corruption. Several fabricated docs also claimed a "completed migration" that
never ran.

Repair actions taken this session:

| Item | State found | Action |
|---|---|---|
| `src/lib/decimal.ts` `Money.round()` | Rounded to integer (would corrupt AED values) | **Reverted** to `Math.round((n+EPS)*100)/100)` (2-decimal, matches Float DB) |
| `scripts/migrate-money-to-int.ts`, `scripts/migration-log.txt`, `scripts/README.md`, `PHASE_1_COMPLETE.md`, `AUDIT_REMEDIATION.md` | Fabricated — described a migration that never executed | **Deleted** (will be regenerated truthfully after the real migration) |
| `prisma/schema.prisma` | Still `Float` for all money columns | Left untouched (matches DB) — migration deferred to Phase 1.1 |
| `prisma/dev.db` | REAL columns, e.g. PO `grandTotal=11787.3`, `vatAmount=561.3000000000001` | Untouched; backup `backups/dev.db.bak` (442,368 B) exists |

Verification after repair: `npx tsc --noEmit` → **0 errors**. (Build deferred to end of phase
per the "after every phase" rule; the only build noise is two pre-existing
`DYNAMIC_SERVER_USAGE` warnings on `/api/reports` and `/api/accounts/ledgers` — these are
dynamic routes correctly emitted as `ƒ`, not errors.)

**Net:** the repo is back to a clean, truthful, building baseline. No business data was
modified, invented, or deleted.

---

## 1. Verified codebase state (evidence)

### Money storage
All monetary columns are SQLite `REAL` (confirmed via `PRAGMA table_info` on PurchaseOrder,
Payment, JournalLine, etc.). Sample live rows:

| Table | Field | Stored value |
|---|---|---|
| PurchaseOrder PO-2024-001 | grandTotal / subtotal / vatAmount | `11787.3` / `11580` / `561.3000000000001` |
| Payment PAY-2026-0001 | amount | `10` |
| PurchaseInvoice INV-SUP-2024-001 | grandTotal / subtotal | `11787.051` / `11580` |
| StockMovement GRN-2026-0001 | unitCost / totalCost | `850` / `8500` |
| JournalLine | debit / credit | `11001` / `0` |

Note the `561.3000000000001` float artefact and `11787.051` (3 decimals) — both are exactly the
class of error the fils migration is meant to eliminate.

### Auth — **zero existing infrastructure**
- No `User`, `Session`, `Employee`, `Role`, or `Approval` model in the schema (the only
  `Account` model is the GL chart of accounts).
- No `src/middleware.ts`, no `/api/auth/*`, no `/login` page.
- No auth dependency in package.json. Available offline: `nanoid` + Node built-in `crypto`
  (scrypt/hmac/randomBytes verified). **No new dependency is required.**
- 45 API route files; 9 already use `$transaction` (banking/transactions, expenses, grn,
  payments, purchase-invoices, purchase-orders/[id], sales-invoices, sales-receipts).

### Hardcoded identity (38 call sites to remove in 1.2)
Names found: `Taher`, `Accountant`, `Storekeeper`, `Purchase Manager`, `Fatima Al-Zahra`,
`Admin`, `Fatima`. Hot spots: `payments`, `purchase-invoices`, `grn`, `purchase-orders/[id]/status`,
`documents`, `expenses`, `banking`, `products`, `suppliers`, `shipments`, `sales-invoices`,
`sales-receipts`, `excel-sync`, `posting.ts`, plus client-side `src/context/RoleContext.tsx`
and `src/app/excel-sync/page.tsx`, `src/app/payments/[id]/edit/page.tsx`.

### UI money surface
`formatCurrency` in `src/lib/utils.ts` is used **205×** across 21 pages. Any change to the
number's unit (AED → fils) must keep `formatCurrency` output identical, or all 205 call sites
break visually.

### Reports / AI
- `case 5` (Supplier Performance & OTIF): computes onTime by comparing GRN receivedDate ≤ PO
  expectedDeliveryDate (date-based) but **has no qty-based in-full %**; `OTIF %` is receipt-count
  based only.
- `case 8` (VAT): filters `status != CANCELLED` (includes DRAFT) and returns a single row;
  **no FTA Form 201 boxes**, and the "actual tax paid" framing mixes PO VAT.
- Cases 14–18 exist in the API (Trial Balance, P&L, …) but `REPORT_TABS` in
  `src/app/reports/page.tsx` only lists 1–13 + 19.
- `ai-reports/route.ts` `sales-summary` sums `purchaseInvoice.grandTotal` into "revenue" and
  "receivables"; also contains `Math.random()` on-time rates and hardcoded supplier names.

---

## 2. DECISIONS (confirmed — defaults, nothing destructive)

| # | Decision | Choice | Rationale |
|---|---|---|---|
| 1 | DATABASE | **keep SQLite** | Work order default; no infra to migrate; additive migrations only |
| 2 | AUTH | **minimal server-side session + role claim** | No auth dep exists; `nanoid` + Node `crypto` (scrypt) suffice offline; no new dependency |
| 3 | MONEY TYPE | **integer minor units (fils)** | Work order default; kills the `561.3000000000001` class of error |
| 4 | SCOPE | **P0** | Work order default → Phase 1 only, then Phase 4 closeout |

Roles: `ADMIN, PURCHASER, ACCOUNTANT, STOREKEEPER, VIEWER`.

---

## 3. File-by-file change plan (Phase 1)

### 1.1 Money → Int (fils)
- `prisma/schema.prisma` — flip ~60 money columns `Float → Int` (list in §4).
- `prisma/migrations/<ts>_money_fils/` — data-preserving SQLite table-copy migration (×100,
  ROUND). Generated by hand (Prisma Migrate can't ALTER COLUMN type on SQLite).
- `scripts/verify-fils.ts` — proof: 3 records before/after, assert ×100 exact.
- `src/lib/decimal.ts` — add `toFils(aed)` / `fromFils(fils)`; keep 2-decimal `round` for the
  transition; internal math moves to integer fils.
- `src/lib/utils.ts` — `formatCurrency` gains a **fils-aware** path (`fromFils`); output string
  unchanged so 205 call sites are safe.
- API write paths (`purchase-orders`, `purchase-invoices`, `payments`, `grn`, `sales-invoices`,
  `sales-receipts`, `banking`, `expenses`, `landed-costs`, `shipments`, `suppliers`, `products`,
  `purchase-returns`, `accounts/journal`) — convert incoming AED numbers → fils on write,
  fils → AED on read where the UI expects AED.

### 1.2 Auth
- `src/lib/session.ts` — **NEW**: `createSession(userId, role)`, `getSession(req)`,
  `requireRole(req, roles[])`. Cookie-based, HttpOnly, SameSite=Lax. Token = `nanoid`; store
  `Session` row; password = scrypt hash + salt.
- `prisma/schema.prisma` — **NEW models** `User`, `Session` (additive; no existing table touched).
- `src/app/api/auth/login/route.ts`, `.../logout/route.ts`, `.../me/route.ts` — **NEW**.
- `src/middleware.ts` — **NEW**: protect all `/api/*` **except** `/api/auth/login`,
  `/api/health`, `/api/auth/*` public bootstrap. (First deployment is permissive-log; see §6.)
- Remove the 38 hardcoded names → resolve from session server-side.

### 1.3 SoD
- `purchase-orders/[id]/status` — approver must ≠ `po.createdBy` (resolved from session, not
  body); else `403 {"error":"Segregation of duties: creator cannot approve own PO"}`.
- `payments` — recorder ≠ approver; `403` on violation.

### 1.4 Advance-vs-invoice offset
- `purchase-invoices/route.ts` GET+POST, `payments/route.ts` — compute
  `NetPayable = grandTotal − approved PO advances not yet applied`; expose `appliedAdvance`,
  `netBalance` on the invoice payload; payments > netBalance → `400` with the numbers.
- `payments/new/page.tsx` — on supplier change reset **both** `poId` and `invoiceId`; add
  invoice balance card.

### 1.5 Invoice payment validation
- `payments/route.ts` — cumulative payments per `invoiceId` ≤ `grandTotal` else `400`;
  `PurchaseInvoice.status → PARTIALLY_PAID/PAID` updated atomically inside `$transaction`.

### 1.6 GRN integrity
- `grn/route.ts` — when `item.productId` missing, resolve Product by `itemCode` (then
  `altItemCode`/`oemCode`); still write `StockMovement` + increment `currentStock`; if no
  product resolves → reject that line with a specific `400` naming the itemCode.

### 1.7 Reports
- `reports/route.ts` case 5 — add qty-based in-full %; OTIF = on-time **and** in-full.
- case 8 — VAT from **confirmed** invoices only; output FTA Form 201 boxes
  (standard-rated supplies, input tax recoverable, reverse charge).
- `reports/page.tsx` — add tabs 14–18 to `REPORT_TABS`.

### 1.8 AI reports
- `ai-reports/route.ts` — `sales-summary` no longer labels purchase invoices as
  revenue/receivables; **gate** it (return a clear "no sales source yet" payload) since no real
  sales source is wired; remove `Math.random()` and hardcoded supplier names.

### 1.9 Transactions
- Wrap GRN, invoice-create, payment, return flows fully in `prisma.$transaction` (some already
  partial — completed rather than duplicated).

---

## 4. Migration plan (1.1)

1. `cp prisma/dev.db backups/dev.db.pre-fils.<timestamp>` → **print path**.
2. Generate `prisma/migrations/<ts>/migration.sql` (SQLite table-copy per table):
   `CREATE TABLE t_new (... INTEGER ...)`, `INSERT INTO t_new SELECT …, CAST(ROUND(col*100) AS INTEGER)`,
   `DROP TABLE t`, `ALTER TABLE t_new RENAME TO t`, recreate indexes/FKs.
3. Dry-run on a **copy** of dev.db; assert row counts equal + spot-check 3 records:
   `PO grandTotal 11787.3 → 1178730`, `Payment 10 → 1000`, `JournalLine debit 11001 → 1100100`.
4. Run on dev.db; `prisma generate`; `tsc --noEmit` + `npm run build`.

## 5. Rollback plan
- Every step is reversible: schema change → restore `backups/dev.db.pre-fils.*` (path printed);
  new files (session.ts, middleware.ts, auth routes) → `git`/delete; additive columns/models →
  drop. `Money.round` revert is a one-line restore (already exercised this session). No step is
  destructive or non-additive.

## 6. Assumptions & safety limits
- **A1:** fils conversion = `ROUND(aed * 100)`; existing `561.3000000000001 → 56130` exact.
- **A2:** No seed/user data exists. First login after 1.2 needs a bootstrap; safest = create the
  first ADMIN via an explicit, logged `/api/auth/setup` **only when no user exists**, then it
  self-disables. (No invented business data; this is access control, not business records.)
- **A3:** `exchangeRate` is a rate, not money — but it's monetary-scale; convert ×100 like money
  and flag for review, OR leave as Float. **Chosen safest: leave `exchangeRate` as Float** (it is a
  ratio, e.g. 1.0 / 3.67; ×100 would be wrong). Logged here as an assumption.
- **A4:** `conversionFactor`, `moq`, stock quantities stay Float (not money).
- **A5:** Middleware first runs in **permissive-log** mode (401 would brick the running app
  before any user exists); enforced mode flips after the setup user is created. This is the
  "never break existing flows" constraint taking precedence; flagged transparently.
- **Cannot do safely:** true FTA e-invoicing signing/submission (needs FTA credentials); any
  destructive cleanup of existing rows; PostgreSQL migration (out of P0 scope).

---

**Phase 0 complete. Awaiting "continue" to begin Phase 1.1 (money migration).**
No further code changes until you confirm.
