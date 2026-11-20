import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const pos = await prisma.purchaseOrder.findMany({
    include: { items: true, supplier: true },
  });

  console.log("Purchase Orders:");
  pos.forEach((po) => {
    console.log(`\n${po.poNumber} - ${po.supplier.name}`);
    console.log(`  Total: AED ${po.grandTotal}, Status: ${po.status}`);
    console.log(`  Items: ${po.items.length}`);
    po.items.forEach((item) => {
      console.log(`    - ${item.itemName}: ${item.quantity} x ${item.unitPrice} = ${item.total}`);
    });
  });
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
