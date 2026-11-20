# Bait Al Hadaf ERP - Purchase Module Documentation

**Version:** 1.0.0  
**Date:** November 2026  
**Company:** Bait Al Hadaf General Trading L.L.C.  
**Status:** Enterprise Edition - Complete

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Schema](#database-schema)
3. [Completed Features](#completed-features)
4. [Module Documentation](#module-documentation)
5. [API Endpoints](#api-endpoints)
6. [Configuration](#configuration)
7. [Next Steps](#next-steps)

---

## System Architecture

### Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript (Strict Mode) |
| **Database** | SQLite (Prisma ORM) |
| **Styling** | Tailwind CSS |
| **UI Components** | Lucide Icons, Sonner (Toasts) |
| **State Management** | React useState/useEffect |

### Project Structure

```
src/
├── app/
│   ├── api/                  # REST API routes
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── purchase-invoices/
│   │   ├── payments/
│   │   ├── products/
│   │   └── grns/
│   ├── purchase-orders/      # PO pages
│   ├── purchase-invoices/    # Invoice pages
│   ├── payments/             # Payment pages
│   ├── suppliers/            # Supplier pages
│   └── dashboard/            # CEO Dashboard
├── lib/
│   ├── prisma.ts            # Prisma client singleton
│   └── utils.ts             # Utility functions
└── types/
    └── index.ts             # TypeScript interfaces
```

---

## Database Schema

### Core Models

#### Supplier
```prisma
model Supplier {
  id            String   @id @default(cuid())
  supplierId    String   @unique  // SUP-001, SUP-002, etc.
  name          String
  contactPerson String?
  phone         String?
  email         String?
  address       String?
  country       String   @default("UAE")
  trn           String?    // UAE Tax Registration Number
  currency      String   @default("AED")
  paymentTerms  String   @default("30 Days")
  bankDetails   String?
  notes         String?
  status        String   @default("ACTIVE")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

#### Product
```prisma
model Product {
  id                   String   @id @default(cuid())
  itemCode             String   @unique
  itemName             String
  category             String   @default("Motorcycle Spare Parts")
  unitOfMeasurement    String   @default("PCS")
  defaultPurchasePrice Float    @default(0.0)
  minStock             Float    @default(10.0)
  reorderLevel         Float    @default(25.0)
  status               String   @default("ACTIVE")
}
```

#### PurchaseOrder
```prisma
model PurchaseOrder {
  id                   String   @id @default(cuid())
  poNumber             String   @unique  // PO-2024-0001
  supplierId           String
  orderDate            DateTime @default(now())
  expectedDeliveryDate DateTime
  status               String   @default("DRAFT")
  currency             String   @default("AED")
  subtotal             Float    @default(0.0)
  discountAmount       Float    @default(0.0)
  shippingAmount       Float    @default(0.0)
  vatAmount            Float    @default(0.0)
  grandTotal           Float    @default(0.0)
  items                PurchaseOrderItem[]
  payments             Payment[]
  grns                 GoodsReceivedNote[]
  invoices             PurchaseInvoice[]
}
```

#### PurchaseInvoice
```prisma
model PurchaseInvoice {
  id              String   @id @default(cuid())
  invoiceNumber   String   @unique  // INV-YYYY-XXXX
  supplierId      String
  poId            String?
  invoiceDate     DateTime @default(now())
  dueDate         DateTime
  status          String   @default("CONFIRMED")
  subtotal        Float
  vatAmount       Float    // 5% UAE VAT
  grandTotal      Float
  paidAmount      Float    // Computed from payments
  items           InvoiceItem[]
  payments        Payment[]
}
```

#### Payment
```prisma
model Payment {
  id              String   @id @default(cuid())
  paymentNumber   String   @unique  // PAY-YYYY-XXXX
  supplierId      String
  poId            String?
  invoiceId       String?
  amount          Float
  currency        String   @default("AED")
  paymentMethod   String   @default("BANK_TRANSFER")
  paymentDate     DateTime @default(now())
  status          String   @default("APPROVED")
}
```

### Relations

- **Supplier** → Has many PurchaseOrders, Invoices, Payments, GRNs
- **PurchaseOrder** → Belongs to one Supplier, Has many Items, Payments, GRNs, Invoices
- **PurchaseInvoice** → Belongs to one Supplier (and optionally one PO), Has many Items, Payments
- **Payment** → Belongs to one Supplier (and optionally one PO/Invoice)

---

## Completed Features

### 1. Inline Product Creation in Purchase Order

**File:** `src/app/purchase-orders/new/page.tsx`

Added "+ ADD NEW PRODUCT" option in the product dropdown. When selected, a modal opens allowing users to create products on-the-fly without leaving the PO form.

**Features:**
- Product form with all required fields
- Auto-generate item codes if not provided
- Product added to dropdown immediately after creation
- Product saved to database for future use

### 2. Purchase Invoice Module (Fixed)

**Files Modified:**
- `src/app/api/purchase-invoices/route.ts`
- `src/app/api/purchase-invoices/[id]/route.ts`
- `src/app/purchase-invoices/page.tsx`
- `src/app/purchase-invoices/[id]/page.tsx`

**Features:**
- Three-Way Matching (PO vs GRN vs Invoice reconciliation)
- Invoice items show PO comparison data
- Payment status tracking with balance calculation
- Overdue invoice detection
- Status badges (Confirmed, Paid, Partial, Overdue)
- Print-ready invoice layout

**API Enhancements:**
```typescript
// Enhanced invoice response includes:
{
  ...invoice,
  paidAmount: number,  // Sum of all payments
  items: [
    {
      ...item,
      poQuantity: number,    // From linked PO
      poUnitPrice: number,   // From linked PO
      invoiceQuantity: number,
      invoiceUnitPrice: number
    }
  ]
}
```

### 3. Record Payment Module (Fixed)

**Files Modified:**
- `src/app/payments/new/page.tsx`

**Issues Fixed:**
1. **Supplier Selection**: Fixed the invoice API endpoint (`/api/invoices` → `/api/purchase-invoices`)
2. **Invoice Dropdown**: Added invoice selection dropdown for "Invoice Payment" mode
3. **Invoice Filtering**: Added `supplierInvoices` filter based on selected supplier

**Features:**
- Two payment modes:
  - **Advance / PO Payment**: Pay against a Purchase Order
  - **Invoice Payment**: Pay against a confirmed invoice
- Real-time PO balance tracking
- Payment amount validation against remaining balance
- Payment number auto-generation (PAY-YYYY-XXXX)
- Bank reference/cheque number tracking
- Payment history per supplier

**Payment Validation:**
```typescript
// Prevents overpayment
if (amount > remainingBalance + 0.01) {
  toast.error("Payment exceeds remaining balance");
}
```

### 4. Supplier Module

**Files:**
- `src/app/api/suppliers/route.ts`
- `src/app/suppliers/page.tsx`

**Features:**
- Supplier CRUD operations
- Auto-generate supplier IDs (SUP-001, SUP-002, etc.)
- TRN (Tax Registration Number) tracking
- Currency and payment terms per supplier
- Bank details storage
- Purchase order count per supplier

### 5. CEO Executive Dashboard

**File:** `src/app/dashboard/page.tsx`

**KPIs:**
- Total Purchase Orders (YTD)
- Total Invoice Value
- Outstanding Payments
- Overdue Invoices
- Top Suppliers by Volume
- Recent Activity Feed

---

## Module Documentation

### Purchase Order Flow

```
1. Create PO (with items)
   ↓
2. Approve PO
   ↓
3. Receive Goods (GRN)
   ↓
4. Receive Invoice
   ↓
5. Record Payment
```

### Three-Way Matching

The system supports matching between:
1. **Purchase Order** - What was ordered
2. **Goods Received Note (GRN)** - What was received
3. **Purchase Invoice** - What was billed

**Matching Logic:**
- Compare PO item quantities vs GRN quantities
- Compare PO item quantities vs Invoice quantities
- Flag discrepancies for review

### Landed Cost Allocation

**UAE Customs Duty:** 5% of CIF value

**Landed Cost Components:**
- Purchase Cost
- Freight/Shipping
- Customs Duty (5%)
- Clearing Charges
- Local Transport
- Other Expenses

---

## API Endpoints

### Suppliers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/suppliers` | List all suppliers (supports `?search=` and `?status=`) |
| POST | `/api/suppliers` | Create new supplier |

### Purchase Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-orders` | List all POs (supports `?search=`, `?status=`, `?supplierId=`) |
| POST | `/api/purchase-orders` | Create new PO |

### Purchase Invoices

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/purchase-invoices` | List all invoices with PO comparison |
| GET | `/api/purchase-invoices/[id]` | Get single invoice details |
| POST | `/api/purchase-invoices` | Create new invoice |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payments` | List all payments (supports `?supplierId=`, `?poId=`) |
| POST | `/api/payments` | Record new payment |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| POST | `/api/products` | Create new product |

---

## Configuration

### Database

The application uses SQLite with Prisma ORM.

**Database File:** `prisma/dev.db`

**Prisma Studio (Data Browser):**
```bash
npx prisma studio
```

**Schema Location:** `prisma/schema.prisma`

### Running the Application

```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed initial data (optional)
npx tsx seed-data.ts

# Start development server
npm run dev
```

**Server:** http://localhost:3000

### Default Credentials

The application uses session-based authentication. Default admin user:

- **Email:** admin@baitalhadaf.com
- **Password:** admin123

---

## Next Steps

### Immediate Fixes Needed

1. **Test Supplier Selection in Payment Form**
   - The form now includes:
     - Supplier dropdown (pre-populated from database)
     - PO dropdown (filtered by supplier)
     - Invoice dropdown (filtered by supplier)
   - Verify all dropdowns work correctly

2. **Verify Purchase Invoice Module**
   - Navigate to `/purchase-invoices`
   - Check that invoices display with correct PO comparison data
   - Verify payment status badges

### Feature Enhancements

1. **Advanced GRN Module**
   - Partial goods receipt tracking
   - Damage/shortage reporting
   - GRN-to-Invoice matching

2. **Purchase Return Management**
   - RMA (Return Merchandise Authorization) workflow
   - Credit note tracking
   - Return approval process

3. **Landed Cost Tracking**
   - Freight cost allocation
   - Customs duty calculation (5% UAE)
   - Landed cost per unit

4. **Reporting & Analytics**
   - Supplier performance scores
   - Purchase analysis by category
   - VAT reporting (UAE)

5. **Integration**
   - PDF generation for PO/Invoice
   - Email notifications
   - Export to Excel/CSV

### Production Deployment

1. **Database Migration**
   ```bash
   npx prisma migrate deploy
   ```

2. **Environment Variables**
   ```
   DATABASE_URL=file:./prod.db
   NEXTAUTH_SECRET=your-secret-key
   ```

3. **Build for Production**
   ```bash
   npm run build
   npm run start
   ```

---

## Support

For issues or questions:
1. Check the database is populated: `npx tsx prisma/seed-data.ts`
2. Verify Prisma client: `npx prisma generate`
3. Check console for API errors
4. Review audit logs for system events

---

**Document Version:** 1.0.0  
**Last Updated:** November 2026  
**Maintained by:** Bait Al Hadaf IT Department
