const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function seedStockMovements() {
  console.log("Seeding stock movement history for existing products...");

  const products = await prisma.product.findMany({
    where: { status: "ACTIVE" },
  });

  const movements = [];

  for (const product of products) {
    // Opening stock (simulated historical data)
    movements.push({
      productId: product.id,
      itemCode: product.itemCode,
      date: new Date("2024-01-01"),
      movementType: "OPENING_STOCK",
      quantity: 0,
      unitCost: product.defaultPurchasePrice,
      totalCost: 0,
      referenceNumber: "OP-STK-2024",
      location: "Dubai Logistics Hub",
      responsibleEmployee: "Storekeeper",
      notes: "Opening stock balance",
    });

    // Add some simulated movements based on existing GRNs
    const grns = await prisma.goodsReceivedNote.findMany({
      where: { poId: { in: product.poItems.map((i) => i.poId) } },
      include: { items: true },
    });

    for (const grn of grns) {
      for (const item of grn.items) {
        if (item.newlyReceivedQty > 0) {
          movements.push({
            productId: product.id,
            itemCode: product.itemCode,
            date: grn.receivedDate,
            movementType: "GOODS_RECEIVED",
            quantity: item.newlyReceivedQty,
            unitCost: product.defaultPurchasePrice,
            totalCost: item.newlyReceivedQty * product.defaultPurchasePrice,
            referenceNumber: grn.grnNumber,
            location: "Dubai Logistics Hub",
            responsibleEmployee: grn.receivedBy,
            notes: `Received from GRN ${grn.grnNumber}`,
          });
        }
      }
    }
  }

  // Create all movements in bulk
  await prisma.stockMovement.createMany({
    data: movements,
    skipDuplicates: true,
  });

  console.log(`Created ${movements.length} stock movement records`);
}

seedStockMovements()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
