import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const payments = await prisma.payment.findMany({
    include: { supplier: true, purchaseOrder: true, invoice: true },
  });

  console.log("Payments:");
  payments.forEach((p) => {
    console.log(`\n${p.paymentNumber}`);
    console.log(`  Supplier: ${p.supplier?.name || 'N/A'}`);
    console.log(`  PO: ${p.purchaseOrder?.poNumber || 'N/A'}`);
    console.log(`  Invoice: ${p.invoice?.invoiceNumber || 'N/A'}`);
    console.log(`  Amount: ${p.amount} ${p.currency}`);
    console.log(`  Status: ${p.status}`);
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
