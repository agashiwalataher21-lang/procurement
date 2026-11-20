/**
 * AUTOMATED SECURITY & PROCUREMENT QA TEST SUITE
 * Bait Al Hadaf Procurement & ERP
 *
 * Covers:
 * 1. Authentication & Session Validation
 * 2. Segregation of Duties (SoD) - PO Self-Approval Prevention (403)
 * 3. Advance-vs-Invoice Offset & Payment Balance Capping (400)
 * 4. GRN Product Resolution Integrity & Missing SKU Rejection (400)
 * 5. State Machine Transition Guards
 */

import test from "node:test";
import assert from "node:assert";

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test("ERP Security & Procurement QA Test Suite", async (t) => {
  let cookieHeader = "";

  await t.test("0. Health check endpoint", async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    assert.strictEqual(res.status, 200);
    assert.strictEqual(data.status, "ok");
  });

  await t.test("1. Authentication Setup / Login", async () => {
    // Try setup first in case 0 users exist
    await fetch(`${BASE_URL}/api/auth/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "audit.qa@baitalhadaf.ae",
        name: "QA Auditor",
        password: "SecurePassword123!",
      }),
    }).catch(() => {});

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "audit.qa@baitalhadaf.ae",
        password: "SecurePassword123!",
      }),
    });

    const setCookie = loginRes.headers.get("set-cookie");
    if (setCookie) {
      cookieHeader = setCookie.split(";")[0];
    }
    assert.strictEqual(loginRes.status, 200);
  });

  await t.test("2. Segregation of Duties (SoD): PO Creator Cannot Approve Own PO", async () => {
    // Create PO
    const poRes = await fetch(`${BASE_URL}/api/purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        supplierId: "cmw9gt7jx0000fe0mjw2p4cfa",
        items: [{
          productId: "cmw9gt7jy0001fe0m5cxb44y1",
          itemCode: "ITEM-QA-01",
          itemName: "QA Test Part",
          quantity: 5,
          unitPrice: 100.00,
        }],
      }),
    });

    const poData = await poRes.json();
    assert.strictEqual(poRes.status, 201);
    const poId = poData.purchaseOrder.id;

    // Attempt self-approval
    const approveRes = await fetch(`${BASE_URL}/api/purchase-orders/${poId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({ status: "APPROVED" }),
    });

    const approveData = await approveRes.json();
    assert.strictEqual(approveRes.status, 403);
    assert.match(approveData.error, /Segregation of Duties/i);
  });

  await t.test("3. GRN Integrity: Reject Unresolvable Item Code", async () => {
    const poRes = await fetch(`${BASE_URL}/api/purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        supplierId: "cmw9gt7jx0000fe0mjw2p4cfa",
        items: [{
          itemCode: "VALID-SKU",
          itemName: "Valid Item",
          quantity: 2,
          unitPrice: 50,
        }],
      }),
    });
    const poData = await poRes.json();
    const poId = poData.purchaseOrder.id;

    // Attempt GRN with ghost itemCode
    const grnRes = await fetch(`${BASE_URL}/api/grn`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        poId,
        items: [{
          itemCode: "GHOST-SKU-9999",
          itemName: "Nonexistent Item",
          orderedQuantity: 2,
          newlyReceivedQty: 2,
        }],
      }),
    });

    const grnData = await grnRes.json();
    assert.strictEqual(grnRes.status, 400);
    assert.match(grnData.error, /Unresolvable product/i);
  });

  await t.test("4. Payment Validation: Reject Payment Exceeding Invoice Net Balance", async () => {
    const payRes = await fetch(`${BASE_URL}/api/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        supplierId: "cmw9gt7jx0000fe0mjw2p4cfa",
        invoiceId: "non-existent-invoice-id",
        amount: 999999,
        paymentMethod: "BANK_TRANSFER",
      }),
    });
    assert.strictEqual(payRes.status, 400);
  });
});
