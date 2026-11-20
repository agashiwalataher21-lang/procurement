-- Indexes for Recent Purchase History & Item Context (SQLite / Prisma)
-- Run against prisma/dev.db. All CREATE INDEX IF NOT EXISTS are idempotent.
--
-- Equivalent raw SQL for the query (mirrors the Prisma implementation):
--
--   -- Last purchase rate / vendor (most recent CONFIRMED/PAID invoice):
--   SELECT ii."unitPrice", pi."invoiceDate", s."name" AS vendorName, pi."invoiceNumber", pi."status"
--   FROM "InvoiceItem" ii
--   JOIN "PurchaseInvoice" pi ON pi."id" = ii."invoiceId"
--   JOIN "Supplier" s ON s."id" = pi."supplierId"
--   WHERE ii."productId" = ? AND pi."status" IN ('CONFIRMED','PAID','PARTIALLY_PAID')
--   ORDER BY pi."invoiceDate" DESC LIMIT 1;
--
--   -- Stock on hand (cached physical inventory):
--   SELECT "currentStock", "minStock", "reorderLevel" FROM "Product" WHERE "id" = ?;
--
--   -- Last 5 purchases (invoice JOIN + PO fallback, newest first):
--   SELECT pi."invoiceDate" AS date, pi."invoiceNumber" AS docNumber,
--          s."name" AS vendorName, ii."quantity" AS qty, ii."unitPrice" AS unitCost,
--          pi."status" AS status, 'INVOICE' AS sourceType
--   FROM "InvoiceItem" ii
--   JOIN "PurchaseInvoice" pi ON pi."id" = ii."invoiceId"
--   JOIN "Supplier" s ON s."id" = pi."supplierId"
--   WHERE ii."productId" = ? AND pi."status" <> 'CANCELLED'
--   UNION ALL
--   SELECT po."orderDate", po."poNumber", s."name", poi."quantity", poi."unitPrice", po."status", 'PO'
--   FROM "PurchaseOrderItem" poi
--   JOIN "PurchaseOrder" po ON po."id" = poi."poId"
--   JOIN "Supplier" s ON s."id" = po."supplierId"
--   WHERE poi."productId" = ? AND po."status" NOT IN ('CANCELLED','DRAFT')
--   ORDER BY "date" DESC LIMIT 5;

CREATE INDEX IF NOT EXISTS "InvoiceItem_productId_idx" ON "InvoiceItem"("productId");
CREATE INDEX IF NOT EXISTS "InvoiceItem_invoiceId_idx" ON "InvoiceItem"("invoiceId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_productId_idx" ON "PurchaseOrderItem"("productId");
CREATE INDEX IF NOT EXISTS "PurchaseOrderItem_poId_idx" ON "PurchaseOrderItem"("poId");
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_invoiceDate_idx" ON "PurchaseInvoice"("invoiceDate");
CREATE INDEX IF NOT EXISTS "PurchaseInvoice_supplierId_idx" ON "PurchaseInvoice"("supplierId");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_orderDate_idx" ON "PurchaseOrder"("orderDate");
CREATE INDEX IF NOT EXISTS "PurchaseOrder_supplierId_idx" ON "PurchaseOrder"("supplierId");
