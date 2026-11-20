"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Filter,
  Download,
  Calendar,
  FileText,
  CreditCard,
  Building,
  Eye,
  CheckCircle2,
  Clock,
  RefreshCw,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface FinancialTransaction {
  id: string;
  date: string;
  transactionNumber: string;
  description: string;
  transactionType: string;
  entityName: string;
  reference: string;
  currency: string;
  originalAmount: number;
  exchangeRate: number;
  aedAmount: number;
  debit: number;
  credit: number;
  status: string;
  viewUrl: string;
}

export default function TransactionsJournalPage() {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    fetchTransactions();
  }, [typeFilter, statusFilter, fromDate, toDate]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (typeFilter !== "ALL") params.append("type", typeFilter);
      if (statusFilter !== "ALL") params.append("status", statusFilter);
      if (fromDate) params.append("from", fromDate);
      if (toDate) params.append("to", toDate);

      const res = await fetch(`/api/accounts/transactions?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load transactions");
      const data = await res.json();
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch financial transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchTransactions();
  };

  // Filter in memory for immediate instant typing search if wanted
  const displayed = transactions.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.transactionNumber.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.entityName.toLowerCase().includes(q) ||
      t.reference.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(displayed.length / pageSize) || 1;
  const paginated = displayed.slice((page - 1) * pageSize, page * pageSize);

  const totalAED = displayed.reduce((s, t) => s + t.aedAmount, 0);

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "INVOICE_PAYMENT":
      case "PAYMENT":
        return {
          bg: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
          label: "Payment",
        };
      case "PO_ADVANCE":
        return {
          bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800",
          label: "PO Advance",
        };
      case "PURCHASE_INVOICE":
        return {
          bg: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800",
          label: "Vendor Bill",
        };
      case "JOURNAL_ENTRY":
        return {
          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-800",
          label: "Journal Voucher",
        };
      default:
        return {
          bg: "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          label: type,
        };
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/accounts"
            className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Financial Transactions Journal
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Complete audit ledger of payments, vendor invoices, advances, and double-entry postings
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTransactions()}
            className="flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{displayed.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total AED Volume</p>
          <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1 font-mono">
            {formatCurrency(totalAED, "AED")}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Base Currency</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">AED</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reference, supplier, voucher..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Types</option>
              <option value="PAYMENT">Direct Payment</option>
              <option value="PO_ADVANCE">PO Advance</option>
              <option value="INVOICE_PAYMENT">Invoice Settlement</option>
              <option value="PURCHASE_INVOICE">Vendor Invoice</option>
              <option value="JOURNAL_ENTRY">Journal Entry</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ALL">All Statuses</option>
              <option value="APPROVED">Approved / Confirmed</option>
              <option value="PAID">Paid</option>
              <option value="POSTED">Posted</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="md:col-span-2">
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </form>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-slate-500">Loading transactions...</div>
        ) : paginated.length === 0 ? (
          <div className="p-16 text-center text-slate-500">No financial transactions match your criteria.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Date</th>
                  <th className="px-5 py-3.5">Txn #</th>
                  <th className="px-5 py-3.5">Type</th>
                  <th className="px-5 py-3.5">Supplier / Entity</th>
                  <th className="px-5 py-3.5">Description</th>
                  <th className="px-5 py-3.5 text-right">Original Amount</th>
                  <th className="px-5 py-3.5 text-right">AED Equiv</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {paginated.map((t) => {
                  const badge = getTypeBadge(t.transactionType);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(t.date)}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {t.transactionNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded text-[11px] font-bold border ${badge.bg}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {t.entityName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {t.description}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                        {formatCurrency(t.originalAmount, t.currency)}
                      </td>
                      <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(t.aedAmount, "AED")}
                        {t.currency !== "AED" && (
                          <div className="text-[10px] text-slate-400">@ {t.exchangeRate}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                          {t.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <Link
                          href={t.viewUrl}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:text-blue-700 dark:text-blue-400 text-xs font-bold transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Page {page} of {totalPages} ({displayed.length} items)
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-bold"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 rounded border border-slate-200 dark:border-slate-700 disabled:opacity-40 text-xs font-bold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
