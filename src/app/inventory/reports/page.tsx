"use client";

import React, { useEffect, useState } from "react";
import {
  Package,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Clock,
  BarChart3,
  Download,
  FileSpreadsheet,
  Filter,
  X,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ReportData {
  itemCode?: string;
  itemName?: string;
  brand?: string;
  category?: string;
  currentStock?: number;
  reorderLevel?: number;
  safetyStock?: number;
  unitCost?: number;
  totalValue?: number;
  deficit?: number;
  incomingQty?: number;
  projectedStock?: number;
  suggestedOrderQty?: number;
  leadTimeDays?: number;
  last30DaysReceived?: number;
  avgDailyUsage?: number;
  turnoverRate?: number;
  last90DaysReceived?: number;
  daysSinceLastReceipt?: number;
  monthsOld?: string;
  ageCategory?: string;
  avgAgeMonths?: number;
  percentage?: number;
  status?: string;
  location?: string;
}

export default function InventoryReportsPage() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [selectedReport, setSelectedReport] = useState("stock-on-hand");
  const [totalItems, setTotalItems] = useState(0);

  const reportTypes = [
    { id: "stock-on-hand", label: "Stock on Hand", icon: Package, desc: "Current inventory levels by product" },
    { id: "stock-ledger", label: "Stock Ledger", icon: BarChart3, desc: "Complete movement history" },
    { id: "reorder-stock", label: "Reorder Stock", icon: TrendingDown, desc: "Items needing reorder alerts" },
    { id: "low-stock", label: "Low Stock", icon: AlertTriangle, desc: "Below reorder threshold" },
    { id: "out-of-stock", label: "Out of Stock", icon: X, desc: "Zero quantity items" },
    { id: "fast-moving", label: "Fast Moving", icon: TrendingUp, desc: "High turnover items" },
    { id: "slow-moving", label: "Slow Moving", icon: Clock, desc: "Low activity in 90 days" },
    { id: "dead-stock", label: "Dead Stock", icon: AlertTriangle, desc: "No movement in 6+ months" },
    { id: "stock-ageing", label: "Stock Ageing", icon: Clock, desc: "Inventory age distribution" },
    { id: "stock-valuation", label: "Stock Valuation", icon: BarChart3, desc: "Total inventory value by category" },
  ];

  useEffect(() => {
    loadReport(selectedReport);
  }, [selectedReport]);

  const loadReport = async (reportType: string) => {
    if (reportType === "stock-ledger") {
      window.location.href = "/inventory/ledger";
      return;
    }
    if (reportType === "reorder-stock") {
      window.location.href = "/inventory/reorder";
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/inventory/reports?type=${reportType}`);
      const data = await res.json();
      setReportData(data.reportData || []);
      setTotalItems(data.totalItems || 0);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.length === 0) return;

    // Simple CSV export
    const headers = Object.keys(reportData[0]);
    const csvContent = [
      headers.join(","),
      ...reportData.map(row => headers.map(h => row[h as keyof ReportData] ?? "").join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedReport}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported to CSV");
  };

  const renderReportTable = () => {
    if (reportData.length === 0) {
      return (
        <div className="p-12 text-center text-slate-500">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-base font-bold text-slate-800 dark:text-slate-200">No data available</p>
          <p className="text-xs text-slate-400 mt-1">This report has no records to display</p>
        </div>
      );
    }

    const renderCell = (key: string, value: any, row: ReportData) => {
      if (typeof value === "number") {
        if (key.toLowerCase().includes("cost") || key.toLowerCase().includes("value") || key.toLowerCase().includes("price")) {
          return formatCurrency(value);
        }
        return value.toLocaleString();
      }
      return value ?? "-";
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
            <tr>
              {reportData[0] && Object.keys(reportData[0]).map((key) => (
                <th key={key} className="p-4 capitalize">
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {reportData.slice(0, 100).map((row, idx) => (
              <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                {Object.entries(row).map(([key, value]) => (
                  <td key={key} className="p-4 text-slate-700 dark:text-slate-300">
                    {renderCell(key, value, row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const calculateSummary = () => {
    if (selectedReport === "stock-on-hand" || selectedReport === "stock-valuation") {
      const totalValue = reportData.reduce((sum: number, r: any) => sum + (r.totalValue || 0), 0);
      return { totalValue, totalItems: reportData.length };
    }
    if (selectedReport === "low-stock" || selectedReport === "reorder-stock") {
      const totalDeficit = reportData.reduce((sum: number, r: any) => sum + (r.deficit || r.suggestedOrderQty || 0) * (r.unitCost || r.defaultPurchasePrice || 0), 0);
      return { totalDeficit, totalItems: reportData.length };
    }
    return { totalItems: reportData.length };
  };

  const summary = calculateSummary();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Inventory Reports
          </h1>
          <p className="text-sm text-slate-500">10 comprehensive inventory reports with Excel export</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            disabled={reportData.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-lg transition-all disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (CSV)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Type Selection */}
        <div className="lg:col-span-1 space-y-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Select Report</h3>
          {reportTypes.map((report) => {
            const Icon = report.icon;
            return (
              <button
                key={report.id}
                onClick={() => setSelectedReport(report.id)}
                className={`w-full text-left p-3 rounded-lg transition-all ${
                  selectedReport === report.id
                    ? "bg-blue-600 text-white shadow-lg"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${selectedReport === report.id ? "text-white" : "text-blue-600"}`} />
                  <span className="font-semibold text-sm">{report.label}</span>
                </div>
                <p className={`text-[10px] mt-1 ${selectedReport === report.id ? "text-blue-100" : "text-slate-400"}`}>
                  {report.desc}
                </p>
              </button>
            );
          })}
        </div>

        {/* Report Content */}
        <div className="lg:col-span-3 space-y-4">
          {/* Summary Cards */}
          {(selectedReport === "stock-on-hand" || selectedReport === "stock-valuation") && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-xl shadow-lg text-white">
                <div className="text-xs font-semibold opacity-80 uppercase">Total Products</div>
                <div className="text-3xl font-extrabold mt-1">{totalItems}</div>
                <div className="text-xs opacity-80 mt-1">Active inventory items</div>
              </div>
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 rounded-xl shadow-lg text-white">
                <div className="text-xs font-semibold opacity-80 uppercase">Total Inventory Value</div>
                <div className="text-3xl font-extrabold mt-1">{formatCurrency(summary.totalValue as number)}</div>
                <div className="text-xs opacity-80 mt-1">At default purchase prices</div>
              </div>
            </div>
          )}

          {selectedReport === "low-stock" && (
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 p-4 rounded-xl">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <AlertTriangle className="w-5 h-5" />
                <span className="font-bold">{totalItems} items</span>
                <span className="text-sm">require immediate reordering</span>
              </div>
            </div>
          )}

          {/* Report Table */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {reportTypes.find((r) => r.id === selectedReport)?.label}
              </h2>
              <span className="text-xs font-semibold text-slate-500">{totalItems} records</span>
            </div>

            {loading ? (
              <div className="p-12 text-center text-slate-500">Generating report...</div>
            ) : (
              renderReportTable()
            )}
          </div>
        </div>
      </div>
    </div>
  );
}