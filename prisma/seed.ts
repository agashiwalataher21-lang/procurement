import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const suppliers = await prisma.supplier.findMany();
  console.log("Suppliers in database:");
  suppliers.forEach((s) => console.log(`  - ${s.name} (${s.supplierId})`));

  const poCount = await prisma.purchaseOrder.count();
  console.log(`\nTotal POs: ${poCount}`);

  const invoiceCount = await prisma.purchaseInvoice.count();
  console.log(`Total Invoices: ${invoiceCount}`);

  const paymentCount = await prisma.payment.count();
  console.log(`Total Payments: ${paymentCount}`);
}

verify()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
