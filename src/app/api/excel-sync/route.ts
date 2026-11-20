import { NextResponse } from "next/server";
import { exportToExcel, importSalesFromExcel, importProductsFromExcel } from "@/lib/excelSync";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/excel-sync
 * Download full multi-sheet ERP workbook (Sales, POs, Invoices, Inventory, GL, P&L)
 * Query params:
 *   ?since=YYYY-MM-DD
 *   ?format=status -> returns JSON stats instead of binary download
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get("since") || undefined;
    const format = searchParams.get("format");

    if (format === "status") {
      // Diagnostic/stats endpoint for UI
      const [siCount, srCount, poCount, prodCount, lastSyncLog] = await Promise.all([
        prisma.salesInvoice.count(),
        prisma.salesReceipt.count(),
        prisma.purchaseOrder.count(),
        prisma.product.count(),
        prisma.auditLog.findFirst({
          where: { module: "Excel Sync" },
          orderBy: { timestamp: "desc" },
        }),
      ]);

      const zohoImported = await prisma.salesInvoice.count({
        where: { source: "ZOHO" },
      });

      return NextResponse.json({
        stats: {
          totalSalesInvoices: siCount,
          totalSalesReceipts: srCount,
          totalPurchaseOrders: poCount,
          totalProducts: prodCount,
          zohoImportedInvoices: zohoImported,
          lastSyncAt: lastSyncLog?.timestamp || null,
          lastSyncAction: lastSyncLog?.action || null,
        },
      });
    }

    // Binary download
    const buffer = await exportToExcel({ since });
    const filename = `bait-al-hadaf-erp-export-${new Date().toISOString().split("T")[0]}.xlsx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Error generating Excel export:", error);
    return NextResponse.json(
      { error: error.message || "Failed to generate Excel export" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/excel-sync
 * Upload Zoho-exported Excel file (.xlsx)
 * FormData:
 *   file: File (binary)
 *   type: "sales" | "products" (default "sales")
 *   overwrite: "true" | "false"
 *   since: "YYYY-MM-DD"
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string) || "sales";
    const overwrite = formData.get("overwrite") === "true";
    const since = (formData.get("since") as string) || undefined;
    const createdBy = (formData.get("createdBy") as string) || "Taher";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    let result;
    if (type === "products") {
      result = await importProductsFromExcel(buffer, { overwrite, since, createdBy });
    } else {
      result = await importSalesFromExcel(buffer, { overwrite, since, createdBy });
    }

    return NextResponse.json({
      success: result.success,
      type,
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors,
      message: `Sync complete: ${result.imported} imported, ${result.skipped} skipped, ${result.errors.length} errors.`,
    });
  } catch (error: any) {
    console.error("Error processing Excel sync upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process Excel upload" },
      { status: 500 }
    );
  }
}
