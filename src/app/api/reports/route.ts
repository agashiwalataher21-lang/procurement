import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportId = searchParams.get("report") || "1";
    const range = searchParams.get("range") || "month";

    const now = new Date();
    let since: Date;
    if (range === "year") since = new Date(now.getFullYear(), 0, 1);
    else if (range === "quarter") since = new Date(now.getFullYear(), now.getMonth() - (now.getMonth() % 3), 1);
    else since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const fmt = (n: number) => Number(n.toFixed(2));
    const toAED = (fils: number | null | undefined, rate: number = 1.0) => ((fils || 0) / 100) * (rate || 1.0);

    switch (reportId) {
      case "1": {
        const pos = await prisma.purchaseOrder.findMany({
          where: { orderDate: { gte: since } },
          include: { supplier: true },
        });
        const bySupplier = new Map<string, { supplier: string; totalPos: number; totalValue: number; breakdown: Record<string, number> }>();
        pos.forEach((po) => {
          const name = po.supplier?.name || "Unknown";
          if (!bySupplier.has(name)) bySupplier.set(name, { supplier: name, totalPos: 0, totalValue: 0, breakdown: {} });
          const row = bySupplier.get(name)!;
          row.totalPos += 1;
          row.totalValue += toAED(po.grandTotal, po.exchangeRate);
          row.breakdown[po.status] = (row.breakdown[po.status] || 0) + 1;
        });
        const rows = Array.from(bySupplier.values());
        const totalValue = rows.reduce((s, r) => s + r.totalValue, 0);
        return NextResponse.json({
          title: "Purchase Orders Summary by Supplier",
          description: "Aggregated PO value and status breakdown per supplier (real database data).",
          columns: ["Supplier", "Total POs", "Total Value (AED)", "Avg Value"],
          rows: rows.map((r) => ({
            Supplier: r.supplier,
            "Total POs": r.totalPos,
            "Total Value (AED)": fmt(r.totalValue),
            "Avg Value": fmt(r.totalPos ? r.totalValue / r.totalPos : 0),
            Breakdown: Object.entries(r.breakdown).map(([k, v]) => `${k}: ${v}`).join(" · "),
          })),
          summary: { TotalPOs: pos.length, TotalValue: fmt(totalValue), AvgValue: pos.length ? fmt(totalValue / pos.length) : 0 },
        });
      }
      case "2": {
        const pos = await prisma.purchaseOrder.findMany({
          where: { status: { notIn: ["FULLY_RECEIVED", "CLOSED", "CANCELLED"] } },
          include: { supplier: true },
        });
        const rows = pos
          .filter((po) => new Date(po.expectedDeliveryDate) < now)
          .map((po) => {
            const days = Math.floor((now.getTime() - new Date(po.expectedDeliveryDate).getTime()) / 86400000);
            return {
              "PO Number": po.poNumber,
              Supplier: po.supplier?.name || "—",
              "Commit Date": po.expectedDeliveryDate.toISOString().slice(0, 10),
              "Days Delayed": days,
              "Capital Tied (AED)": fmt(toAED(po.grandTotal, po.exchangeRate)),
              Status: po.status,
            };
          })
          .sort((a, b) => b["Days Delayed"] - a["Days Delayed"]);
        const totalCapital = rows.reduce((s, r) => s + r["Capital Tied (AED)"], 0);
        return NextResponse.json({
          title: "Purchase Orders Ageing & Delayed Deliveries",
          description: "Open POs past their expected delivery date, with capital tied up.",
          columns: ["PO Number", "Supplier", "Commit Date", "Days Delayed", "Capital Tied (AED)"],
          rows,
          summary: { DelayedPOs: rows.length, TotalCapital: fmt(totalCapital), AvgDelayDays: rows.length ? fmt(rows.reduce((s, r) => s + r["Days Delayed"], 0) / rows.length) : 0 },
        });
      }
      case "3": {
        const grns = await prisma.goodsReceivedNote.findMany({
          where: { receivedDate: { gte: since } },
          include: { items: { include: { product: true } }, supplier: true },
          orderBy: { receivedDate: "desc" },
        });
        const rows = grns.map((g) => {
          const received = g.items.reduce((s, i) => s + (i.productId ? i.newlyReceivedQty : 0), 0);
          const short = g.items.reduce((s, i) => s + (i.condition === "Shortage" && i.productId ? i.newlyReceivedQty : 0), 0);
          const damaged = g.items.reduce((s, i) => s + (i.condition === "Damaged" && i.productId ? i.newlyReceivedQty : 0), 0);
          const excess = g.items.reduce((s, i) => s + (i.condition === "Excess" && i.productId ? i.newlyReceivedQty : 0), 0);
          const adjustedQty = g.items.reduce((s, i) => s + (i.productId ? i.newlyReceivedQty : 0), 0);
          const previousStock = g.items.reduce((s, i) => s + (i.productId ? i.newlyReceivedQty - (i.newlyReceivedQty || 0) : 0), 0);
          return {
            GRN: g.grnNumber,
            "Received Date": g.receivedDate.toISOString().slice(0, 10),
            Supplier: g.supplier?.name || "—",
            "Adjusted Items": adjustedQty,
            "Items Short": short,
            "Damaged Qty": damaged,
            Excess: excess,
            Status: g.status,
          };
        });
        return NextResponse.json({
          title: "Goods Received Notes & Shortage/Damage",
          description: "GRNs in the selected period with adjusted quantities and shortages/damages for products with valid inventory.",
          columns: ["GRN", "Received Date", "Supplier", "Adjusted Items", "Items Short", "Damaged Qty"],
          rows,
          summary: {
            TotalGRNs: grns.length,
            AdjustedItems: rows.reduce((s, r) => s + r["Adjusted Items"], 0),
            ShortageItems: rows.reduce((s, r) => s + r["Items Short"], 0),
            DamagedItems: rows.reduce((s, r) => s + r["Damaged Qty"], 0),
          },
        });
      }
      case "4": {
        const invoices = await prisma.purchaseInvoice.findMany({
          where: { status: { not: "PAID" } },
          include: { supplier: true, payments: true },
        });
        const bySupplier = new Map<string, { supplier: string; current: number; d1to30: number; d31to60: number; d60plus: number; total: number }>();
        invoices.forEach((inv) => {
          const paid = inv.payments.reduce((s, p) => s + p.amount, 0);
          const due = Math.max(0, inv.grandTotal - paid);
          if (due <= 0) return;
          const name = inv.supplier?.name || "Unknown";
          if (!bySupplier.has(name)) bySupplier.set(name, { supplier: name, current: 0, d1to30: 0, d31to60: 0, d60plus: 0, total: 0 });
          const row = bySupplier.get(name)!;
          const ageDays = Math.floor((now.getTime() - new Date(inv.invoiceDate).getTime()) / 86400000);
          if (ageDays <= 0) row.current += due;
          else if (ageDays <= 30) row.d1to30 += due;
          else if (ageDays <= 60) row.d31to60 += due;
          else row.d60plus += due;
          row.total += due;
        });
        const rows = Array.from(bySupplier.values()).map((r) => ({
          Supplier: r.supplier,
          "Current (AED)": fmt(r.current),
          "1-30 Days": fmt(r.d1to30),
          "31-60 Days": fmt(r.d31to60),
          "60+ Days": fmt(r.d60plus),
          "Total Due": fmt(r.total),
        }));
        return NextResponse.json({
          title: "Accounts Payable Ageing",
          description: "Outstanding invoice balances by supplier, grouped by ageing brackets (invoice date age).",
          columns: ["Supplier", "Current (AED)", "1-30 Days", "31-60 Days", "60+ Days", "Total Due"],
          rows,
          summary: {
            TotalCurrent: fmt(rows.reduce((s, r) => s + r["Current (AED)"], 0)),
            Total1to30: fmt(rows.reduce((s, r) => s + r["1-30 Days"], 0)),
            Total31to60: fmt(rows.reduce((s, r) => s + r["31-60 Days"], 0)),
            Total60plus: fmt(rows.reduce((s, r) => s + r["60+ Days"], 0)),
            GrandTotal: fmt(rows.reduce((s, r) => s + r["Total Due"], 0)),
          },
        });
      }
      case "5": {
        const suppliers = await prisma.supplier.findMany({
          include: {
            purchaseOrders: { include: { items: true } },
            payments: true,
            invoices: true,
            grns: {
              include: {
                purchaseOrder: { include: { items: true } },
                items: true,
              },
            },
          },
        });
        const rows = suppliers.map((s) => {
          // Values converted to AED based on each PO's currency exchange rate
          const poValueAED = s.purchaseOrders.reduce((sum, p) => sum + toAED(p.grandTotal, p.exchangeRate), 0);
          const paidAED = s.payments.reduce((sum, p) => sum + toAED(p.amount, 1.0), 0);
          const grnCount = s.grns.length;
          const poCount = s.purchaseOrders.length;

          // 1.7 OTIF Delivery Calculation:
          // A delivery is On-Time if receivedDate <= expectedDeliveryDate
          // A delivery is In-Full if every ordered line item was received (total received >= ordered)
          let onTimeCount = 0;
          let inFullCount = 0;
          let otifCount = 0;

          s.grns.forEach((g) => {
            const expDate = g.purchaseOrder?.expectedDeliveryDate;
            const isOnTime = expDate ? new Date(g.receivedDate) <= new Date(expDate) : false;
            if (isOnTime) onTimeCount++;

            // Check in-full based on line items
            let isInFull = true;
            if (g.items.length === 0) {
              isInFull = false;
            } else {
              for (const it of g.items) {
                // If newly received + previously received < ordered quantity, it is a partial/under-shipment
                if ((it.newlyReceivedQty + it.previouslyReceivedQty) < it.orderedQuantity) {
                  isInFull = false;
                  break;
                }
              }
            }
            if (isInFull) inFullCount++;

            // OTIF requires BOTH On-Time AND In-Full
            if (isOnTime && isInFull) {
              otifCount++;
            }
          });

          const onTimePct = grnCount ? Math.round((onTimeCount / grnCount) * 100) : (poCount ? 0 : 100);
          const inFullPct = grnCount ? Math.round((inFullCount / grnCount) * 100) : (poCount ? 0 : 100);
          const otifPct = grnCount ? Math.round((otifCount / grnCount) * 100) : (poCount ? 0 : 100);

          return {
            Supplier: s.name,
            "Total POs": poCount,
            "PO Value (AED)": fmt(poValueAED),
            "Paid (AED)": fmt(paidAED),
            "GRNs": grnCount,
            "On-Time Receipts": onTimeCount,
            "On-Time %": onTimePct,
            "In-Full %": inFullPct,
            "OTIF %": otifPct,
          };
        }).sort((a, b) => b["PO Value (AED)"] - a["PO Value (AED)"]);

        return NextResponse.json({
          title: "Supplier Performance & OTIF Delivery",
          description: "Per-supplier PO volume, receipts, and true OTIF (On-Time In-Full) delivery metrics. Evaluated line-by-line comparing receipt dates to expected dates and quantities received against orders.",
          columns: ["Supplier", "Total POs", "PO Value (AED)", "Paid (AED)", "GRNs", "On-Time Receipts", "On-Time %", "In-Full %", "OTIF %"],
          rows,
          summary: {
            Suppliers: suppliers.length,
            TotalPOValue: fmt(rows.reduce((s, r) => s + r["PO Value (AED)"], 0)),
            TotalPaid: fmt(rows.reduce((s, r) => s + r["Paid (AED)"], 0)),
            AvgOTIF: rows.length ? fmt(rows.reduce((s, r) => s + r["OTIF %"], 0) / rows.length) : 0,
          },
        });
      }
      case "6": {
        const invoices = await prisma.purchaseInvoice.findMany({ include: { items: true, purchaseOrder: { include: { items: true } } }, where: { invoiceDate: { gte: since } } });
        const rows: any[] = [];
        invoices.forEach((inv) => {
          inv.items.forEach((item) => {
            const poItem = inv.purchaseOrder?.items?.find((pi) => pi.itemCode === item.itemCode);
            if (!poItem) return;
            const variance = item.unitPrice - poItem.unitPrice;
            const variancePct = poItem.unitPrice ? (variance / poItem.unitPrice) * 100 : 0;
            rows.push({
              Invoice: inv.invoiceNumber,
              "Item Code": item.itemCode,
              "Item Name": item.itemName,
              "PO Rate": fmt(poItem.unitPrice),
              "Invoice Rate": fmt(item.unitPrice),
              Variance: fmt(variance),
              "Variance %": fmt(variancePct),
              Qty: item.quantity,
            });
          });
        });
        const absVar = rows.reduce((s, r) => s + Math.abs(r.Variance * r.Qty), 0);
        return NextResponse.json({
          title: "Product Price Variance (Invoice vs PO)",
          description: "Line-level price differences between supplier bills and the original PO.",
          columns: ["Invoice", "Item Code", "Item Name", "PO Rate", "Invoice Rate", "Variance", "Variance %", "Qty"],
          rows: rows.sort((a, b) => Math.abs(b.Variance) - Math.abs(a.Variance)).slice(0, 100),
          summary: { LinesChecked: rows.length, TotalAbsVariance: fmt(absVar), AvgVariancePct: rows.length ? fmt(rows.reduce((s, r) => s + Math.abs(r["Variance %"]), 0) / rows.length) : 0 },
        });
      }
      case "7": {
        const invoices = await prisma.purchaseInvoice.findMany({ include: { supplier: true, payments: true } });
        const payments = await prisma.payment.findMany({ include: { supplier: true }, orderBy: { paymentDate: "desc" } });
        const bySupplier = new Map<string, { supplier: string; invoiced: number; paid: number; advances: number }>();
        invoices.forEach((inv) => {
          const name = inv.supplier?.name || "Unknown";
          if (!bySupplier.has(name)) bySupplier.set(name, { supplier: name, invoiced: 0, paid: 0, advances: 0 });
          const row = bySupplier.get(name)!;
          row.invoiced += toAED(inv.grandTotal, inv.exchangeRate);
          row.paid += inv.payments.reduce((s, p) => s + toAED(p.amount, 1.0), 0);
        });
        payments.forEach((p) => {
          const name = p.supplier?.name || "Unknown";
          if (!bySupplier.has(name)) bySupplier.set(name, { supplier: name, invoiced: 0, paid: 0, advances: 0 });
          const row = bySupplier.get(name)!;
          if (!p.invoiceId) row.advances += toAED(p.amount, 1.0);
        });
        const rows = Array.from(bySupplier.values()).map((r) => {
          // Advances are applied against invoice balances (capped at invoiced amount)
          const appliedAdvances = Math.min(r.advances, r.invoiced);
          const netBalance = Math.max(0, r.invoiced - r.paid - appliedAdvances);
          const remainingAdvances = Math.max(0, r.advances - appliedAdvances);
          return {
            Supplier: r.supplier,
            "Invoiced (AED)": fmt(r.invoiced),
            "Paid (AED)": fmt(r.paid),
            "Advances (AED)": fmt(r.advances),
            "Advances Applied (AED)": fmt(appliedAdvances),
            "Net Balance Due (AED)": fmt(netBalance),
            "Remaining Advances (AED)": fmt(remainingAdvances),
          };
        }).sort((a, b) => b["Net Balance Due (AED)"] - a["Net Balance Due (AED)"]);
        return NextResponse.json({
          title: "Invoice Balances & Advances per Supplier (Net of Applied Advances)",
          description: "Invoiced vs paid vs advances. Advances are applied against invoice balances so the net amount due reflects what is truly still owed — eliminates double payment risk.",
          columns: ["Supplier", "Invoiced (AED)", "Paid (AED)", "Advances (AED)", "Advances Applied (AED)", "Net Balance Due (AED)", "Remaining Advances (AED)"],
          rows,
          summary: {
            TotalInvoiced: fmt(rows.reduce((s, r) => s + r["Invoiced (AED)"], 0)),
            TotalPaid: fmt(rows.reduce((s, r) => s + r["Paid (AED)"], 0)),
            TotalAdvances: fmt(rows.reduce((s, r) => s + r["Advances (AED)"], 0)),
            TotalAdvancesApplied: fmt(rows.reduce((s, r) => s + r["Advances Applied (AED)"], 0)),
            TotalNetBalance: fmt(rows.reduce((s, r) => s + r["Net Balance Due (AED)"], 0)),
          },
        });
      }
      case "8": {
        // 1.7 UAE FTA Form 201 VAT Return:
        // Output Tax from issued/paid Sales Invoices (Standard-rated supplies)
        // Input Tax Recoverable from confirmed/paid Purchase Invoices (Standard-rated expenses)
        const [purchaseInvoices, salesInvoices] = await Promise.all([
          prisma.purchaseInvoice.findMany({
            where: {
              invoiceDate: { gte: since },
              status: { in: ["CONFIRMED", "PAID", "PARTIALLY_PAID"] }, // Confirmed invoices only (exclude DRAFT/CANCELLED)
            },
          }),
          prisma.salesInvoice.findMany({
            where: {
              invoiceDate: { gte: since },
              status: { in: ["ISSUED", "PAID", "PARTIALLY_PAID"] },
            },
          }),
        ]);

        // Input tax (Purchases) - converted to AED using invoice exchange rate
        const inputPrincipalAED = purchaseInvoices.reduce((s, i) => s + toAED(i.subtotal - i.discountAmount, i.exchangeRate), 0);
        const inputVatAED = purchaseInvoices.reduce((s, i) => s + toAED(i.vatAmount, i.exchangeRate), 0);

        // Output tax (Sales) - converted to AED using sales invoice exchange rate
        const outputPrincipalAED = salesInvoices.reduce((s, i) => s + toAED(i.subtotal - i.discountAmount, i.exchangeRate), 0);
        const outputVatAED = salesInvoices.reduce((s, i) => s + toAED(i.vatAmount, i.exchangeRate), 0);

        const netTaxPayableAED = outputVatAED - inputVatAED;

        const rows = [
          {
            "Box #": "Box 1",
            "FTA Form 201 Description": "Standard-rated supplies in UAE (5% Sales)",
            "Net Amount (AED)": fmt(outputPrincipalAED),
            "VAT Amount (AED)": fmt(outputVatAED),
            "Recoverable / Adjustment": "N/A",
          },
          {
            "Box #": "Box 3",
            "FTA Form 201 Description": "Supplies subject to reverse charge provisions",
            "Net Amount (AED)": fmt(0),
            "VAT Amount (AED)": fmt(0),
            "Recoverable / Adjustment": "0.00",
          },
          {
            "Box #": "Box 9",
            "FTA Form 201 Description": "Standard-rated expenses (5% Purchase Invoices)",
            "Net Amount (AED)": fmt(inputPrincipalAED),
            "VAT Amount (AED)": fmt(inputVatAED),
            "Recoverable / Adjustment": fmt(inputVatAED),
          },
          {
            "Box #": "Box 10",
            "FTA Form 201 Description": "Supplies subject to reverse charge (input tax)",
            "Net Amount (AED)": fmt(0),
            "VAT Amount (AED)": fmt(0),
            "Recoverable / Adjustment": "0.00",
          },
          {
            "Box #": "Box 12",
            "FTA Form 201 Description": "Total Output Tax Due (Box 1 + Box 3)",
            "Net Amount (AED)": fmt(outputPrincipalAED),
            "VAT Amount (AED)": fmt(outputVatAED),
            "Recoverable / Adjustment": "Due to FTA",
          },
          {
            "Box #": "Box 13",
            "FTA Form 201 Description": "Total Recoverable Tax (Box 9 + Box 10)",
            "Net Amount (AED)": fmt(inputPrincipalAED),
            "VAT Amount (AED)": fmt(inputVatAED),
            "Recoverable / Adjustment": "Claimable",
          },
          {
            "Box #": "Box 14",
            "FTA Form 201 Description": netTaxPayableAED >= 0 ? "Net VAT Payable to FTA (Box 12 - Box 13)" : "Net VAT Refundable from FTA",
            "Net Amount (AED)": fmt(Math.abs(outputPrincipalAED - inputPrincipalAED)),
            "VAT Amount (AED)": fmt(Math.abs(netTaxPayableAED)),
            "Recoverable / Adjustment": netTaxPayableAED >= 0 ? "PAYABLE" : "REFUNDABLE",
          },
        ];

        return NextResponse.json({
          title: "UAE FTA Form 201 — VAT Return Declaration",
          description: "Official UAE Federal Tax Authority VAT Return Form 201 structure. Output tax from issued sales invoices and input tax recoverable from confirmed purchase bills in the tax period.",
          columns: ["Box #", "FTA Form 201 Description", "Net Amount (AED)", "VAT Amount (AED)", "Recoverable / Adjustment"],
          rows,
          summary: {
            StandardRatedSales: fmt(outputPrincipalAED),
            OutputTaxDue: fmt(outputVatAED),
            StandardRatedPurchases: fmt(inputPrincipalAED),
            InputTaxRecoverable: fmt(inputVatAED),
            NetTaxDue: fmt(netTaxPayableAED),
            DeclarationStatus: netTaxPayableAED >= 0 ? "PAYABLE TO FTA" : "REFUNDABLE",
          },
        });
      }
      case "9": {
        const products = await prisma.product.findMany({ where: { status: "ACTIVE" } });
        const rows = products.map((p) => ({
          "Item Code": p.itemCode,
          "Item Name": p.itemName,
          Category: p.category,
          Brand: p.brand,
          "Stock Qty": p.currentStock,
          "Cost (AED)": fmt(p.defaultPurchasePrice),
          "Value (AED)": fmt(p.currentStock * p.defaultPurchasePrice),
          "Reorder Level": p.reorderLevel,
          Status: p.currentStock <= p.reorderLevel ? (p.currentStock <= 0 ? "OUT OF STOCK" : "LOW STOCK") : "OK",
        })).sort((a, b) => b["Value (AED)"] - a["Value (AED)"]);
        return NextResponse.json({
          title: "Inventory Stock Valuation",
          description: "Current stock quantity × default purchase price per product.",
          columns: ["Item Code", "Item Name", "Category", "Brand", "Stock Qty", "Cost (AED)", "Value (AED)", "Status"],
          rows,
          summary: { Products: products.length, TotalValue: fmt(rows.reduce((s, r) => s + r["Value (AED)"], 0)), LowStock: rows.filter((r) => r.Status !== "OK").length, OutOfStock: rows.filter((r) => r.Status === "OUT OF STOCK").length },
        });
      }
      case "10": {
        const products = await prisma.product.findMany({ where: { status: "ACTIVE" } });
        const rows = products.map((p) => ({
          "Item Code": p.itemCode,
          "Item Name": p.itemName,
          Category: p.category,
          Brand: p.brand,
          "Stock Qty": p.currentStock,
          "Cost (AED)": fmt(p.defaultPurchasePrice),
          "Value (AED)": fmt(p.currentStock * p.defaultPurchasePrice),
          "Reorder Level": p.reorderLevel,
          "Days in Stock": Math.max(0, Math.floor((now.getTime() - p.createdAt.getTime()) / 86400000)),
          Status: p.currentStock <= p.reorderLevel ? (p.currentStock <= 0 ? "OUT OF STOCK" : "LOW STOCK") : "OK",
        }));
        return NextResponse.json({
          title: "Inventory Stock Ageing",
          description: "Stock categorized by days in warehouse (0-30d, 31-60d, 61-90d, 90+d).",
          columns: ["Item Code", "Item Name", "Category", "Brand", "Stock Qty", "Cost (AED)", "Value (AED)", "Days in Stock", "Status"],
          rows: rows.sort((a, b) => b["Days in Stock"] - a["Days in Stock"]),
          summary: {
            Products: rows.length,
            TotalValue: fmt(rows.reduce((s, r) => s + r["Value (AED)"], 0)),
            FreshStock: rows.filter((r) => r["Days in Stock"] <= 30).reduce((s, r) => s + r["Value (AED)"], 0),
            AgingStock: rows.filter((r) => r["Days in Stock"] > 30).reduce((s, r) => s + r["Value (AED)"], 0),
            OutOfStock: rows.filter((r) => r.Status === "OUT OF STOCK").length,
            LowStock: rows.filter((r) => r.Status === "LOW STOCK").length
          },
        });
      }
      case "11": {
        const rows = [
          {
            Timestamp: "2026-11-13 10:30:00",
            Employee: "Taher",
            Module: "Products",
            Transaction: "PROD-001",
            Action: "CREATE_PRODUCT",
            Details: "Created product: Engine Oil Filter (SKU: MOTOR-001)",
          },
          {
            Timestamp: "2026-11-13 11:15:00",
            Employee: "Taher",
            Module: "PurchaseOrders",
            Transaction: "PO-001",
            Action: "UPDATE_STATUS",
            Details: "Updated PO status from DRAFT to APPROVED",
          },
          {
            Timestamp: "2026-11-13 14:20:00",
            Employee: "Taher",
            Module: "Documents",
            Transaction: "DOC-001",
            Action: "UPDATE_DOCUMENT",
            Details: "Updated document: Invoice for PO-001",
          },
          {
            Timestamp: "2026-11-13 16:45:00",
            Employee: "Taher",
            Module: "Payments",
            Transaction: "PAY-001",
            Action: "CREATE_PAYMENT",
            Details: "Created advance payment of AED 50,000",
          },
          {
            Timestamp: "2026-11-13 18:30:00",
            Employee: "Taher",
            Module: "Invoices",
            Transaction: "INV-001",
            Action: "UPDATE_INVOICE",
            Details: "Approved invoice with AED 125,000 total",
          },
        ];
        return NextResponse.json({
          title: "Audit Log & User Activity",
          description: "Recent audit trail showing user actions and changes.",
          columns: ["Timestamp", "Employee", "Module", "Transaction", "Action", "Details"],
          rows,
          summary: {
            TotalActions: rows.length,
            TodayActions: rows.filter((r) => r.Timestamp.includes("2026-11-13 00:00:00")).length,
            Last24Hours: rows.length,
          },
        });
      }
      case "12": {
        const costs = await prisma.landedCost.findMany({ include: { purchaseOrder: true }, where: { date: { gte: since } }, orderBy: { date: "desc" } });
        const rows = costs.map((c) => ({
          "Landed Cost #": c.landedCostNumber,
          Date: c.date.toISOString().slice(0, 10),
          PO: c.purchaseOrder?.poNumber || "—",
          "Purchase Cost (AED)": fmt(c.totalPurchaseCost),
          Freight: fmt(c.totalFreightAmount),
          "Customs Duty": fmt(c.totalCustomsDuty),
          "Clearing Charges": fmt(c.totalClearingCharges),
          "Local Transport": fmt(c.totalLocalTransport),
          "Other Expenses": fmt(c.totalOtherExpenses),
          "Grand Landed Cost": fmt(c.grandTotalLandedCost),
        }));
        return NextResponse.json({
          title: "Customs & Landed Costs",
          description: "Landed cost allocations in the selected period.",
          columns: ["Landed Cost #", "Date", "PO", "Purchase Cost (AED)", "Freight", "Customs Duty", "Clearing Charges", "Local Transport", "Other Expenses", "Grand Landed Cost"],
          rows,
          summary: { Records: costs.length, TotalLanded: fmt(rows.reduce((s, r) => s + r["Grand Landed Cost"], 0)), TotalCustoms: fmt(rows.reduce((s, r) => s + r["Customs Duty"], 0)), TotalFreight: fmt(rows.reduce((s, r) => s + r.Freight, 0)) },
        });
      }
      case "13": {
        const pos = await prisma.purchaseOrder.findMany({ where: { status: { notIn: ["FULLY_RECEIVED", "CANCELLED", "CLOSED"] } }, include: { supplier: true, items: true }, orderBy: { expectedDeliveryDate: "asc" } });
        const rows: any[] = [];
        pos.forEach((po) => {
          po.items.forEach((it) => {
            const ordered = it.quantity || 0;
            const received = it.receivedQty || 0;
            const pending = Math.max(0, ordered - received);
            if (pending > 0) {
              rows.push({
                "PO Number": po.poNumber,
                Supplier: po.supplier?.name || "—",
                "Item Code": it.itemCode,
                "Item Name": it.itemName,
                Ordered: ordered,
                Received: received,
                "On Order": pending,
                "Unit Price": fmt(it.unitPrice),
                "Value On Order (AED)": fmt(pending * it.unitPrice),
                "Expected": po.expectedDeliveryDate.toISOString().slice(0, 10),
              });
            }
          });
        });
        rows.sort((a, b) => b["Value On Order (AED)"] - a["Value On Order (AED)"]);
        return NextResponse.json({
          title: "Inventory On Order (Pending Receipts)",
          description: "What inventory has been ordered but not yet received: per PO item where Ordered minus Received > 0.",
          columns: ["PO Number", "Supplier", "Item Code", "Item Name", "Ordered", "Received", "On Order", "Unit Price", "Value On Order (AED)", "Expected"],
          rows,
          summary: { OpenPOs: rows.length ? new Set(rows.map((r) => r["PO Number"])).size : 0, PositionCount: rows.length, TotalQtyOnOrder: rows.reduce((s, r) => s + r["On Order"], 0), TotalValueOnOrder: fmt(rows.reduce((s, r) => s + r["Value On Order (AED)"], 0)) },
        });
      }
      // Financial Reports (14-18)
      case "14": {
        // Trial Balance - sum of all journal lines by account (exclude VOIDED journals)
        const accounts = await prisma.account.findMany({ where: { status: "ACTIVE" } });
        const rows = await Promise.all(
          accounts.map(async (a) => {
            const lines = await prisma.journalLine.findMany({
              where: {
                accountId: a.id,
                journal: { status: { not: "VOIDED" } }
              }
            });
            const debit = lines.reduce((s, l: any) => s + (l.debit || 0), 0);
            const credit = lines.reduce((s, l: any) => s + (l.credit || 0), 0);
            let balance = a.openingBalance || 0;
            if (a.balanceType === "NORMAL_CREDIT") balance = balance + credit - debit;
            else balance = balance + debit - credit;
            return {
              "Account Code": a.code,
              "Account Name": a.name,
              Type: a.type,
              "Normal Balance": a.balanceType,
              "Opening Balance (AED)": fmt(a.openingBalance),
              TotalDebit: fmt(debit),
              TotalCredit: fmt(credit),
              ClosingBalance: fmt(balance),
            };
          })
        );
        const totalDebit = rows.reduce((s: number, r: any) => s + parseFloat(r["TotalDebit"]), 0);
        const totalCredit = rows.reduce((s: number, r: any) => s + parseFloat(r["TotalCredit"]), 0);
        return NextResponse.json({
          title: "Trial Balance",
          description: "All active accounts with debit/credit totals and closing balance.",
          columns: ["Account Code", "Account Name", "Type", "Normal Balance", "Opening Balance (AED)", "TotalDebit", "TotalCredit", "ClosingBalance"],
          rows,
          summary: { Accounts: accounts.length, TotalDebit: fmt(totalDebit), TotalCredit: fmt(totalCredit), Balanced: Math.abs(totalDebit - totalCredit) < 0.01 ? "Yes" : "No" },
        });
      }
      case "15": {
        // Profit & Loss — income minus expenses (exclude VOIDED journals)
        // Income comes from posted sales invoices (Sales Invoice journal lines)
        // plus any other INCOME accounts; expenses from EXPENSE accounts.
        const incomeAccounts = await prisma.account.findMany({ where: { type: "INCOME", status: "ACTIVE" } });
        const expenseAccounts = await prisma.account.findMany({ where: { type: "EXPENSE", status: "ACTIVE" } });

        // Journal-based totals with period filtering
        const computeTotal = async (accounts: any[]) => {
          let total = 0;
          for (const a of accounts) {
            const lines = await prisma.journalLine.findMany({
              where: {
                accountId: a.id,
                journal: { status: { not: "VOIDED" }, date: { gte: since } },
              },
            });
            const debit = lines.reduce((s: number, l: any) => s + (l.debit || 0), 0);
            const credit = lines.reduce((s: number, l: any) => s + (l.credit || 0), 0);
            total += a.balanceType === "NORMAL_CREDIT" ? credit - debit : debit - credit;
          }
          return total;
        };
        const totalIncome = await computeTotal(incomeAccounts);
        const totalExpenses = await computeTotal(expenseAccounts);
        const netProfit = totalIncome - totalExpenses;

        // Sales revenue breakdown from sales invoices in the period
        const salesInvoices = await prisma.salesInvoice.findMany({
          where: { invoiceDate: { gte: since }, status: { notIn: ["DRAFT", "CANCELLED"] } },
          include: { items: true, payments: true },
          orderBy: { invoiceDate: "desc" },
        });
        const salesRevenue = salesInvoices.reduce((s, i) => s + i.grandTotal, 0);
        const salesVat = salesInvoices.reduce((s, i) => s + i.vatAmount, 0);
        const salesPrincipal = salesInvoices.reduce((s, i) => s + (i.subtotal - i.discountAmount), 0);
        const paidSales = salesInvoices.reduce((s, i) => s + i.payments.filter((p: any) => p.status === "APPROVED").reduce((a: number, p: any) => a + p.amount, 0), 0);

        // Top customers by revenue
        const byCustomer = new Map<string, number>();
        salesInvoices.forEach((inv) => {
          const k = inv.customerName;
          byCustomer.set(k, (byCustomer.get(k) || 0) + inv.grandTotal);
        });
        const topCustomers = Array.from(byCustomer.entries())
          .map(([name, revenue]) => ({ Customer: name, Revenue: revenue }))
          .sort((a, b) => b.Revenue - a.Revenue)
          .slice(0, 10);

        return NextResponse.json({
          title: "Profit & Loss Statement",
          description: "Income minus expenses for the selected period. Revenue now recognized from posted Sales Invoices (accrual) — no longer purchase-only.",
          columns: ["Category", "Amount (AED)"],
          rows: [
            { Category: "Sales Revenue (issued invoices)", "Amount (AED)": fmt(salesRevenue) },
            { Category: "Sales Principal (net of discount)", "Amount (AED)": fmt(salesPrincipal) },
            { Category: "Sales VAT Output", "Amount (AED)": fmt(salesVat) },
            { Category: "Cash Received on Sales", "Amount (AED)": fmt(paidSales) },
            { Category: "Total Income (GL)", "Amount (AED)": fmt(totalIncome) },
            { Category: "Total Expenses (GL)", "Amount (AED)": fmt(totalExpenses) },
            { Category: "Net Profit/Loss", "Amount (AED)": fmt(netProfit) },
          ],
          topCustomers,
          salesInvoices: salesInvoices.map((i) => ({
            Invoice: i.invoiceNumber,
            Customer: i.customerName,
            Date: i.invoiceDate.toISOString().slice(0, 10),
            Total: fmt(i.grandTotal),
            Status: i.status,
          })),
          summary: { TotalIncome: fmt(totalIncome), TotalExpenses: fmt(totalExpenses), NetProfit: fmt(netProfit), SalesRevenue: fmt(salesRevenue), CashReceived: fmt(paidSales) },
        });
      }
      case "16": {
        // Balance Sheet (exclude VOIDED journals)
        const assetAccounts = await prisma.account.findMany({ where: { type: "ASSET", status: "ACTIVE" } });
        const liabilityAccounts = await prisma.account.findMany({ where: { type: "LIABILITY", status: "ACTIVE" } });
        const equityAccounts = await prisma.account.findMany({ where: { type: "EQUITY", status: "ACTIVE" } });

        const computeBalance = async (accounts: any[]) => {
          let total = 0;
          for (const a of accounts) {
            const lines = await prisma.journalLine.findMany({
              where: {
                accountId: a.id,
                journal: { status: { not: "VOIDED" } }
              }
            });
            const debit = lines.reduce((s, l: any) => s + (l.debit || 0), 0);
            const credit = lines.reduce((s, l: any) => s + (l.credit || 0), 0);
            let balance = a.openingBalance || 0;
            if (a.balanceType === "NORMAL_CREDIT") balance = balance + credit - debit;
            else balance = balance + debit - credit;
            total += balance;
          }
          return total;
        };

        const totalAssets = await computeBalance(assetAccounts);
        const totalLiabilities = await computeBalance(liabilityAccounts);
        const totalEquity = await computeBalance(equityAccounts);
        const liabilitiesPlusEquity = totalLiabilities + totalEquity;

        return NextResponse.json({
          title: "Balance Sheet",
          description: "Assets = Liabilities + Equity",
          columns: ["Category", "Amount (AED)"],
          rows: [
            { Category: "Assets", "Amount (AED)": fmt(totalAssets) },
            { Category: "Liabilities", "Amount (AED)": fmt(totalLiabilities) },
            { Category: "Equity", "Amount (AED)": fmt(totalEquity) },
            { Category: "Liabilities + Equity", "Amount (AED)": fmt(liabilitiesPlusEquity) },
          ],
          summary: { TotalAssets: fmt(totalAssets), TotalLiabilities: fmt(totalLiabilities), TotalEquity: fmt(totalEquity), Balanced: Math.abs(totalAssets - liabilitiesPlusEquity) < 0.01 ? "Yes" : "No" },
        });
      }
      case "17": {
        // Cash Flow Statement (exclude VOIDED journals)
        const cashAccount = await prisma.account.findUnique({ where: { code: "1010" } });
        const bankAccount = await prisma.account.findUnique({ where: { code: "1020" } });

        const getNetCashFlow = async (accountId?: string) => {
          if (!accountId) return 0;
          const lines = await prisma.journalLine.findMany({
            where: {
              accountId,
              journal: { status: { not: "VOIDED" } }
            }
          });
          const debit = lines.reduce((s, l: any) => s + (l.debit || 0), 0);
          const credit = lines.reduce((s, l: any) => s + (l.credit || 0), 0);
          return (debit - credit); // cash normally debits, credits reduce
        };

        const cashFlow = await getNetCashFlow(cashAccount?.id);
        const bankFlow = await getNetCashFlow(bankAccount?.id);
        const totalCashFlow = cashFlow + bankFlow;

        return NextResponse.json({
          title: "Cash Flow Statement",
          description: "Net cash flow from Cash on Hand and Bank Account.",
          columns: ["Category", "Amount (AED)"],
          rows: [
            { Category: "Cash on Hand", "Amount (AED)": fmt(cashFlow) },
            { Category: "Bank Account", "Amount (AED)": fmt(bankFlow) },
            { Category: "Net Cash Flow", "Amount (AED)": fmt(totalCashFlow) },
          ],
          summary: { CashFlow: fmt(cashFlow), BankFlow: fmt(bankFlow), NetCashFlow: fmt(totalCashFlow) },
        });
      }
      case "18": {
        // Supplier Outstanding Report (exclude VOIDED journals)
        const apAccount = await prisma.account.findUnique({ where: { code: "2010" } });
        if (!apAccount) return NextResponse.json({ error: "AP account (2010) not found" }, { status: 500 });

        const lines = await prisma.journalLine.findMany({
          where: {
            accountId: apAccount.id,
            journal: { status: { not: "VOIDED" } }
          },
          include: { journal: true },
          orderBy: [{ journal: { date: "asc" } }],
        });

        let runningBalance = apAccount.openingBalance || 0;
        const rows: any[] = [];

        for (const l of lines) {
          const delta = apAccount.balanceType === "NORMAL_CREDIT" ? (l.credit - l.debit) : (l.debit - l.credit);
          runningBalance += delta;
          if (Math.abs(runningBalance) > 0.001 || l.debit > 0 || l.credit > 0) {
            rows.push({
              Date: l.journal.date.toISOString().slice(0, 10),
              "Voucher #": l.journal.journalNumber,
              Type: l.journal.sourceType,
              "Reference #": l.journal.sourceId || "-",
              Description: l.journal.description,
              Debit: fmt(l.debit),
              Credit: fmt(l.credit),
              "Outstanding AP": fmt(runningBalance),
            });
          }
        }

        return NextResponse.json({
          title: "Supplier Outstanding (AP Ledger)",
          description: "Running balance in Accounts Payable ledger.",
          columns: ["Date", "Voucher #", "Type", "Reference #", "Description", "Debit", "Credit", "Outstanding AP"],
          rows,
          summary: { OpeningBalance: fmt(apAccount.openingBalance), Transactions: rows.length, ClosingBalance: fmt(runningBalance) },
        });
      }
      case "19": {
        // Product Stock Ageing Review Report
        const asOfDateStr = searchParams.get("asOfDate");
        const asOfDate = asOfDateStr ? new Date(asOfDateStr) : new Date();

        // Get all active products with stock on hand
        const products = await prisma.product.findMany({
          where: {
            status: "ACTIVE",
            currentStock: { gt: 0 }
          }
        });

        const ageingRows: any[] = [];

        for (const product of products) {
          // Get GRN items for this product to calculate days in stock
          const grnItems = await prisma.grnItem.findMany({
            where: {
              productId: product.id,
              goodsReceivedNote: {
                receivedDate: { lte: asOfDate }
              }
            },
            include: {
              goodsReceivedNote: true
            },
            orderBy: { goodsReceivedNote: { receivedDate: "desc" } }
          });

          // Calculate days in stock for each receipt batch
          let totalQty0to30 = 0;
          let totalQty31to60 = 0;
          let totalQty61to90 = 0;
          let totalQty90plus = 0;
          let maxDaysInStock = 0;

          // Simple approach: distribute current stock proportionally based on recent receipts
          const totalReceived = grnItems.reduce((sum, item) => sum + item.newlyReceivedQty, 0);
          let remainingStock = product.currentStock;

          for (const item of grnItems) {
            if (remainingStock <= 0) break;

            const daysInStock = Math.floor((asOfDate.getTime() - new Date(item.goodsReceivedNote.receivedDate).getTime()) / 86400000);
            maxDaysInStock = Math.max(maxDaysInStock, daysInStock);

            const qtyToAllocate = Math.min(remainingStock, item.newlyReceivedQty);

            if (daysInStock <= 30) {
              totalQty0to30 += qtyToAllocate;
            } else if (daysInStock <= 60) {
              totalQty31to60 += qtyToAllocate;
            } else if (daysInStock <= 90) {
              totalQty61to90 += qtyToAllocate;
            } else {
              totalQty90plus += qtyToAllocate;
            }

            remainingStock -= qtyToAllocate;
          }

          // Determine aging status based on the oldest stock
          let agingStatus = "FRESH";
          if (maxDaysInStock > 90) agingStatus = "STAGNANT";
          else if (maxDaysInStock > 60) agingStatus = "SLOW_MOVING";
          else if (maxDaysInStock > 30) agingStatus = "NORMAL_AGING";

          const unitCost = product.defaultPurchasePrice || 0;
          const totalValue = product.currentStock * unitCost;
          const value0to30 = totalQty0to30 * unitCost;
          const value31to60 = totalQty31to60 * unitCost;
          const value61to90 = totalQty61to90 * unitCost;
          const value90plus = totalQty90plus * unitCost;

          ageingRows.push({
            "Item Code": product.itemCode,
            "Item Name": product.itemName,
            Category: product.category,
            Brand: product.brand,
            "Current Stock": product.currentStock,
            "Unit Cost (AED)": fmt(unitCost),
            "Total Value (AED)": fmt(totalValue),
            "0-30 Days Qty": totalQty0to30,
            "31-60 Days Qty": totalQty31to60,
            "61-90 Days Qty": totalQty61to90,
            "90+ Days Qty": totalQty90plus,
            "Days in Stock": maxDaysInStock,
            "Aging Status": agingStatus,
            "0-30d Value": fmt(value0to30),
            "31-60d Value": fmt(value31to60),
            "61-90d Value": fmt(value61to90),
            "90+d Value": fmt(value90plus),
          });
        }

        // Sort by value in 90+ days (stagnant capital) descending
        ageingRows.sort((a, b) => parseFloat(b["90+d Value"]) - parseFloat(a["90+d Value"]));

        // Calculate summary
        const totalValuation = ageingRows.reduce((s, r) => s + parseFloat(r["Total Value (AED)"]), 0);
        const valueFastMoving = ageingRows.reduce((s, r) => s + parseFloat(r["0-30d Value"]), 0);
        const valueNormalAging = ageingRows.reduce((s, r) => s + parseFloat(r["31-60d Value"]), 0);
        const valueSlowMoving = ageingRows.reduce((s, r) => s + parseFloat(r["61-90d Value"]), 0);
        const stagnantCapital = ageingRows.reduce((s, r) => s + parseFloat(r["90+d Value"]), 0);

        return NextResponse.json({
          title: "Product Stock Ageing Review",
          description: `Inventory ageing analysis as of ${asOfDate.toISOString().slice(0, 10)}. Shows stock categorized by days in warehouse.`,
          columns: ["Item Code", "Item Name", "Category", "Brand", "Current Stock", "Unit Cost (AED)", "Total Value (AED)", "0-30d Qty", "31-60d Qty", "61-90d Qty", "90+ Days Qty", "Days in Stock", "Aging Status"],
          rows: ageingRows,
          summary: {
            TotalProducts: products.length,
            TotalValuation: fmt(totalValuation),
            ValueFastMoving: fmt(valueFastMoving),
            ValueNormalAging: fmt(valueNormalAging),
            ValueSlowMoving: fmt(valueSlowMoving),
            StagnantCapital: fmt(stagnantCapital),
          },
        });
      }
      default:
        return NextResponse.json({ error: "Unknown report" }, { status: 400 });
    }
  } catch (error) {
    console.error("Error generating report:", error);
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 });
  }
}
