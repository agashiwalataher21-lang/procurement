"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  AlertTriangle,
  DollarSign,
  Package,
  Filter,
  Star,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface SupplierPerformance {
  supplierId: string;
  supplierCode: string;
  supplierName: string;
  totalOrders: number;
  totalSpent: number;
  onTimeDeliveryRate: number;
  avgLeadTimeDays: number;
  shortagePercent: number;
  damagedPercent: number;
  priceVariancePercent: number;
  outstandingBalance: number;
  performanceScore: number;
  lastOrderDate: string | null;
}

export default function SupplierPerformancePage() {
  const [performanceData, setPerformanceData] = useState<SupplierPerformance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    setLoading(true);
    try {
      // Fetch performance data from API
      const res = await fetch("/api/suppliers/performance");
      const data = await res.json();
      setPerformanceData(data.performanceData || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load supplier performance");
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceGrade = (score: number) => {
    if (score >= 90) return { grade: "A", color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
    if (score >= 80) return { grade: "B", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
    if (score >= 70) return { grade: "C", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" };
    if (score >= 60) return { grade: "D", color: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400" };
    return { grade: "F", color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" };
  };

  const getOnTimeDeliveryColor = (rate: number) => {
    if (rate >= 95) return "text-emerald-600";
    if (rate >= 85) return "text-amber-600";
    return "text-rose-600";
  };

  const getTotalSpentColor = (amount: number) => {
    if (amount > 50000) return "text-emerald-600";
    if (amount > 10000) return "text-blue-600";
    return "text-slate-600";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Supplier Performance Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Track supplier KPIs: on-time delivery, lead times, shortages, damages
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Total Suppliers</div>
          <div className="text-3xl font-extrabold mt-1">{performanceData.length}</div>
          <div className="text-xs opacity-80 mt-1">Active in system</div>
        </div>
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Avg On-Time Delivery</div>
          <div className="text-3xl font-extrabold mt-1">
            {performanceData.length > 0
              ? Math.round(
                  performanceData.reduce((sum, s) => sum + s.onTimeDeliveryRate, 0) / performanceData.length
                ) + "%"
              : "0%"}
          </div>
          <div className="text-xs opacity-80 mt-1">Overall supplier performance</div>
        </div>
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Total Spent</div>
          <div className="text-3xl font-extrabold mt-1">
            {formatCurrency(
              performanceData.reduce((sum, s) => sum + s.totalSpent, 0)
            )}
          </div>
          <div className="text-xs opacity-80 mt-1">Total procurement value</div>
        </div>
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Outstanding Balances</div>
          <div className="text-3xl font-extrabold mt-1">
            {formatCurrency(
              performanceData.reduce((sum, s) => sum + s.outstandingBalance, 0)
            )}
          </div>
          <div className="text-xs opacity-80 mt-1">Payables pending</div>
        </div>
      </div>

      {/* Supplier Performance Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Supplier Performance Metrics</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading performance data...</div>
        ) : performanceData.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No supplier performance data available</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-4">Supplier</th>
                  <th className="p-4 text-center">Orders</th>
                  <th className="p-4 text-center">On-Time Delivery</th>
                  <th className="p-4 text-center">Avg Lead Time</th>
                  <th className="p-4 text-center">Shortage %</th>
                  <th className="p-4 text-center">Damage %</th>
                  <th className="p-4 text-right">Total Spent</th>
                  <th className="p-4 text-right">Outstanding</th>
                  <th className="p-4 text-center">Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {performanceData.map((supplier) => {
                  const grade = getPerformanceGrade(supplier.performanceScore);
                  return (
                    <tr key={supplier.supplierId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{supplier.supplierName}</div>
                        <div className="text-xs text-slate-500">{supplier.supplierCode}</div>
                      </td>
                      <td className="p-4 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {supplier.totalOrders}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`font-bold ${getOnTimeDeliveryColor(supplier.onTimeDeliveryRate)}`}>
                          {supplier.onTimeDeliveryRate.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-slate-600 dark:text-slate-400">
                        {supplier.avgLeadTimeDays.toFixed(0)} days
                      </td>
                      <td className="p-4 text-center">
                        <span className={supplier.shortagePercent > 5 ? "text-rose-600" : "text-slate-600"}>
                          {supplier.shortagePercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={supplier.damagedPercent > 3 ? "text-rose-600" : "text-slate-600"}>
                          {supplier.damagedPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="p-4 text-right font-bold">
                        <span className={getTotalSpentColor(supplier.totalSpent)}>
                          {formatCurrency(supplier.totalSpent)}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-rose-600">
                        {formatCurrency(supplier.outstandingBalance)}
                      </td>
                      <td className="p-4 text-center">
                        <span
                          className={`px-3 py-1 rounded-lg font-bold text-xs ${grade.color}`}
                        >
                          {grade.grade}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/50 font-bold text-slate-700 dark:text-slate-300">
                <tr>
                  <td className="p-4">Total</td>
                  <td className="p-4 text-center">{performanceData.reduce((sum, s) => sum + s.totalOrders, 0)}</td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4"></td>
                  <td className="p-4 text-right">
                    {formatCurrency(performanceData.reduce((sum, s) => sum + s.totalSpent, 0))}
                  </td>
                  <td className="p-4 text-right">
                    {formatCurrency(performanceData.reduce((sum, s) => sum + s.outstandingBalance, 0))}
                  </td>
                  <td className="p-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Performance Legend */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wider">Performance Score Calculation</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">On-Time Delivery (40% weight)</span>
            </div>
            <p className="text-xs text-slate-500 ml-6">
              Percentage of orders delivered on or before the expected delivery date.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Lead Time (30% weight)</span>
            </div>
            <p className="text-xs text-slate-500 ml-6">
              Average days from order placement to delivery confirmation.
            </p>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Quality Metrics (30% weight)</span>
            </div>
            <p className="text-xs text-slate-500 ml-6">
              Combined shortage and damaged goods percentages (lower is better).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}