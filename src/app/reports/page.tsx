"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart3,
  FileText,
  Calendar,
  Truck,
  Building,
  DollarSign,
  Package,
  Clock,
  ShieldCheck,
  Users,
  Database,
  Download,
  Printer,
  ChevronRight,
  Loader2,
  RefreshCw,
  TrendingUp,
  CalendarDays,
  Landmark,
  Scale,
  Receipt,
} from "lucide-react";
import { formatCurrency, formatDate, safeJson, ensureOk } from "@/lib/utils";
import { toast } from "sonner";

const REPORT_TABS = [
  { id: "1", title: "PO Summary & Status", icon: FileText },
  { id: "2", title: "PO Ageing & Delays", icon: Clock },
  { id: "3", title: "GRN & Shortage/Damage", icon: Truck },
  { id: "4", title: "Accounts Payable Ageing", icon: DollarSign },
  { id: "5", title: "Supplier Performance & OTIF", icon: Building },
  { id: "6", title: "Product Price Variance", icon: TrendingUp },
  { id: "7", title: "Advance vs Invoice Balances", icon: ShieldCheck },
  { id: "8", title: "UAE FTA Form 201 VAT", icon: BarChart3 },
  { id: "9", title: "Inventory Stock Valuation", icon: Package },
  { id: "10", title: "Monthly Spend Analysis", icon: Calendar },
  { id: "11", title: "Audit Log & User Activity", icon: Users },
  { id: "12", title: "Customs Clearance Costs", icon: Database },
  { id: "13", title: "Inventory On Order", icon: Package },
  { id: "14", title: "Trial Balance", icon: Scale },
  { id: "15", title: "Profit & Loss Statement", icon: TrendingUp },
  { id: "16", title: "Balance Sheet", icon: Landmark },
  { id: "17", title: "Cash Flow Statement", icon: DollarSign },
  { id: "18", title: "General Ledger Details", icon: Receipt },
  { id: "19", title: "Product Stock Ageing", icon: Clock },
];

interface ReportData {
  title: string;
  description: string;
  columns: string[];
  rows: Record<string, any>[];
  summary: Record<string, any>;
}

