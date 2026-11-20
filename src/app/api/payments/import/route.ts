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

    // Skip header row
    const dataRows = lines.slice(1);
    const results = {
      total: dataRows.length,
      success: 0,
      errors: [] as string[],
      payments: [] as any[],
    };

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      // Handle both comma and semicolon separators
      const values = row.includes(";") ? row.split(";") : row.split(",");

      if (values.length < 8) {
        results.errors.push(`Row ${i + 2}: Insufficient columns`);
        continue;
      }

      try {
        const [paymentNumber, paymentDate, supplierId, targetType, targetId, amount, currency, paymentMethod, bankReference, recordedBy, notes] = values.map((v: string) => v.trim());

        // Validate required fields
        if (!paymentNumber || !paymentDate || !supplierId || !amount || !paymentMethod) {
          results.errors.push(`Row ${i + 2}: Missing required fields`);
          continue;
        }

        // Parse amount
        const amountParsed = parseFloat(amount);
        if (isNaN(amountParsed) || amountParsed <= 0) {
          results.errors.push(`Row ${i + 2}: Invalid amount`);
          continue;
        }

        // Find supplier
        const supplier = await prisma.supplier.findFirst({
          where: {
            OR: [{ id: supplierId }, { supplierId: supplierId }],
          },
        });

        if (!supplier) {
          results.errors.push(`Row ${i + 2}: Supplier not found - ${supplierId}`);
          continue;
        }

        // Build payment data
        const paymentData: any = {
          paymentNumber,
          paymentDate: new Date(paymentDate),
          supplierId: supplier.id,
          amount: amountParsed,
          currency: currency || "AED",
          paymentMethod: paymentMethod.replace(" ", "_").toUpperCase() as any,
          recordedBy: recordedBy || "Imported",
          notes: notes || undefined,
        };

        // Handle target reference
        if (targetType && targetId) {
          if (targetType.toUpperCase() === "PO") {
            const po = await prisma.purchaseOrder.findFirst({
              where: {
                OR: [{ id: targetId }, { poNumber: targetId }],
              },
            });
            if (po) {
              paymentData.poId = po.id;
              paymentData.status = "APPROVED"; // PO payments are auto-approved
            } else {
              results.errors.push(`Row ${i + 2}: PO not found - ${targetId}`);
              continue;
            }
          } else if (targetType.toUpperCase() === "INVOICE") {
            const invoice = await prisma.purchaseInvoice.findFirst({
              where: {
                OR: [{ id: targetId }, { invoiceNumber: targetId }],
              },
            });
            if (invoice) {
              paymentData.invoiceId = invoice.id;
              paymentData.status = invoice.status;
            } else {
              results.errors.push(`Row ${i + 2}: Invoice not found - ${targetId}`);
              continue;
            }
          }
        }

        // Create payment
        const payment = await prisma.payment.create({
          data: paymentData,
          include: { supplier: true },
        });

        results.success++;
        results.payments.push({
          paymentNumber: payment.paymentNumber,
          amount: payment.amount,
          status: payment.status,
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
