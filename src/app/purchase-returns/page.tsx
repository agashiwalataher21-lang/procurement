"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Search,
  Package,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface PurchaseReturn {
  id: string;
  returnNumber: string;
  supplier: { name: string; supplierId: string };
  poId: string | null;
  grnId: string | null;
  returnDate: string;
  status: string;
  reason: string;
  expectedCreditNote: number;
  actualCreditNote: number;
  remainingCreditBalance: number;
}

export default function PurchaseReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<PurchaseReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = async () => {
    try {
      const res = await fetch("/api/purchase-returns");
      const data = await res.json();
      setReturns(data.returns || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load purchase returns");
    } finally {
      setLoading(false);
    }
  };

  const filteredReturns = returns.filter((r) => {
    const matchesSearch =
      r.returnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return { label: "Completed", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" };
      case "CONFIRMED":
        return { label: "Confirmed", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" };
      case "CANCELLED":
        return { label: "Cancelled", class: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" };
      default:
        return { label: status, class: "bg-slate-100 text-slate-700" };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Purchase Returns & Credit Notes
          </h1>
          <p className="text-sm text-slate-500">Track supplier returns and credit note reconciliation</p>
        </div>
        <Link
          href="/purchase-returns/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New Return
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Return # or Supplier..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-slate-500">Loading returns...</p>
          </div>
        ) : filteredReturns.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No purchase returns found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">Return #</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Return Date</th>
                  <th className="px-6 py-3">Reason</th>
                  <th className="px-6 py-3">Expected Credit</th>
                  <th className="px-6 py-3">Actual Credit</th>
                  <th className="px-6 py-3">Balance</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReturns.map((ret) => {
                  const status = getStatusBadge(ret.status);
                  return (
                    <tr key={ret.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">
                        {ret.returnNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{ret.supplier.name}</div>
                        <div className="text-xs text-slate-500">{ret.supplier.supplierId}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {new Date(ret.returnDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{ret.reason}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(ret.expectedCreditNote)}
                      </td>
                      <td className="px-6 py-4 font-semibold text-emerald-600">
                        {formatCurrency(ret.actualCreditNote)}
                      </td>
                      <td className="px-6 py-4 font-bold text-rose-600">
                        {formatCurrency(ret.remainingCreditBalance)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
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