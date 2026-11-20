"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Truck,
  ShoppingCart,
  Calendar,
  DollarSign,
  Filter
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function POTrackingPage() {
  const [trackingData, setTrackingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("ALL");

  useEffect(() => {
    fetchTracking();
  }, []);

  const fetchTracking = async () => {
    try {
      const res = await fetch("/api/purchase-orders/tracking");
      const data = await res.json();
      setTrackingData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Calculating delivery ageing and capital tied up...</p>
      </div>
    );
  }

  const buckets = trackingData?.ageingBuckets || {
    "0-7": { count: 0, value: 0, orders: [] },
    "8-15": { count: 0, value: 0, orders: [] },
    "16-30": { count: 0, value: 0, orders: [] },
    "30+": { count: 0, value: 0, orders: [] },
  };

  const allOrders = trackingData?.orders || [];
  const filteredOrders = activeCategory === "ALL"
    ? allOrders
    : activeCategory === "DELAYED"
    ? allOrders.filter((o: any) => o.daysOverdue > 0)
    : buckets[activeCategory]?.orders || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/purchase-orders"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Order Tracking & Ageing</h1>
            <p className="text-sm text-slate-500">
              Monitor delivery schedules, overdue shipments, and capital tied up in pending goods
            </p>
          </div>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-950/50 text-blue-600">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tracked Open POs</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {trackingData?.totalTrackedOrders || 0}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex items-center gap-4">
          <div className="p-3 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Capital Tied Up in Pending Goods</p>
            <h3 className="text-2xl font-bold text-amber-600 mt-0.5">
              {formatCurrency(trackingData?.totalPendingCapital || 0)}
            </h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex items-center gap-4">
          <div className="p-3 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Delayed Deliveries</p>
            <h3 className="text-2xl font-bold text-rose-600 mt-0.5">
              {trackingData?.delayedOrdersCount || 0} Orders
            </h3>
          </div>
        </div>
      </div>

      {/* Ageing Category Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { key: "0-7", label: "0 to 7 Days", color: "border-blue-200 bg-blue-50/50 dark:bg-blue-950/20" },
          { key: "8-15", label: "8 to 15 Days", color: "border-indigo-200 bg-indigo-50/50 dark:bg-indigo-950/20" },
          { key: "16-30", label: "16 to 30 Days", color: "border-purple-200 bg-purple-50/50 dark:bg-purple-950/20" },
          { key: "30+", label: "Above 30 Days", color: "border-rose-200 bg-rose-50/50 dark:bg-rose-950/20" },
        ].map((cat) => {
          const bucket = buckets[cat.key];
          const isSelected = activeCategory === cat.key;
          return (
            <div
              key={cat.key}
              onClick={() => setActiveCategory(isSelected ? "ALL" : cat.key)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${cat.color} ${
                isSelected ? "ring-2 ring-blue-600 shadow-md" : "hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  {cat.label}
                </span>
                <span className="px-2 py-0.5 rounded-full text-xs font-extrabold bg-white dark:bg-slate-800 shadow-sm">
                  {bucket.count} POs
                </span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white mt-2">
                {formatCurrency(bucket.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* Filter Action Bar */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 px-6 py-3 rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            Viewing: {activeCategory === "ALL" ? "All Open Orders" : activeCategory === "DELAYED" ? "Delayed Orders" : `Ageing Category (${activeCategory} Days)`}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setActiveCategory("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "ALL" ? "bg-blue-600 text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Open
          </button>
          <button
            onClick={() => setActiveCategory("DELAYED")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeCategory === "DELAYED" ? "bg-rose-600 text-white" : "bg-rose-100 dark:bg-rose-950/30 text-rose-700 hover:bg-rose-200"
            }`}
          >
            Delayed Only
          </button>
        </div>
      </div>

      {/* Orders Tracking Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">PO Number</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Order Date</th>
                <th className="px-6 py-3">Expected Delivery</th>
                <th className="px-6 py-3">Age (Days)</th>
                <th className="px-6 py-3">Ordered Qty</th>
                <th className="px-6 py-3">Received Qty</th>
                <th className="px-6 py-3">Pending Value</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-slate-500">
                    No purchase orders match this category filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o: any) => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                      <Link href={`/purchase-orders/${o.id}`} className="hover:underline">
                        {o.poNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                      {o.supplierName}
                    </td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(o.orderDate)}</td>
                    <td className="px-6 py-4 text-slate-600">{formatDate(o.expectedDeliveryDate)}</td>
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-200">
                      {o.daysSinceOrder} Days
                      {o.daysOverdue > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-700">
                          +{o.daysOverdue}d overdue
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono font-semibold">{o.orderedQty}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-emerald-600">{o.receivedQty}</td>
                    <td className="px-6 py-4 font-bold text-amber-600">{formatCurrency(o.pendingValue, o.currency)}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        o.isDelayed ? "bg-rose-100 text-rose-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {o.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
