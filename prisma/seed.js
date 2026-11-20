const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed for Bait Al Hadaf Procurement System...');

  // Create settings
  const settingsData = [
    { key: 'companyName', value: 'Bait Al Hadaf General Trading L.L.C.', description: 'Company name for invoices and documents' },
    { key: 'companyAddress', value: 'Dubai, United Arab Emirates', description: 'Company address' },
    { key: 'defaultCurrency', value: 'AED', description: 'Default currency for purchases' },
    { key: 'poNumberPrefix', value: 'PO-', description: 'Purchase order number prefix' },
    { key: 'grnNumberPrefix', value: 'GRN-', description: 'Goods Received Note number prefix' },
    { key: 'invoiceNumberPrefix', value: 'INV-', description: 'Invoice number prefix' },
    { key: 'paymentNumberPrefix', value: 'PAY-', description: 'Payment number prefix' },
    { key: 'ageingCategories', value: '0-7,8-15,16-30,30+', description: 'Ageing categories for PO tracking' },
    { key: 'vatPercentage', value: '5.0', description: 'VAT percentage' },
  ];

  for (const s of settingsData) {
    await prisma.setting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  // Create suppliers from UAE and international sources
  const suppliers = [
    {
      supplierId: 'SUP-001',
      name: 'Yamaha Middle East',
      contactPerson: 'Ahmed Al Mansoori',
      phone: '+971 4 123 4567',
      email: 'orders@yamaha-me.com',
      address: 'Dubai Industrial City, Dubai, UAE',
      country: 'UAE',
      trn: '123456789',
      currency: 'AED',
      paymentTerms: '45 Days',
      bankDetails: 'Emirates NBD, Account: 123456789',
    },
    {
      supplierId: 'SUP-002',
      name: 'Honda GCC Trading',
      contactPerson: 'Mohammed Hassan',
      phone: '+971 4 234 5678',
      email: 'purchasing@honda-gcc.com',
      address: 'Sharjah Industrial Area, UAE',
      country: 'UAE',
      trn: '234567890',
      currency: 'AED',
      paymentTerms: '30 Days',
      bankDetails: 'ADCB, Account: 987654321',
    },
    {
      supplierId: 'SUP-003',
      name: 'Suzuki Parts India Pvt. Ltd.',
      contactPerson: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      email: 'exports@suzukiparts.in',
      address: 'Chennai, Tamil Nadu, India',
      country: 'India',
      trn: 'IN123456',
      currency: 'INR',
      paymentTerms: '60 Days',
      bankDetails: 'HDFC Bank, Account: 11223344',
    },
    {
      supplierId: 'SUP-004',
      name: 'Guangzhou Generator Parts Co.',
      contactPerson: 'Li Wei',
      phone: '+86 138 0013 8000',
      email: 'sales@ggparts.cn',
      address: 'Guangzhou, Guangdong, China',
      country: 'China',
      trn: 'CH987654',
      currency: 'CNY',
      paymentTerms: '15 Days',
      bankDetails: 'ICBC, Account: 99887766',
    },
    {
      supplierId: 'SUP-005',
      name: 'Kawasaki International',
      contactPerson: 'Takahashi Sato',
      phone: '+81 3 1234 5678',
      email: 'export@kawasaki-intl.com',
      address: 'Tokyo, Japan',
      country: 'Japan',
      trn: 'JP456789',
      currency: 'USD',
      paymentTerms: '30 Days',
      bankDetails: 'Mizuho Bank, Account: 55556666',
    },
    {
      supplierId: 'SUP-006',
      name: 'German Engine Spare Parts GmbH',
      contactPerson: 'Hans Müller',
      phone: '+49 30 1234 5678',
      email: 'info@german-engine.de',
      address: 'Berlin, Germany',
      country: 'Germany',
      trn: 'DE123456',
      currency: 'EUR',
      paymentTerms: '30 Days',
      bankDetails: 'Deutsche Bank, Account: 77778888',
    },
    {
      supplierId: 'SUP-007',
      name: 'US Auto Parts Inc.',
      contactPerson: 'John Smith',
      phone: '+1 312 555 0123',
      email: 'purchasing@usautoparts.com',
      address: 'Chicago, Illinois, USA',
      country: 'USA',
      trn: 'US654321',
      currency: 'USD',
      paymentTerms: 'Net 30',
      bankDetails: 'Bank of America, Account: 99991111',
    },
    {
      supplierId: 'SUP-008',
      name: 'Turkish Motorcycle Parts',
      contactPerson: 'Mehmet Yılmaz',
      phone: '+90 212 345 6789',
      email: 'sales@turkishparts.com',
      address: 'Istanbul, Turkey',
      country: 'Turkey',
      trn: 'TR789012',
      currency: 'TRY',
      paymentTerms: '45 Days',
      bankDetails: 'Garanti Bank, Account: 12341234',
    },
  ];

  for (const supplier of suppliers) {
    await prisma.supplier.create({
      data: supplier,
    });
  }

  console.log(`✅ Created ${suppliers.length} suppliers`);

  // Create products (motorcycle and generator spare parts)
  const products = [
    // Motorcycle Engine Parts
    { itemCode: 'MP-001', itemName: 'Yamaha Engine Cylinder Block', brand: 'Yamaha', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 850.0, currency: 'AED' },
    { itemCode: 'MP-002', itemName: 'Honda Piston Kit', brand: 'Honda', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'SET', defaultPurchasePrice: 320.0, currency: 'AED' },
    { itemCode: 'MP-003', itemName: 'Suzuki Clutch Plate Set', brand: 'Suzuki', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'SET', defaultPurchasePrice: 185.0, currency: 'AED' },
    { itemCode: 'MP-004', itemName: 'Kawasaki Timing Chain', brand: 'Kawasaki', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 95.0, currency: 'AED' },
    { itemCode: 'MP-005', itemName: 'Engine Valve Spring', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 25.0, currency: 'AED' },

    // Motorcycle Electrical Parts
    { itemCode: 'MP-006', itemName: 'Motorcycle Battery 12V', brand: 'Yuasa', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 280.0, currency: 'AED' },
    { itemCode: 'MP-007', itemName: 'Starter Motor Assembly', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 420.0, currency: 'AED' },
    { itemCode: 'MP-008', itemName: 'CDI Unit', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 120.0, currency: 'AED' },
    { itemCode: 'MP-009', itemName: 'Headlight Assembly', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'SET', defaultPurchasePrice: 85.0, currency: 'AED' },
    { itemCode: 'MP-010', itemName: 'Turn Signal Light', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 18.0, currency: 'AED' },

    // Motorcycle Suspension & Brakes
    { itemCode: 'MP-011', itemName: 'Front Shock Absorber', brand: 'KYB', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 250.0, currency: 'AED' },
    { itemCode: 'MP-012', itemName: 'Brake Disc Rotor', brand: 'Brembo', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 190.0, currency: 'AED' },
    { itemCode: 'MP-013', itemName: 'Brake Pad Set', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'SET', defaultPurchasePrice: 65.0, currency: 'AED' },
    { itemCode: 'MP-014', itemName: 'Rear Suspension Spring', brand: 'Generic', category: 'Motorcycle Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 45.0, currency: 'AED' },

    // Generator Spare Parts
    { itemCode: 'GP-001', itemName: 'Generator Alternator', brand: 'Cummins', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 1200.0, currency: 'AED' },
    { itemCode: 'GP-002', itemName: 'Engine Oil Filter', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 35.0, currency: 'AED' },
    { itemCode: 'GP-003', itemName: 'Fuel Pump Assembly', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 180.0, currency: 'AED' },
    { itemCode: 'GP-004', itemName: 'Voltage Regulator', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 220.0, currency: 'AED' },
    { itemCode: 'GP-005', itemName: 'Starter Solenoid', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 85.0, currency: 'AED' },
    { itemCode: 'GP-006', itemName: 'Generator Control Panel', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 650.0, currency: 'AED' },
    { itemCode: 'GP-007', itemName: 'Engine Gasket Set', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'SET', defaultPurchasePrice: 45.0, currency: 'AED' },
    { itemCode: 'GP-008', itemName: 'Air Filter Element', brand: 'Donaldson', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 28.0, currency: 'AED' },
    { itemCode: 'GP-009', itemName: 'Cooling Fan', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 95.0, currency: 'AED' },
    { itemCode: 'GP-010', itemName: 'Exhaust Silencer', brand: 'Generic', category: 'Generator Spare Parts', unitOfMeasurement: 'PCS', defaultPurchasePrice: 320.0, currency: 'AED' },
  ];

  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`✅ Created ${products.length} products`);

  // Create purchase orders
  const existingSuppliers = await prisma.supplier.findMany({ take: 3 });
  const existingProducts = await prisma.product.findMany({ take: 5 });

  const purchaseOrders = [
    {
      poNumber: 'PO-2024-001',
      supplierId: existingSuppliers[0].id,
      orderDate: new Date('2024-11-01'),
      expectedDeliveryDate: new Date('2024-11-15'),
      status: 'APPROVED',
      currency: 'AED',
      subtotal: 0,
      grandTotal: 0,
      createdBy: 'Ahmed',
    },
    {
      poNumber: 'PO-2024-002',
      supplierId: existingSuppliers[1].id,
      orderDate: new Date('2024-10-25'),
      expectedDeliveryDate: new Date('2024-11-10'),
      status: 'PARTIALLY_RECEIVED',
      currency: 'AED',
      subtotal: 0,
      grandTotal: 0,
      createdBy: 'Ahmed',
    },
    {
      poNumber: 'PO-2024-003',
      supplierId: existingSuppliers[2].id,
      orderDate: new Date('2024-10-20'),
      expectedDeliveryDate: new Date('2024-11-05'),
      status: 'FULLY_RECEIVED',
      currency: 'INR',
      exchangeRate: 0.045,
      subtotal: 0,
      grandTotal: 0,
      createdBy: 'Ahmed',
    },
    {
      poNumber: 'PO-2024-004',
      supplierId: existingSuppliers[0].id,
      orderDate: new Date('2024-10-15'),
      expectedDeliveryDate: new Date('2024-10-30'),
      status: 'DELAYED',
      currency: 'AED',
      subtotal: 0,
      grandTotal: 0,
      createdBy: 'Ahmed',
    },
  ];

  // Create POs and calculate totals
  for (let i = 0; i < purchaseOrders.length; i++) {
    const po = purchaseOrders[i];
    const poItems = [
      { productId: existingProducts[0].id, itemCode: existingProducts[0].itemCode, itemName: existingProducts[0].itemName, quantity: 10, unitPrice: existingProducts[0].defaultPurchasePrice, total: 10 * existingProducts[0].defaultPurchasePrice },
      { productId: existingProducts[1].id, itemCode: existingProducts[1].itemCode, itemName: existingProducts[1].itemName, quantity: 5, unitPrice: existingProducts[1].defaultPurchasePrice, total: 5 * existingProducts[1].defaultPurchasePrice },
      { productId: existingProducts[2].id, itemCode: existingProducts[2].itemCode, itemName: existingProducts[2].itemName, quantity: 8, unitPrice: existingProducts[2].defaultPurchasePrice, total: 8 * existingProducts[2].defaultPurchasePrice },
    ];

    const subtotal = poItems.reduce((sum, item) => sum + item.total, 0);
    const discountAmount = subtotal * 0.05; // 5% discount
    const shippingAmount = 150.0;
    const otherExpensesAmount = 75.0;
    const vatAmount = (subtotal - discountAmount + shippingAmount + otherExpensesAmount) * 0.05; // 5% VAT
    const grandTotal = subtotal - discountAmount + shippingAmount + otherExpensesAmount + vatAmount;

    const createdPO = await prisma.purchaseOrder.create({
      data: {
        ...po,
        subtotal,
        discountAmount,
        shippingAmount,
        otherExpensesAmount,
        vatAmount,
        grandTotal,
        items: {
          create: poItems,
        },
      },
    });
  }

  console.log(`✅ Created ${purchaseOrders.length} purchase orders with items`);

  // Create notifications
  const notifications = [
    { title: 'PO Approval Required', message: 'Purchase Order PO-2024-001 requires your approval', type: 'WARNING', linkUrl: '/purchase-orders/PO-2024-001' },
    { title: 'Delivery Overdue', message: 'Purchase Order PO-2024-004 is 5 days overdue', type: 'DANGER', linkUrl: '/purchase-orders/PO-2024-004' },
    { title: 'Payment Received', message: 'Payment of AED 15,000 received from Yamaha Middle East', type: 'SUCCESS', linkUrl: '/payments' },
    { title: 'New Invoice Created', message: 'Invoice INV-2024-001 created from PO-2024-001', type: 'INFO', linkUrl: '/invoices/INV-2024-001' },
  ];

  await prisma.notification.createMany({
    data: notifications,
  });

  console.log(`✅ Created ${notifications.length} notifications`);

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
