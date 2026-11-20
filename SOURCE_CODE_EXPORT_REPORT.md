# Source Code Export & Technical Audit Report
**Project:** Bait Al Hadaf Procurement ERP  
**Company:** Bait Al Hadaf General Trading L.L.C., Dubai, UAE  
**Export Timestamp:** November 20, 2026  

---

## 1. Project Structure & Architecture
The application is structured using the Next.js 14 App Router paradigm, separating server API route handlers from client components while maintaining modular separation of concerns:

- `src/app/` — App Router pages, layouts, and API route handlers (`/api/*`).
- `src/components/` — Reusable UI components, navigation bars, and item context panels.
- `src/lib/` — Core business logic libraries (`prisma.ts`, `currency.ts`, `decimal.ts`, `posting.ts`, `auth.ts`, `countryRules.ts`).
- `prisma/` — Database schema definition (`schema.prisma`) and seeding script (`seed.js`).
- `public/` — Static assets and documents.

---

## 2. Main Technologies Used
- **Frontend Framework:** Next.js 14 (App Router) & React 18 (TypeScript)
- **Styling:** Tailwind CSS & Lucide React Icons
- **Backend Framework:** Next.js Server Components & Route Handlers (Node.js runtime)
- **Database Technology:** SQLite (Local development) / PostgreSQL (Production) via Prisma ORM 5.22
- **Data Export & Manipulation:** SheetJS (`xlsx`) for Excel workbook generation and Zoho sales data import/export

---

## 3. Important Modules & Business Logic
1. **Procurement & Purchasing:** Suppliers, Purchase Orders (PO), PO approval workflows, PO variance tracking, Goods Received Notes (GRN), Purchase Invoices, and 3-way matching.
2. **Multi-Currency Architecture:** Base currency AED with support for INR, USD, EUR, etc. Document-level currency isolation, historical exchange rate locking (`1 foreign = X AED`), and base AED consolidation.
3. **Double-Entry Accounting:** Chart of Accounts, Journal Entries, General Ledger, Supplier Ledgers, Accounts Payable aging, trial balance, and UAE FTA Form 201 VAT return declaration.
4. **Inventory & Warehouse Management:** Multi-store stock tracking (Shuwaikh, Sulabiya), stock movements (`STOCK_ISSUE`, `GOODS_RECEIVED`, `STOCK_TRANSFER`), reorder point calculations, and stock valuation.
5. **Sales & Customer Management:** Sales Invoices, Sales Receipts, Customer ledger, and quotation bridge.
6. **Import & Landed Cost:** Shipment tracking, freight, customs, insurance, and item-level landed cost allocation.
7. **Document Management & Auditing:** Vault attachments, document linking, audit logging, and role-based permissions (`ADMIN`, `PURCHASER`, `ACCOUNTANT`, `STOREKEEPER`, `VIEWER`).

---

## 4. API Structure
All backend REST endpoints are located under `src/app/api/`:
- `/api/auth/*` — Session authentication, login, logout, and setup.
- `/api/suppliers/*` — Supplier management, duplication checks, and performance metrics.
- `/api/products/*` — Spare parts master data, pricing, and reorder levels.
- `/api/purchase-orders/*` — PO CRUD, item management, and status state machine (`DRAFT` -> `PENDING_APPROVAL` -> `APPROVED` -> `RECEIVED`).
- `/api/grn/*` — Goods Received Note receiving and inventory increment.
- `/api/purchase-invoices/*` — Vendor bills, 3-way matching, advance offset math, and status transitions.
- `/api/payments/*` — Supplier disbursement vouchers, advance allocation, and 5-second rapid double-click idempotency guard.
- `/api/accounts/*` — Chart of accounts, journal entries, ledgers, and account dashboard metrics.
- `/api/reports/*` — Financial reports, OTIF metrics, and UAE VAT Form 201 generation.
- `/api/dashboard/*` — Executive dashboard KPIs, monthly trends, and top suppliers.

---

## 5. Database Schema Location
- **Schema Definition:** `prisma/schema.prisma`
- **Seeding Script:** `prisma/seed.js`

---

## 6. Excluded Files & Directories
To ensure a clean, secure, and lightweight distribution, the following items were excluded from the audit ZIP:
- `node_modules/` (Dependencies)
- `.next/` (Next.js build cache)
- `.git/` (Git version control history)
- `.env` and `.env.local` (Local secret credentials)
- `backups/` and temporary log files

---

## 7. Security Scan Results
- **Secrets Check:** Scanned all source files for exposed API keys, passwords, private certificates, or production database connection strings.
- **Result:** **PASSED.** No hardcoded secrets or production credentials were found in the source code. All configuration relies on environment variables (`.env.example`).
- **Sanitization:** Confirmed no real customer/supplier private banking information or passwords are contained in the repository.

---

## 8. Limitations & Notes
- SQLite is used by default for local development (`dev.db`). For production deployment on Vercel or other platforms, configure a managed PostgreSQL database URL in `.env`.

---

## 9. Local Running Instructions
1. Unzip `BAIT_AL_HADAF_ERP_SOURCE_CODE_AUDIT.zip`.
2. Open terminal in the extracted folder.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Run `npx prisma generate && npx prisma db push`.
6. Run `npm run prisma:seed`.
7. Run `npm run dev` and navigate to `http://localhost:3000`.
