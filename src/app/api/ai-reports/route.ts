import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { reportType, query } = body;

    // Fetch real data from database
    const [suppliers, products, po, grn, purchaseInvoices, payments, salesInvoices, salesReceipts] = await Promise.all([
      prisma.supplier.findMany(),
      prisma.product.findMany(),
      prisma.purchaseOrder.findMany({ include: { items: true } }),
      prisma.goodsReceivedNote.findMany({ include: { purchaseOrder: true } }),
      prisma.purchaseInvoice.findMany({ include: { items: true, supplier: true } }),
      prisma.payment.findMany({ include: { supplier: true } }),
      prisma.salesInvoice.findMany({ include: { items: true, payments: true } }),
      prisma.salesReceipt.findMany(),
    ]);

    // Financial calculations (all stored in integer fils -> divide by 100 for AED values)
    const totalPurchasesAED = purchaseInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0) / 100;
    const totalAccountsPayableAED = purchaseInvoices.filter((i) => i.status !== "PAID").reduce((sum, inv) => sum + inv.grandTotal, 0) / 100;
    const totalSupplierPaymentsAED = payments.filter((p) => p.status === "APPROVED").reduce((sum, p) => sum + p.amount, 0) / 100;
    const totalPoValueAED = po.reduce((sum, p) => sum + p.grandTotal, 0) / 100;

    // Real Sales calculations (1.8 fix: sales invoices are revenue, not purchase bills)
    const totalSalesRevenueAED = salesInvoices
      .filter((i) => i.status !== "CANCELLED" && i.status !== "DRAFT")
      .reduce((sum, inv) => sum + inv.grandTotal, 0) / 100;

    const totalSalesCollectedAED = salesReceipts
      .filter((r) => r.status === "APPROVED")
      .reduce((sum, r) => sum + r.amount, 0) / 100;

    const totalAccountsReceivableAED = Math.max(0, totalSalesRevenueAED - totalSalesCollectedAED);

    // Inventory valuation (quantity * defaultPurchasePrice in fils -> AED)
    const inventoryValueAED = products.reduce((sum, p) => sum + (p.currentStock * (p.defaultPurchasePrice / 100)), 0);

    const generateReport = () => {
      switch (reportType) {
        case "sales-summary":
          // 1.8 Fix: Do not mislabel purchase invoices as revenue/receivables.
          // Source from actual SalesInvoice and SalesReceipt tables.
          if (salesInvoices.length === 0) {
            return {
              title: "Sales & Revenue Summary",
              generatedAt: new Date().toISOString(),
              summary: "No customer sales invoices have been recorded in the system yet. Outgoing procurement bills (AED " + formatAED(totalPurchasesAED) + ") are tracked under Accounts Payable.",
              keyInsights: [
                "Sales Invoices: 0",
                "Customer Receipts: 0",
                "Total Revenue: AED 0.00",
                "Accounts Receivable: AED 0.00",
                "Notice: To record revenue, generate invoices under the Sales Invoices module.",
              ],
              data: {
                invoices: 0,
                payments: 0,
                revenue: 0,
                paid: 0,
                receivables: 0,
                invoiceBreakdown: [],
              },
            };
          }

          return {
            title: "Sales & Revenue Summary",
            generatedAt: new Date().toISOString(),
            summary: `Total realized sales revenue stands at ${formatAED(totalSalesRevenueAED)} across ${salesInvoices.length} sales invoice(s), with ${formatAED(totalSalesCollectedAED)} collected and ${formatAED(totalAccountsReceivableAED)} outstanding in receivables.`,
            keyInsights: [
              `Total Sales Revenue: ${formatAED(totalSalesRevenueAED)}`,
              `Amount Collected: ${formatAED(totalSalesCollectedAED)}`,
              `Outstanding Receivables: ${formatAED(totalAccountsReceivableAED)}`,
              `Sales Invoices Count: ${salesInvoices.length}`,
              `Receipts Count: ${salesReceipts.length}`,
            ],
            data: {
              invoices: salesInvoices.length,
              payments: salesReceipts.length,
              revenue: totalSalesRevenueAED,
              paid: totalSalesCollectedAED,
              receivables: totalAccountsReceivableAED,
              invoiceBreakdown: salesInvoices.map((i) => ({
                number: i.invoiceNumber,
                customer: i.customerName,
                amount: i.grandTotal / 100,
                status: i.status,
                date: i.invoiceDate.toISOString(),
              })),
            },
          };

        case "inventory-valuation":
          const stockCategories = products.reduce((acc, p) => {
            const cat = p.category || "Uncategorized";
            if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
            acc[cat].count += 1;
            acc[cat].value += p.currentStock * (p.defaultPurchasePrice / 100);
            return acc;
          }, {} as Record<string, { count: number; value: number }>);

          return {
            title: "Inventory Valuation Report",
            generatedAt: new Date().toISOString(),
            summary: `Your inventory consists of ${products.length} products with a total valuation of ${formatAED(inventoryValueAED)}. ${products.filter((p) => p.currentStock <= 0).length} item(s) are out of stock and may need reorder. Stock levels are tracked across ${Object.keys(stockCategories).length} category/categories.`,
            keyInsights: [
              `Total Products: ${products.length}`,
              `Total Inventory Value: ${formatAED(inventoryValueAED)}`,
              `Out of Stock Items: ${products.filter((p) => p.currentStock <= 0).length}`,
              `Categories: ${Object.keys(stockCategories).length}`,
              `Average Stock per Product: ${Math.round(products.reduce((sum, p) => sum + p.currentStock, 0) / (products.length || 1))} units`,
            ],
            data: {
              products: products.length,
              totalValue: inventoryValueAED,
              stockCategories: Object.entries(stockCategories).map(([cat, data]) => ({
                category: cat,
                skuCount: data.count,
                totalValue: data.value,
              })),
              lowStock: products.filter((p) => p.currentStock <= p.reorderLevel).map((p) => ({
                name: p.itemName,
                sku: p.itemCode,
                currentStock: p.currentStock,
                reorderLevel: p.reorderLevel,
              })),
            },
          };

        case "accounts-payable":
          const outstandingInvoices = purchaseInvoices.filter((i) => i.status !== "PAID" && i.status !== "CANCELLED");
          const currentPayableAED = outstandingInvoices
            .filter((i) => new Date() <= new Date(i.dueDate))
            .reduce((sum, i) => sum + i.grandTotal, 0) / 100;
          const overduePayableAED = outstandingInvoices
            .filter((i) => new Date() > new Date(i.dueDate))
            .reduce((sum, i) => sum + i.grandTotal, 0) / 100;

          return {
            title: "Accounts Payable Aging",
            generatedAt: new Date().toISOString(),
            summary: `Total accounts payable stands at ${formatAED(totalAccountsPayableAED)}. You have ${outstandingInvoices.length} unpaid bill(s) with ${formatAED(overduePayableAED)} overdue and ${formatAED(currentPayableAED)} due within agreed payment terms.`,
            keyInsights: [
              `Total Payable: ${formatAED(totalAccountsPayableAED)}`,
              `Overdue Amount: ${formatAED(overduePayableAED)}`,
              `Current Payable: ${formatAED(currentPayableAED)}`,
              `Unpaid Invoices: ${outstandingInvoices.length}`,
            ],
            data: {
              totalPayable: totalAccountsPayableAED,
              overdue: overduePayableAED,
              current: currentPayableAED,
              invoices: outstandingInvoices.map((i) => ({
                invoice: i.invoiceNumber,
                supplier: i.supplier?.name || "Unknown",
                amount: i.grandTotal / 100,
                dueDate: i.dueDate.toISOString(),
                status: i.status,
                daysOverdue: new Date() > new Date(i.dueDate) ? Math.round((new Date().getTime() - new Date(i.dueDate).getTime()) / (1000 * 60 * 60 * 24)) : 0,
              })),
            },
          };

        case "supplier-performance":
          const supplierStats = suppliers.map((s) => {
            const sInvoices = purchaseInvoices.filter((i) => i.supplierId === s.id);
            const sPayments = payments.filter((p) => p.supplierId === s.id);
            const sGrns = grn.filter((g) => g.supplierId === s.id);

            const totalPurchasedAED = sInvoices.reduce((sum, i) => sum + i.grandTotal, 0) / 100;
            const paidToSupplierAED = sPayments.reduce((sum, p) => sum + p.amount, 0) / 100;

            // 1.8 Fix: Real calculation of on-time delivery rate from real GRNs (no Math.random())
            let onTimeDeliveries = 0;
            sGrns.forEach((g) => {
              if (g.purchaseOrder?.expectedDeliveryDate) {
                if (new Date(g.receivedDate) <= new Date(g.purchaseOrder.expectedDeliveryDate)) {
                  onTimeDeliveries++;
                }
              }
            });
            const realOnTimeRate = sGrns.length > 0 ? Math.round((onTimeDeliveries / sGrns.length) * 100) : 100;

            return {
              supplier: s.name,
              totalPurchased: totalPurchasedAED,
              paid: paidToSupplierAED,
              invoiceCount: sInvoices.length,
              paymentCount: sPayments.length,
              onTimeRate: realOnTimeRate,
            };
          });

          const totalProcurementValueAED = supplierStats.reduce((sum, s) => sum + s.totalPurchased, 0);

          return {
            title: "Supplier Performance Analysis",
            generatedAt: new Date().toISOString(),
            summary: `Tracking ${suppliers.length} active supplier(s). Total confirmed procurement spend is ${formatAED(totalProcurementValueAED)}.`,
            keyInsights: [
              `Active Suppliers: ${suppliers.length}`,
              `Total Procurement Spend: ${formatAED(totalProcurementValueAED)}`,
              `Total Purchase Orders: ${po.length}`,
              `Total Deliveries Received: ${grn.length}`,
            ],
            data: {
              suppliers: suppliers.map((s) => ({
                name: s.name,
                contactPerson: s.contactPerson,
                country: s.country,
                paymentTerms: s.paymentTerms,
              })),
              stats: supplierStats.sort((a, b) => b.totalPurchased - a.totalPurchased).slice(0, 10),
              paymentHistory: payments.slice(0, 10).map((p) => ({
                supplier: p.supplier?.name || "Unknown",
                amount: p.amount / 100,
                date: p.paymentDate.toISOString(),
                method: p.paymentMethod,
              })),
            },
          };

        default:
          return {
            title: "Executive Procurement Snapshot",
            generatedAt: new Date().toISOString(),
            summary: `Executive Overview: Total Procurement Spend ${formatAED(totalPurchasesAED)}, Total Payments Made ${formatAED(totalSupplierPaymentsAED)}, Accounts Payable Outstanding ${formatAED(totalAccountsPayableAED)}, Inventory Stock Valuation ${formatAED(inventoryValueAED)}.`,
            keyInsights: [
              `Procurement Spend: ${formatAED(totalPurchasesAED)}`,
              `Supplier Payments: ${formatAED(totalSupplierPaymentsAED)}`,
              `Accounts Payable: ${formatAED(totalAccountsPayableAED)}`,
              `Inventory Valuation: ${formatAED(inventoryValueAED)}`,
              `Active Purchase Orders: ${po.length}`,
            ],
            data: {
              financials: {
                purchases: totalPurchasesAED,
                paid: totalSupplierPaymentsAED,
                payables: totalAccountsPayableAED,
                inventory: inventoryValueAED,
              },
              operations: {
                suppliers: suppliers.length,
                products: products.length,
                po: po.length,
                invoices: purchaseInvoices.length,
                payments: payments.length,
              },
            },
          };
      }
    };

    return NextResponse.json({
      success: true,
      report: generateReport(),
    });
  } catch (error: any) {
    console.error("Error generating AI report:", error);
    return NextResponse.json({ error: error.message || "Failed to generate report" }, { status: 500 });
  }
}

function formatAED(amount: number): string {
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: "AED",
    minimumFractionDigits: 2,
  }).format(amount);
}
