const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedTransactions() {
  console.log("Seeding sample transactions for GRN, Payments, and Invoices...");

  // Find PO-2024-001 (Yamaha Middle East)
  const po1 = await prisma.purchaseOrder.findUnique({
    where: { poNumber: "PO-2024-001" },
    include: { items: true, supplier: true },
  });

  if (po1) {
    // 1. Record an Advance Payment of AED 5,000 against PO-2024-001
    const payment = await prisma.payment.upsert({
      where: { paymentNumber: "PAY-2024-001" },
      update: {},
      create: {
        paymentNumber: "PAY-2024-001",
        supplierId: po1.supplierId,
        poId: po1.id,
        amount: 5000.0,
        currency: "AED",
        paymentMethod: "BANK_TRANSFER",
        bankReference: "ENBD-TXN-9988231",
        notes: "Advance 40% deposit for Yamaha spare parts container shipment",
        recordedBy: "Accountant",
        status: "APPROVED",
      },
    });
    console.log("✔ Payment created:", payment.paymentNumber, "Amount: AED", payment.amount);

    // 2. Record a Goods Received Note for PO-2024-001
    const grn = await prisma.goodsReceivedNote.upsert({
      where: { grnNumber: "GRN-2024-001" },
      update: {},
      create: {
        grnNumber: "GRN-2024-001",
        poId: po1.id,
        supplierId: po1.supplierId,
        receivedDate: new Date(),
        receivedBy: "Salim Al-Nuaimi (Storekeeper)",
        notes: "Delivery arrived at Dubai Logistics Hub. Container seal intact.",
        status: "CONFIRMED",
        items: {
          create: po1.items.map((item) => ({
            productId: item.productId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            orderedQuantity: item.quantity,
            previouslyReceivedQty: 0,
            newlyReceivedQty: item.quantity,
            pendingQty: 0,
            condition: "Good",
            notes: "Inspected & passed QC",
          })),
        },
      },
    });
    console.log("✔ GRN created:", grn.grnNumber);

    // 3. Record a Purchase Invoice for PO-2024-001
    const invoice = await prisma.purchaseInvoice.upsert({
      where: { invoiceNumber: "INV-YMH-2024-889" },
      update: {},
      create: {
        invoiceNumber: "INV-YMH-2024-889",
        poId: po1.id,
        supplierId: po1.supplierId,
        invoiceDate: new Date(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "PARTIALLY_PAID",
        subtotal: po1.subtotal,
        vatAmount: po1.vatAmount,
        grandTotal: po1.grandTotal,
        notes: "Payment Terms: Net 30. Reconciled against PO-2024-001.",
        items: {
          create: po1.items.map((item) => ({
            productId: item.productId,
            itemCode: item.itemCode,
            itemName: item.itemName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            total: item.total,
            isExtraFromPo: false,
          })),
        },
      },
    });
    console.log("✔ Invoice created:", invoice.invoiceNumber, "Total: AED", invoice.grandTotal);

    // Link payment to invoice as well
    await prisma.payment.update({
      where: { id: payment.id },
      data: { invoiceId: invoice.id },
    });
  }

  console.log("Transactions seeding complete!");
}

seedTransactions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