interface ReportData {
  title: string;
  description: string;
  columns: string[];
  rows: Record<string, any>[];
  summary: Record<string, any>;
}

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState("1");
  const [dateRange, setDateRange] = useState<"30" | "quarter" | "year" | "custom">("30");
  const [customStartDate, setCustomStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString().split("T")[0]);
  const [customEndDate, setCustomEndDate] = useState(new Date().toISOString().split("T")[0]);
  const [asOfDate, setAsOfDate] = useState(new Date().toISOString().split("T")[0]);
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      let url = `/api/reports?report=${activeReport}`;
      if (dateRange === "custom") {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      } else {
        url += `&range=${dateRange}`;
      }
      url += `&asOfDate=${asOfDate}`;

      const res = await fetch(url);
      const data = await safeJson<any>(res);
      ensureOk(res, data, "Failed to load report");
      setReport(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to load report");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeReport, dateRange]);

  const handleExport = (format: "csv" | "xlsx" | "pdf") => {
    if (!report) return;
    setExporting(true);
    const name = report.title.replace(/[^a-z0-9]+/gi, "_");
    if (format === "csv") {
      const escape = (v: any) => `"\"${String(v ?? "").replace(/"/g, '""')}\""`;
      const header = report.columns.join(",");
      const lines = report.rows.map((r) => report.columns.map((c) => escape(r[c])).join(","));
      const csv = [header, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${name}_${dateRange}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else if (format === "xlsx") {
      import("xlsx").then((XLSX) => {
        const ws = XLSX.utils.json_to_sheet(report.rows.map((r) => Object.fromEntries(report.columns.map((c) => [c, cellValue(r, c)]))));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, (report.title || "Report").slice(0, 31));
        XLSX.writeFile(wb, `${name}_${dateRange}.xlsx`);
      });
    } else if (format === "pdf") {
      const escape = (v: any) => String(v ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const th = report.columns.map((c) => `<th>${escape(c)}</th>`).join("");
      const trs = report.rows.map((r) => `<tr>${report.columns.map((c) => `<td>${escape(cellValue(r, c))}</td>`).join("")}</tr>`).join("\n");
      const html = `<!doctype html><html><head><title>${escape(report.title)}</title><style>body{font-family:Arial,sans-serif;padding:24px;color:#0f172a}h1{font-size:18px;margin:0 0 4px}p{font-size:12px;color:#475569;margin:0 0 16px}table{width:100%;border-collapse:collapse;font-size:11px}th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}th{background:#eff6ff;text-transform:uppercase;letter-spacing:.05em}</style></head><body><h1>${escape(report.title)}</h1><p>${escape(report.description)} Generated: ${new Date().toLocaleString()} Range: ${dateRange}</p><table><thead><tr>${th}</tr></thead><tbody>\n${trs}\n</tbody></table></body></html>`;
      const win = window.open("", "_blank");
      if (!win) { toast.error("Popup blocked; allow popups to generate PDF"); setExporting(false); return; }
      win.document.write(html); win.document.close();
      win.onload = () => { win.print(); };
    }
    toast.success(`Exported ${report.rows.length} rows to ${format.toUpperCase()}`);
    setTimeout(() => setExporting(false), 600);
  };

  const cellValue = (row: Record<string, any>, col: string) => {
    if (col in row) return row[col];
    // Breakdown-style keys used by report #1
    if (col.toLowerCase().startsWith("status") && row.Breakdown) return row.Breakdown;
    const key = Object.keys(row).find((k) => k.toLowerCase() === col.toLowerCase());
    return key ? row[key] : "";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Procurement Analytics & Reports
          </h1>
          <p className="text-sm text-slate-500">
            Live database reports — every number below is computed from real records, no sample data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as "30" | "quarter" | "year" | "custom")}
              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none"
            >
              <option value="30">Last 30 Days</option>
              <option value="quarter">This Quarter</option>
              <option value="year">Year to Date</option>
              <option value="custom">Custom Range</option>
            </select>
            {dateRange === "custom" && (
              <>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400">Start:</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-slate-600 dark:text-slate-400">End:</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </>
            )}
            {activeReport === "19" && (
              <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-700 pl-2">
                <label className="text-xs text-slate-600 dark:text-slate-400">As of:</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
          <button
            onClick={fetchReport}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
          <div className="relative">
            <button
              onClick={() => {
                const m = document.getElementById("export-menu");
                if (m) m.classList.toggle("hidden");
              }}
              disabled={exporting || !report}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              {exporting ? "Exporting..." : "Export"}
            </button>
            <div id="export-menu" className="hidden absolute right-0 mt-2 w-40 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
              <button onClick={() => { handleExport("xlsx"); document.getElementById("export-menu")?.classList.add("hidden"); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700">Excel (.xlsx)</button>
              <button onClick={() => { handleExport("pdf"); document.getElementById("export-menu")?.classList.add("hidden"); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700">PDF (Print)</button>
              <button onClick={() => { handleExport("csv"); document.getElementById("export-menu")?.classList.add("hidden"); }} className="w-full text-left px-4 py-2.5 text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-700">CSV</button>
            </div>
          </div>
        </div>
      </div>

      {/* Report Selection Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4 overflow-x-auto">
        <div className="flex flex-wrap gap-2">
          {REPORT_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveReport(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  activeReport === tab.id
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-xs font-bold whitespace-nowrap">{tab.title}</span>
                {activeReport === tab.id && <ChevronRight className="w-3.5 h-3.5 ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Report Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-500">Querying database...</p>
          </div>
        ) : !report ? (
          <div className="p-20 text-center text-slate-500">No report data available.</div>
        ) : (
          <>
            {/* Report Header */}
            <div className="border-b border-slate-100 dark:border-slate-800 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">{report.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">{report.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Generated: {formatDate(new Date().toISOString())}
                  </span>
                  <button
                    onClick={() => handleExport("pdf")}
                    title="Print professional PDF"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                  >
                    <Printer className="w-4 h-4" />
                    Print PDF
                  </button>
                </div>
              </div>
            </div>

            {/* Summary Stats */}
            {report.summary && Object.keys(report.summary).length > 0 && (
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {Object.entries(report.summary).map(([key, value]) => (
                    <div key={key} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                        {typeof value === "number" && (key.toLowerCase().includes("total") || key.toLowerCase().includes("value") || key.toLowerCase().includes("capital") || key.toLowerCase().includes("spend") || key.toLowerCase().includes("vat") || key.toLowerCase().includes("paid") || key.toLowerCase().includes("invoiced") || key.toLowerCase().includes("balance") || key.toLowerCase().includes("advances") || key.toLowerCase().includes("landed") || key.toLowerCase().includes("customs") || key.toLowerCase().includes("freight") || key.toLowerCase().includes("current") || key.toLowerCase().includes("variance"))
                          ? formatCurrency(value)
                          : value}
                      </h3>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Data Table */}
            <div className="p-6">
              {report.rows.length === 0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  No records found for this period. Try a wider date range.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                      <tr>
                        {report.columns.map((col) => (
                          <th key={col} className="px-4 py-3">{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {report.rows.map((row, rowIdx) => (
                        <tr key={rowIdx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                          {report.columns.map((col) => {
                            const val = cellValue(row, col);
                            const isMoney = typeof val === "number" && /(AED|Value|Capital|Due|Rate|Variance|Spend|Principal|VAT|Paid|Invoiced|Balance|Advances|Freight|Customs|Clearing|Transport|Expenses|Landed|Cost|Total|Current)-?\(?AED\)?/i.test(col) || /(Value|Capital|Due|Freight|Customs|Clearing|Transport|Expenses|Landed|Spend|Principal|VAT|Paid|Invoiced|Balance|Advances|Cost|Current) \(AED\)/i.test(col);
                            return (
                              <td key={col} className="px-4 py-3">
                                {isMoney && typeof val === "number" ? (
                                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(val)}</span>
                                ) : (
                                  <span className="text-slate-700 dark:text-slate-300">{String(val ?? "")}</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
