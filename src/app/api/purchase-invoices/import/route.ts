import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const contentType = file.type;
    if (contentType !== "text/csv" && !contentType.startsWith("application/vnd.openxmlformats-officedocument.spreadsheetml.")) {
      return NextResponse.json({ error: "Invalid file format. Please upload CSV or Excel file" }, { status: 400 });
    }

    const text = await file.text();
    const lines = text.split("\n").filter(line => line.trim() !== "");

    if (lines.length < 2) {
      return NextResponse.json({ error: "File is empty or has no data rows" }, { status: 400 });
    }

    const dataRows = lines.slice(1);
    const results = {
      total: dataRows.length,
      success: 0,
      errors: [] as string[],
      invoices: [] as any[],
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const values = row.includes(";") ? row.split(";") : row.split(",");

      if (values.length < 9) {
        results.errors.push(`Row ${i + 2}: Insufficient columns`);
        continue;
      }

      try {
        const [invoiceNumber, invoiceDate, dueDate, supplierId, poNumber, description, subtotal, vatRate, grandTotal, status, paidAmount, notes] = values.map((v: string) => v.trim());

        if (!invoiceNumber || !invoiceDate || !supplierId || !subtotal || !grandTotal) {
          results.errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        const subtotalParsed = parseFloat(subtotal);
        const grandTotalParsed = parseFloat(grandTotal);
        const vatRateParsed = parseFloat(vatRate || "5");

        if (isNaN(subtotalParsed) || subtotalParsed <= 0) {
          results.errors.push(`Row ${i + 2}: Invalid subtotal`);
          continue;
        }

        if (isNaN(grandTotalParsed) || grandTotalParsed <= 0) {
          results.errors.push(`Row ${i + 2}: Invalid grand total`);
          continue;
        }

        const supplier = await prisma.supplier.findFirst({
          where: {
            OR: [{ id: supplierId }, { supplierId: supplierId }],
          },
        });

        if (!supplier) {
          results.errors.push(`Row ${i + 2}: Supplier not found - ${supplierId}`);
          continue;
        }

        const po = await prisma.purchaseOrder.findFirst({
          where: {
            OR: [{ id: poNumber }, { poNumber: poNumber }],
          },
        });

        if (!po) {
          results.errors.push(`Row ${i + 2}: Purchase Order not found - ${poNumber}`);
          continue;
        }

        const invoiceData: any = {
          invoiceNumber,
          invoiceDate: new Date(invoiceDate),
          dueDate: dueDate ? new Date(dueDate) : new Date(invoiceDate),
          supplierId: supplier.id,
          poId: po.id,
          description: description || null,
          subtotal: subtotalParsed,
          vatAmount: grandTotalParsed - subtotalParsed,
          vatRate: vatRateParsed,
          grandTotal: grandTotalParsed,
          status: status || "CONFIRMED",
          paidAmount: parseFloat(paidAmount) || 0,
          notes: notes || null,
          items: [], // Will be populated if detailed import is needed
        };

        const invoice = await prisma.purchaseInvoice.create({
          data: invoiceData,
          include: { supplier: true, purchaseOrder: true },
        });

        results.success++;
        results.invoices.push({
          invoiceNumber: invoice.invoiceNumber,
          grandTotal: invoice.grandTotal,
          status: invoice.status,
        });

      } catch (err: any) {
        results.errors.push(`Row ${i + 2}: ${err.message || "Import failed"}`);
      }
    }

    return NextResponse.json({
      message: `Import completed: ${results.success}/${results.total} successful`,
      results,
    });

  } catch (err: any) {
    console.error("Import error:", err);
    return NextResponse.json({ error: err.message || "Import failed" }, { status: 500 });
  }
}
