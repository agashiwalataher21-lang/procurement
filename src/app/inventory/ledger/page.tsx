"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Package,
  ArrowRightLeft,
  ArrowDownUp,
  Filter,
  Download,
  FileText,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface StockMovement {
  id: string;
  productId: string;
  product: {
    itemCode: string;
    itemName: string;
    brand?: string;
    unitOfMeasurement: string;
  };
  itemCode: string;
  date: string;
  movementType: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  referenceNumber: string;
  location: string;
  responsibleEmployee: string;
  notes: string;
  runningBalance?: number;
}

interface Product {
  id: string;
  itemCode: string;
  itemName: string;
  brand?: string;
  currentStock: number;
}

export default function StockLedgerPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterProduct, setFilterProduct] = useState<string>("");
  const [filterType, setFilterType] = useState<string>("");
  const [filterDateStart, setFilterDateStart] = useState<string>("");
  const [filterDateEnd, setFilterDateEnd] = useState<string>("");
  const [summary, setSummary] = useState<any>(null);

  const types = [
    { value: "", label: "All Types" },
    { value: "OPENING_STOCK", label: "Opening Stock" },
    { value: "GOODS_RECEIVED", label: "Goods Received" },
    { value: "SUPPLIER_RETURN", label: "Supplier Return" },
    { value: "STOCK_ISSUE", label: "Stock Issue" },
    { value: "STOCK_ADJUSTMENT", label: "Adjustment" },
    { value: "LOCATION_TRANSFER", label: "Location Transfer" },
  ];

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [prodRes, movRes] = await Promise.all([
        fetch("/api/products?limit=100"),
        fetch("/api/inventory/movements"),
      ]);
      const prodData = await prodRes.json();
      const movData = await movRes.json();

      setProducts(prodData.products || []);
      setMovements(movData.movements || []);
      setSummary(movData.summary);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load stock ledger");
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async () => {
    setLoading(true);
    try {
      let url = "/api/inventory/movements?";
      if (filterProduct) url += `&productId=${filterProduct}`;
      if (filterType) url += `&type=${filterType}`;
      if (filterDateStart) url += `&startDate=${filterDateStart}`;
      if (filterDateEnd) url += `&endDate=${filterDateEnd}`;

      const res = await fetch(url);
      const data = await res.json();
      setMovements(data.movements || []);
      setSummary(data.summary);
      toast.success(`Loaded ${data.movements.length} movement records`);
    } catch (e) {
      console.error(e);
      toast.error("Failed to apply filters");
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (movements.length === 0) {
      toast.error("No data to export");
      return;
    }

    const exportData = movements.map((m) => ({
      Date: new Date(m.date).toLocaleDateString(),
      Type: m.movementType,
      Reference: m.referenceNumber,
      Product: m.product.itemName,
      "Item Code": m.itemCode,
      Quantity: m.quantity,
      "Unit Cost": m.unitCost,
      Total: m.totalCost,
      Balance: m.runningBalance?.toFixed(2) || 0,
      Location: m.location,
      Employee: m.responsibleEmployee,
      Notes: m.notes,
    }));

    const worksheet = (window as any).XLSX?.utils.json_to_sheet(exportData);
    const workbook = (window as any).XLSX?.book_new();
    (window as any).XLSX?.book_append_sheet(workbook, worksheet, "Stock Ledger");
    (window as any).XLSX?.writeFile(workbook, `Bait_Al_Hadaf_Stock_Ledger_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Stock ledger exported successfully to Excel");
  };

  const getMovementTypeClass = (type: string) => {
    switch (type) {
      case "GOODS_RECEIVED":
      case "SUPPLIER_RETURN":
      case "OPENING_STOCK":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30";
      case "STOCK_ISSUE":
      case "STOCK_ADJUSTMENT":
        return "text-rose-600 bg-rose-50 dark:bg-rose-950/30";
      case "LOCATION_TRANSFER":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/30";
      default:
        return "text-slate-600 bg-slate-50 dark:bg-slate-800";
    }
  };

  const formatTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      OPENING_STOCK: "Opening Stock",
      GOODS_RECEIVED: "Goods Received",
      SUPPLIER_RETURN: "Supplier Return",
      STOCK_ISSUE: "Stock Issue",
      STOCK_ADJUSTMENT: "Adjustment",
      LOCATION_TRANSFER: "Location Transfer",
    };
    return labels[type] || type;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-600" />
            Stock Movement Ledger
          </h1>
          <p className="text-sm text-slate-500">
            Complete audit trail of all inventory movements with running balance
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-xl shadow-lg text-white">
            <div className="text-xs font-semibold opacity-80 uppercase">Product</div>
            <div className="text-xl font-bold mt-1">{summary.itemName}</div>
            <div className="text-xs opacity-80 mt-1">{summary.itemCode}</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
            <div className="text-xs font-semibold text-slate-400 uppercase">Current Stock Level</div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              {summary.currentStock} {summary.unitOfMeasurement || "PCS"}
            </div>
            <div className="text-xs text-emerald-600 font-semibold mt-1">Available for Sales</div>
          </div>
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
            <div className="text-xs font-semibold text-slate-400 uppercase">Ledger Period</div>
            <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
              {movements.length} Transactions
            </div>
            <div className="text-xs text-slate-500 font-medium mt-1">
              Last updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Filter Ledger
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Product</label>
            <select
              value={filterProduct}
              onChange={(e) => setFilterProduct(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">All Products</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.itemCode} - {p.itemName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Movement Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {types.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Start Date</label>
            <input
              type="date"
              value={filterDateStart}
              onChange={(e) => setFilterDateStart(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">End Date</label>
            <input
              type="date"
              value={filterDateEnd}
              onChange={(e) => setFilterDateEnd(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleFilter}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors"
            >
              Filter
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Complete Stock Movement Ledger
          </h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading stock movements...</div>
        ) : movements.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">No movements found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Reference</th>
                  <th className="p-4">Product</th>
                  <th className="p-4 text-right">Qty</th>
                  <th className="p-4 text-right">Unit Cost</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4 text-right">Balance</th>
                  <th className="p-4">Location</th>
                  <th className="p-4">Employee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {movements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-mono text-xs text-slate-500">
                        {new Date(m.date).toLocaleDateString()}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${getMovementTypeClass(m.movementType)}`}
                        >
                          {formatTypeLabel(m.movementType)}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                        {m.referenceNumber || "-"}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {m.itemCode} - {m.product.itemName}
                        </div>
                        {m.product.brand && <div className="text-[10px] text-slate-400">{m.product.brand}</div>}
                      </td>
                      <td className="p-4 text-right">
                        <span className={`font-bold ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                          {isPositive ? "+" : ""}{Math.abs(m.quantity)} {m.product.unitOfMeasurement}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatCurrency(m.unitCost)}
                      </td>
                      <td className="p-4 text-right font-mono text-xs text-slate-600 dark:text-slate-400">
                        {formatCurrency(m.totalCost)}
                      </td>
                      <td className="p-4 text-right font-bold font-mono text-slate-900 dark:text-white">
                        {m.runningBalance?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{m.location}</td>
                      <td className="p-4 text-xs text-slate-600 dark:text-slate-400">{m.responsibleEmployee}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}