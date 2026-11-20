"use client";

import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  Package,
  ShoppingCart,
  DollarSign,
  AlertTriangle,
  Truck,
  Users,
  FileText,
  Clock,
  Download,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface DashboardKPIs {
  monthlyPOSpend: number;
  yearlyPOSpend: number;
  monthlyGRNValue: number;
  yearlyGRNValue: number;
  monthlyPayments: number;
  yearlyPayments: number;
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  inventoryValue: number;
  totalSuppliers: number;
  activeSuppliers: number;
  pendingPOs: number;
  approvedPOs: number;
  inTransitShipments: number;
  pendingCustoms: number;
  pendingReturns: number;
  unpaidInvoiceValue: number;
  overdueAmount: number;
}

interface MonthlyTrend {
  month: string;
  poCount: number;
  poValue: number;
  grnCount: number;
  grnValue: number;
}

interface Supplier {
  id: string;
  name: string;
  totalPOValue: number;
}

interface CategoryBreakdown {
  category: string;
  productCount: number;
  value: number;
}

interface DashboardData {
  kpis: DashboardKPIs;
  monthlyTrends: MonthlyTrend[];
  topSuppliers: Supplier[];
  categoryBreakdown: CategoryBreakdown[];
}

const COLORS = ["#1e40af", "#0891b2", "#059669", "#f59e0b", "#dc2626"];

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 300000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const fetchDashboard = async () => {
    try {
      const res = await fetch("/api/dashboard");
      const dashboardData = await res.json();
      setData(dashboardData);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-slate-500">Loading dashboard...</p>
      </div>
    );
  }

  const kpis = data.kpis;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time KPIs and operational insights for Bait Al Hadaf General Trading
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
            <Download className="w-4 h-4 mr-2 inline" />
            Export
          </button>
          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all">
            <RefreshCw className="w-4 h-4 mr-2 inline" />
            Refresh
          </button>
        </div>
      </div>

      {/* Critical Alerts Row */}
      {(kpis.overdueAmount > 0 || kpis.outOfStockCount > 0 || kpis.pendingCustoms > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {kpis.overdueAmount > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-rose-800 dark:text-rose-200">Overdue Payments</h3>
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  {formatCurrency(kpis.overdueAmount)} outstanding
                </p>
              </div>
            </div>
          )}
          {kpis.outOfStockCount > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-200">Out of Stock</h3>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  {kpis.outOfStockCount} products need reorder
                </p>
              </div>
            </div>
          )}
          {kpis.pendingCustoms > 0 && (
            <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900 p-4 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-purple-800 dark:text-purple-200">Customs Clearance</h3>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  {kpis.pendingCustoms} shipments awaiting clearance
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly PO Spend</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(kpis.monthlyPOSpend)}</p>
              <p className="text-xs text-slate-400 mt-1">YTD: {formatCurrency(kpis.yearlyPOSpend)}</p>
            </div>
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Goods Received</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(kpis.monthlyGRNValue)}</p>
              <p className="text-xs text-slate-400 mt-1">YTD: {formatCurrency(kpis.yearlyGRNValue)}</p>
            </div>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <Package className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monthly Payments</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(kpis.monthlyPayments)}</p>
              <p className="text-xs text-slate-400 mt-1">YTD: {formatCurrency(kpis.yearlyPayments)}</p>
            </div>
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <DollarSign className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Value</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(kpis.inventoryValue)}</p>
              <p className="text-xs text-slate-400 mt-1">{kpis.totalProducts} SKUs</p>
            </div>
            <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Pending POs</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">{kpis.pendingPOs}</p>
          <p className="text-xs text-slate-400 mt-1">{kpis.approvedPOs} approved</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Stock Levels</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">{kpis.lowStockCount}</p>
          <p className="text-xs text-slate-400 mt-1">Low stock items</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">In Transit</p>
          <p className="text-2xl font-bold text-cyan-600 mt-1">{kpis.inTransitShipments}</p>
          <p className="text-xs text-slate-400 mt-1">{kpis.pendingCustoms} in customs</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wider">Unpaid Invoices</p>
          <p className="text-2xl font-bold text-rose-600 mt-1">{formatCurrency(kpis.unpaidInvoiceValue)}</p>
          <p className="text-xs text-slate-400 mt-1">Overdue: {formatCurrency(kpis.overdueAmount)}</p>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">6-Month PO Trend</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.monthlyTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} axisLine={false} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `AED ${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend />
                <Line type="monotone" dataKey="poValue" stroke="#1e40af" strokeWidth={2} dot={false} name="PO Value" />
                <Line type="monotone" dataKey="grnValue" stroke="#059669" strokeWidth={2} dot={false} name="GRN Value" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Top 5 Suppliers (YTD)</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topSuppliers}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" tickLine={false} axisLine={false} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} tickFormatter={(val) => `AED ${val}`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1e293b",
                    border: "1px solid #475569",
                    borderRadius: "8px",
                  }}
                  formatter={(value) => formatCurrency(value)}
                />
                <Bar dataKey="totalPOValue" fill="#1e40af" radius={[4, 4, 0, 0]} name="PO Value" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Inventory by Category</h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={110}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend layout="vertical" verticalAlign="middle" align="right" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
          <h2 className="text-base font-bold text-slate-900 dark:text-white mb-4">Supplier Network</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <Users className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Suppliers</span>
              </div>
              <span className="text-lg font-bold text-slate-900 dark:text-white">{kpis.totalSuppliers}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <Users className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</span>
              </div>
              <span className="text-lg font-bold text-emerald-600">{kpis.activeSuppliers}</span>
            </div>
          </div>

          <h2 className="text-base font-bold text-slate-900 dark:text-white mt-6 mb-4">Logistics</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/20 rounded-lg">
                  <Truck className="w-4 h-4 text-cyan-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">In Transit</span>
              </div>
              <span className="text-lg font-bold text-cyan-600">{kpis.inTransitShipments}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                  <Clock className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Customs</span>
              </div>
              <span className="text-lg font-bold text-purple-600">{kpis.pendingCustoms}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/20 rounded-lg">
                  <FileText className="w-4 h-4 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Returns</span>
              </div>
              <span className="text-lg font-bold text-amber-600">{kpis.pendingReturns}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Distribution */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
        <h2 className="text-base font-bold text-slate-900 dark:text-white mb-6">Financial Distribution</h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Purchase Orders</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.monthlyPOSpend)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((kpis.monthlyPOSpend / (kpis.yearlyPOSpend || 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">of YTD spend • {formatCurrency(kpis.yearlyPOSpend)} total</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Goods Received</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.monthlyGRNValue)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((kpis.monthlyGRNValue / (kpis.yearlyGRNValue || 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">of YTD receipts • {formatCurrency(kpis.yearlyGRNValue)} total</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Payments Made</span>
              <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(kpis.monthlyPayments)}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-amber-500 h-2.5 rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((kpis.monthlyPayments / (kpis.yearlyPayments || 1)) * 100, 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1.5">of YTD payments • {formatCurrency(kpis.yearlyPayments)} total</p>
          </div>
        </div>
      </div>
    </div>
  );
}