"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  CreditCard,
  Truck,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  TrendingUp
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: React.ElementType;
  color: string;
}

function StatCard({ title, value, change, trend, icon: Icon, color }: StatCardProps) {
  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex flex-col gap-3 transition-all hover:shadow-zoho-md">
      <div className="flex items-center justify-between">
        <div className={cn("p-2 rounded-lg", color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {change && (
          <div className={cn(
            "flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full",
            trend === "up" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
          )}>
            {trend === "up" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {change}
          </div>
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{value}</h3>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(" ");
}

export default function Dashboard() {
  const [stats, setStats] = useState<{
    monthlyPurchases: string;
    totalPOs: string;
    pendingPOs: string;
    overduePOs: string;
    totalPayments: string;
    outstandingBalances: string;
    totalGRNs: string;
    pendingDeliveries: string;
    uninvoicedGRNs: string;
  }>({
    monthlyPurchases: "Loading...",
    totalPOs: "Loading...",
    pendingPOs: "Loading...",
    overduePOs: "Loading...",
    totalPayments: "Loading...",
    outstandingBalances: "Loading...",
    totalGRNs: "Loading...",
    pendingDeliveries: "Loading...",
    uninvoicedGRNs: "Loading...",
  });

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/dashboard/stats");
        const data = await res.json();
        setStats({
          monthlyPurchases: formatCurrency(data.monthlyPurchases),
          totalPOs: data.totalPOs.toString(),
          pendingPOs: data.pendingPOs.toString(),
          overduePOs: data.overduePOs.toString(),
          totalPayments: formatCurrency(data.totalPayments),
          outstandingBalances: formatCurrency(data.outstandingBalances),
          totalGRNs: data.totalGRNs.toString(),
          pendingDeliveries: data.pendingDeliveries.toString(),
          uninvoicedGRNs: data.uninvoicedGRNs.toString(),
        });
      } catch (e) {
        console.error("Error fetching dashboard stats:", e);
      }
    }
    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Owner Dashboard</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Welcome back, Taher. Here is the current procurement status.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden md:block">
            <p className="text-xs text-slate-400 font-medium">Last Updated</p>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Just now</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Purchases"
          value={stats.monthlyPurchases}
          icon={ShoppingCart}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Purchase Orders"
          value={stats.totalPOs}
          icon={FileText}
          color="bg-indigo-600"
        />
        <StatCard
          title="Pending Approvals"
          value={stats.pendingPOs}
          icon={Clock}
          color="bg-amber-600"
        />
        <StatCard
          title="Overdue Orders"
          value={stats.overduePOs}
          icon={AlertCircle}
          color="bg-rose-600"
        />
        <StatCard
          title="Total Payments"
          value={stats.totalPayments}
          icon={CreditCard}
          color="bg-emerald-600"
        />
        <StatCard
          title="Outstanding Balances"
          value={stats.outstandingBalances}
          icon={TrendingUp}
          color="bg-slate-700"
        />
        <StatCard
          title="Goods Received"
          value={stats.totalGRNs}
          icon={Truck}
          color="bg-purple-600"
        />
        <StatCard
          title="Pending Deliveries"
          value={stats.pendingDeliveries}
          icon={Truck}
          color="bg-orange-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity Table */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-bold text-slate-800 dark:text-white">Recent Procurement Activity</h2>
            <button className="text-xs font-semibold text-blue-600 hover:underline">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-medium">
                <tr>
                  <th className="px-6 py-3">Transaction</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    No recent procurement activity found
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* System Health / Pending Tasks */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
          <h2 className="font-bold text-slate-800 dark:text-white mb-4">Pending Actions</h2>
          <div className="space-y-4">
            <div className="p-4 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">No pending actions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChevronRight(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
}
