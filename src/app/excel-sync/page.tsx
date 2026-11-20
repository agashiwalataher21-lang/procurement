"use client";

import { useEffect, useState, useRef } from "react";
import {
  FileSpreadsheet,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  ArrowRightLeft,
  Database,
  Cloud,
} from "lucide-react";

interface SyncStats {
  totalSalesInvoices: number;
  totalSalesReceipts: number;
  totalPurchaseOrders: number;
  totalProducts: number;
  zohoImportedInvoices: number;
  lastSyncAt: string | null;
  lastSyncAction: string | null;
}

export default function ExcelSyncPage() {
  const [stats, setStats] = useState<SyncStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [syncType, setSyncType] = useState<"sales" | "products">("sales");
  const [overwrite, setOverwrite] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/excel-sync?format=status");
      if (!res.ok) throw new Error("Failed to load sync status");
      const data = await res.json();
      setStats(data.stats);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch("/api/excel-sync");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bait-al-hadaf-erp-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      setMessage({ type: "success", text: "Excel workbook exported successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setExporting(false);
    }
  };

  const handleFile = async (file: File) => {
    try {
      setUploading(true);
      setMessage(null);
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", syncType);
      fd.append("overwrite", overwrite ? "true" : "false");
      fd.append("createdBy", "Taher");

      const res = await fetch("/api/excel-sync", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Import failed" });
        return;
      }
      setMessage({
        type: "success",
        text: `${data.message} (${data.imported} imported, ${data.skipped} skipped, ${data.errors.length} errors)`,
      });
      fetchStats();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Excel Sync — Zoho Bridge</h1>
          <p className="text-sm text-slate-500 mt-1">
            Import sales & inventory from Zoho · Export full ERP workbook for management
          </p>
        </div>
        <button
          onClick={fetchStats}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {message && (
        <div
          className={`mb-4 p-3 rounded-lg flex items-center gap-2 text-sm ${
            message.type === "success"
              ? "bg-emerald-50 border border-emerald-200 text-emerald-700"
              : "bg-red-50 border border-red-200 text-red-700"
          }`}
        >
          {message.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message.text}
          <button
            onClick={() => setMessage(null)}
            className="ml-auto opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      )}

      {/* Stats strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <Database className="w-4 h-4 text-blue-400" /> Sales Invoices
          </div>
          <div className="mt-1 text-xl font-bold text-slate-800">
            {stats?.totalSalesInvoices ?? "—"}
          </div>
          <div className="text-xs text-purple-500 font-medium mt-0.5">
            {stats?.zohoImportedInvoices ?? 0} from Zoho
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <Database className="w-4 h-4 text-emerald-400" /> Receipts
          </div>
          <div className="mt-1 text-xl font-bold text-slate-800">
            {stats?.totalSalesReceipts ?? "—"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <Database className="w-4 h-4 text-amber-400" /> Purchase Orders
          </div>
          <div className="mt-1 text-xl font-bold text-slate-800">
            {stats?.totalPurchaseOrders ?? "—"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <Database className="w-4 h-4 text-sky-400" /> Products
          </div>
          <div className="mt-1 text-xl font-bold text-slate-800">
            {stats?.totalProducts ?? "—"}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
            <Cloud className="w-4 h-4 text-violet-400" /> Last Sync
          </div>
          <div className="mt-1 text-sm font-bold text-slate-800 truncate">
            {stats?.lastSyncAt
              ? new Date(stats.lastSyncAt).toLocaleString("en-AE")
              : "Never"}
          </div>
          <div className="text-xs text-slate-400 truncate mt-0.5">
            {stats?.lastSyncAction?.replace(/_/g, " ") || "—"}
          </div>
        </div>
      </div>

      {/* Import card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <ArrowRightLeft className="w-5 h-5 text-blue-600" />
          <h2 className="text-lg font-bold text-slate-800">Import from Zoho (Excel)</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data Type</label>
            <div className="flex rounded-lg border border-slate-200 overflow-hidden">
              <button
                type="button"
                onClick={() => setSyncType("sales")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  syncType === "sales"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Sales Invoices
              </button>
              <button
                type="button"
                onClick={() => setSyncType("products")}
                className={`flex-1 px-3 py-2 text-sm font-medium transition-colors ${
                  syncType === "products"
                    ? "bg-blue-600 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                Products / Inventory
              </button>
            </div>
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={overwrite}
                onChange={(e) => setOverwrite(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300"
              />
              Overwrite existing local records
            </label>
          </div>
        </div>

        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const f = e.dataTransfer.files?.[0];
            if (f) handleFile(f);
          }}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            uploading
              ? "border-blue-400 bg-blue-50"
              : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
          }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {uploading ? (
            <div className="flex items-center justify-center gap-2 text-blue-600">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span className="text-sm font-medium">Importing…</span>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-600">
                Drag & drop a Zoho-exported{" "}
                <span className="font-medium text-slate-800">.xlsx</span> file here, or{" "}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium underline"
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {syncType === "sales"
                  ? "Required columns: Invoice Number, Customer Name, Invoice Date, Item Name, Quantity, Unit Price"
                  : "Required columns: Item Code, Item Name, Quantity on Hand, Purchase Rate"}
              </p>
            </>
          )}
        </div>
      </div>

      {/* Export card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-3">
          <Download className="w-5 h-5 text-emerald-600" />
          <h2 className="text-lg font-bold text-slate-800">Export ERP Workbook</h2>
        </div>
        <p className="text-sm text-slate-500 mb-4">
          Generates a multi-sheet Excel workbook with Sales Invoices, Sales Receipts, Purchase
          Orders, Purchase Invoices, Inventory, Chart of Accounts and P&L Summary — ready to
          share with Zoho or management.
        </p>
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 disabled:opacity-50 shadow-sm"
        >
          {exporting ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" /> Generating…
            </>
          ) : (
            <>
              <Download className="w-4 h-4" /> Download Excel Workbook
            </>
          )}
        </button>
      </div>
    </div>
  );
}
