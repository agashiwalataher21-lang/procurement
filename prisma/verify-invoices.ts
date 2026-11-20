import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verify() {
  const invoices = await prisma.purchaseInvoice.findMany({
    include: {
      supplier: true,
      purchaseOrder: true,
      items: true,
      payments: true,
    },
  });

  console.log("Invoices:");
  invoices.forEach((inv) => {
    const paidAmount = inv.payments.reduce((sum, p) => sum + p.amount, 0);
    const balance = inv.grandTotal - paidAmount;
    console.log(`\n${inv.invoiceNumber} - ${inv.supplier.name}`);
    console.log(`  PO: ${inv.purchaseOrder?.poNumber || 'N/A'}`);
    console.log(`  Total: ${inv.grandTotal}, Paid: ${paidAmount}, Balance: ${balance}`);
    console.log(`  Status: ${inv.status}, Due: ${inv.dueDate}`);
    console.log(`  Items: ${inv.items.length}`);
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
