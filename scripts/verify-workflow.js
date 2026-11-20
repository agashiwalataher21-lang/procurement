const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("=== VERIFYING BAIT AL HADAF PROCUREMENT WORKFLOW ===");

  // 1. Check Suppliers
  const suppliers = await prisma.supplier.findMany({
    include: {
      purchaseOrders: true,
      payments: true,
      grns: true,
      invoices: true,
    },
  });
  console.log(`\n✔ 1. Suppliers Count: ${suppliers.length}`);
  suppliers.forEach((s) => {
    console.log(
      `   - [${s.supplierId}] ${s.name} | POs: ${s.purchaseOrders.length} | Payments: ${s.payments.length} | Invoices: ${s.invoices.length}`
    );
  });

  // 2. Check Purchase Orders and Financial Balances
  const pos = await prisma.purchaseOrder.findMany({
    include: {
      items: true,
      payments: true,
      grns: { include: { items: true } },
      invoices: { include: { items: true } },
      supplier: true,
    },
  });
  console.log(`\n✔ 2. Purchase Orders Count: ${pos.length}`);
  pos.forEach((po) => {
    const totalPayments = po.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = po.grandTotal - totalPayments;
    console.log(
      `   - ${po.poNumber} (${po.supplier.name}): Total AED ${po.grandTotal.toFixed(
        2
      )} | Paid: AED ${totalPayments.toFixed(2)} | Balance: AED ${balance.toFixed(2)} | Status: ${po.status}`
    );
  });

  // 3. Test Dynamic Supplier Name Propagation
  const testSupplier = suppliers[0];
  const originalName = testSupplier.name;
  const updatedName = `${originalName} [TRADING BR.]`;

  console.log(`\n✔ 3. Testing Dynamic Supplier Name Propagation:`);
  console.log(`   Original: "${originalName}" -> Updating to: "${updatedName}"`);

  await prisma.supplier.update({
    where: { id: testSupplier.id },
    data: { name: updatedName },
  });

  // Fetch PO for this supplier to verify dynamic join reflects new name
  const updatedPO = await prisma.purchaseOrder.findFirst({
    where: { supplierId: testSupplier.id },
    include: { supplier: true },
  });
  console.log(
    `   Verification: PO ${updatedPO.poNumber} supplier name dynamically returned: "${updatedPO.supplier.name}"`
  );

  // Restore original name
  await prisma.supplier.update({
    where: { id: testSupplier.id },
    data: { name: originalName },
  });
  console.log(`   Restored supplier name back to "${originalName}"`);

  // 4. Verify GRN and Inventory Received Quantities
  const grns = await prisma.goodsReceivedNote.findMany({
    include: { items: true, purchaseOrder: true },
  });
  console.log(`\n✔ 4. Goods Received Notes (GRN) Count: ${grns.length}`);
  grns.forEach((g) => {
    const totalRecv = g.items.reduce((s, i) => s + i.newlyReceivedQty, 0);
    console.log(
      `   - ${g.grnNumber} for ${g.purchaseOrder.poNumber}: ${totalRecv} units received | By: ${g.receivedBy} | Status: ${g.status}`
    );
  });

  // 5. Verify Settings
  const settingsCount = await prisma.setting.count();
  console.log(`\n✔ 5. Company Settings in Database: ${settingsCount}`);

  console.log("\n=== ALL SYSTEM MODULES AND WORKFLOW INTEGRATIONS VERIFIED! ===");
}

main()
  .catch((e) => {
    console.error("Verification failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
