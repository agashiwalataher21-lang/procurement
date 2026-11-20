# SMOKE-TEST CHECKLIST & AUDIT VERIFICATION CURL COMMANDS
**Bait Al Hadaf Procurement & ERP**

Run against `http://localhost:3000` (or your staging host).

---

## 0. Bootstrap / Authentication Setup

```bash
# 0.1 Check service health (Unauthenticated)
curl -s http://localhost:3000/api/health | jq .

# 0.2 Initialize First Administrator (Only works once when 0 users exist)
curl -s -X POST http://localhost:3000/api/auth/setup \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@baitalhadaf.ae",
    "name": "Audit Admin",
    "password": "Password123!"
  }' | jq .

# 0.3 Authenticate & acquire session cookie
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "admin@baitalhadaf.ae",
    "password": "Password123!"
  }' | jq .

# 0.4 Verify session profile
curl -s http://localhost:3000/api/auth/me -b cookies.txt | jq .
```

---

## 1. Segregation of Duties (SoD) — PO Approval Deny

A user who created a PO cannot approve it. Must return **403 Forbidden**.

```bash
# 1.1 Create PO as "Audit Admin"
PO_ID=$(curl -s -X POST http://localhost:3000/api/purchase-orders \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "supplierId": "cmw9gt7jx0000fe0mjw2p4cfa",
    "items": [{
      "productId": "cmw9gt7jy0001fe0m5cxb44y1",
      "itemCode": "ITEM-001",
      "itemName": "Brake Pad Yamaha",
      "quantity": 10,
      "unitPrice": 50.00
    }]
  }' | jq -r '.purchaseOrder.id')

echo "Created PO ID: $PO_ID"

# 1.2 Attempt approval by the same user ("Audit Admin") -> MUST RETURN 403
curl -s -X POST "http://localhost:3000/api/purchase-orders/$PO_ID/status" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "status": "APPROVED",
    "notes": "Attempting self-approval"
  }' | jq .

# Expected Output:
# {
#   "error": "Segregation of Duties violation: The user who created this purchase order cannot approve it.",
#   "details": {
#     "createdBy": "Audit Admin",
#     "attemptedBy": "Audit Admin"
#   }
# }
```

---

## 2. Advance-vs-Invoice Offset & Payment Validation — Exceeding Net Balance Must Return 400

When an invoice has unapplied PO advances, payments cannot exceed `NetBalance = grandTotal - unappliedAdvances`. Must return **400 Bad Request**.

```bash
# 2.1 Fetch first purchase invoice with its computed netBalance & appliedAdvance
curl -s "http://localhost:3000/api/purchase-invoices" -b cookies.txt | \
  jq '.invoices[0] | {invoiceNumber, grandTotal, paidAmount, appliedAdvance, netBalance}'

# 2.2 Attempt to record a payment of 50,000 AED against an invoice with lower net balance -> MUST RETURN 400
INV_ID=$(curl -s "http://localhost:3000/api/purchase-invoices" -b cookies.txt | jq -r '.invoices[0].id')
SUP_ID=$(curl -s "http://localhost:3000/api/purchase-invoices" -b cookies.txt | jq -r '.invoices[0].supplierId')

curl -s -X POST "http://localhost:3000/api/payments" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"supplierId\": \"$SUP_ID\",
    \"invoiceId\": \"$INV_ID\",
    \"amount\": 50000.00,
    \"paymentMethod\": \"BANK_TRANSFER\"
  }" | jq .

# Expected Output:
# {
#   "error": "Payment amount of 50000.00 AED exceeds net payable balance of ... after offset of ... in PO advances."
# }
```

---

## 3. Invoice Cumulative Payment Capping

Payments against an invoice cannot exceed the invoice's grand total.

```bash
# Attempt to record payment exceeding invoice grandTotal
curl -s -X POST "http://localhost:3000/api/payments" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"supplierId\": \"$SUP_ID\",
    \"invoiceId\": \"$INV_ID\",
    \"amount\": 999999.00,
    \"paymentMethod\": \"BANK_TRANSFER\"
  }" | jq .

# Expected Output (HTTP 400):
# {
#   "error": "Payment of ... exceeds remaining invoice capacity of ... Cumulative invoice payments cannot exceed grand total."
# }
```

---

## 4. GRN Integrity — Unresolvable Product Code Rejection

When a GRN item has no `productId` and its `itemCode` does not exist in the product catalog, the system must reject the line with **400 Bad Request**.

```bash
# Attempt GRN receipt with fictitious itemCode
PO_ID=$(curl -s "http://localhost:3000/api/purchase-orders" -b cookies.txt | jq -r '.purchaseOrders[0].id')

curl -s -X POST "http://localhost:3000/api/grn" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d "{
    \"poId\": \"$PO_ID\",
    \"items\": [{
      \"itemCode\": \"NON-EXISTENT-SKU-99999\",
      \"itemName\": \"Ghost Component\",
      \"orderedQuantity\": 5,
      \"newlyReceivedQty\": 5
    }]
  }" | jq .

# Expected Output (HTTP 400):
# {
#   "error": "GRN validation failed: Unresolvable product for line item with itemCode \"NON-EXISTENT-SKU-99999\". Product must exist in catalog before receiving stock.",
#   "itemCode": "NON-EXISTENT-SKU-99999",
#   "itemName": "Ghost Component"
# }
```

---

## 5. UAE FTA Form 201 VAT Return Verification

Verify official Federal Tax Authority Form 201 structure with Box 1, Box 9, Box 12, Box 13, Box 14.

```bash
curl -s "http://localhost:3000/api/reports?report=8&range=year" -b cookies.txt | jq .

# Expected Output Structure:
# {
#   "title": "UAE FTA Form 201 — VAT Return Declaration",
#   "columns": ["Box #", "FTA Form 201 Description", "Net Amount (AED)", "VAT Amount (AED)", "Recoverable / Adjustment"],
#   "rows": [
#     { "Box #": "Box 1", "FTA Form 201 Description": "Standard-rated supplies in UAE (5% Sales)", ... },
#     { "Box #": "Box 9", "FTA Form 201 Description": "Standard-rated expenses (5% Purchase Invoices)", ... },
#     { "Box #": "Box 12", "FTA Form 201 Description": "Total Output Tax Due (Box 1 + Box 3)", ... },
#     { "Box #": "Box 13", "FTA Form 201 Description": "Total Recoverable Tax (Box 9 + Box 10)", ... },
#     { "Box #": "Box 14", "FTA Form 201 Description": "Net VAT Payable to FTA...", ... }
#   ],
#   "summary": {
#     "OutputTaxDue": ...,
#     "InputTaxRecoverable": ...,
#     "NetTaxDue": ...
#   }
# }
```

---

## 6. Supplier Performance & OTIF Delivery Verification

Verify that Case 5 outputs true On-Time, In-Full, and composite OTIF %:

```bash
curl -s "http://localhost:3000/api/reports?report=5" -b cookies.txt | jq .

# Expected Output Columns:
# ["Supplier", "Total POs", "PO Value (AED)", "Paid (AED)", "GRNs", "On-Time Receipts", "On-Time %", "In-Full %", "OTIF %"]
```
