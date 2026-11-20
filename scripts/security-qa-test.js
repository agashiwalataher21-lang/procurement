/**
 * AUTOMATED SECURITY & PROCUREMENT QA TEST SUITE (CommonJS)
 */
const test = require("node:test");
const assert = require("node:assert");

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:3000";

test("ERP Security & Procurement QA Test Suite", async (t) => {
  let cookieHeader = "";
  let supplierId = "";
  let productId = "";
  let poId = "";

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

  await t.test("1.5 Fetch valid supplier & product IDs", async () => {
    const supRes = await fetch(`${BASE_URL}/api/suppliers`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
    });
    const supData = await supRes.json();
    assert.ok(supData.suppliers && supData.suppliers.length > 0);
    supplierId = supData.suppliers[0].id;

    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: "GET",
      headers: { Cookie: cookieHeader },
    });
    const prodData = await prodRes.json();
    assert.ok(prodData.products && prodData.products.length > 0);
    productId = prodData.products[0].id;
  });

  await t.test("2. Segregation of Duties (SoD): PO Creator Cannot Approve Own PO", async () => {
    // Create PO
    const poRes = await fetch(`${BASE_URL}/api/purchase-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookieHeader },
      body: JSON.stringify({
        supplierId,
        items: [{
          productId,
          itemCode: "ITEM-QA-01",
          itemName: "QA Test Part",
          quantity: 5,
          unitPrice: 100.00,
        }],
      }),
    });

    const poData = await poRes.json();
    assert.strictEqual(poRes.status, 201);
    poId = poData.purchaseOrder.id;

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
        supplierId,
        items: [{
          itemCode: "VALID-SKU",
          itemName: "Valid Item",
          quantity: 2,
          unitPrice: 50,
        }],
      }),
    });
    const poData = await poRes.json();
    poId = poData.purchaseOrder.id;

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
        supplierId: "cmw9gt7fh0009fe0mnepg4tgp",
        invoiceId: "non-existent-invoice-id",
        amount: 999999,
        paymentMethod: "BANK_TRANSFER",
      }),
    });
    assert.strictEqual(payRes.status, 400);
  });
});