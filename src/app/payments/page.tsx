"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  TrendingUp,
  FileCheck,
  Building,
  Calendar,
  ExternalLink,
  Printer,
  Edit,
  Trash2,
  Eye,
  Upload,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Payment {
  id: string;
  paymentNumber: string;
  paymentDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  bankReference: string | null;
  recordedBy: string;
  status: string;
  supplier: {
    id: string;
    name: string;
    supplierId: string;
  };
  purchaseOrder?: {
    id: string;
    poNumber: string;
    grandTotal: number;
  } | null;
  invoice?: {
    id: string;
    invoiceNumber: string;
    grandTotal: number;
  } | null;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");

  useEffect(() => {
    fetchPayments();
  }, []);

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/payments/import", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to import payments");
        return;
      }

      toast.success(data.message || "Import completed successfully");
      fetchPayments();
    } catch (error) {
      console.error("Import error:", error);
      toast.error("An error occurred during import");
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/payments");
      const data = await res.json();
      setPayments(data.payments || []);
      setSummary(data.summary || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter((p) => {
    const matchesSearch =
      p.paymentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.purchaseOrder && p.purchaseOrder.poNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.bankReference && p.bankReference.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesMethod = methodFilter === "ALL" || p.paymentMethod === methodFilter;
    return matchesSearch && matchesMethod;
  });

  const handleDelete = async (id: string, paymentNumber: string) => {
    if (window.confirm(`Are you sure you want to delete payment ${paymentNumber}? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/payments/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to delete payment");
          return;
        }
        toast.success("Payment deleted successfully");
        fetchPayments();
      } catch (error) {
        console.error("Error deleting payment:", error);
        toast.error("An error occurred");
      }
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case "BANK_TRANSFER": return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "CASH": return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "CHEQUE": return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      default: return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payment Management</h1>
          <p className="text-sm text-slate-500 mt-1">
            Record advance payments against POs, track bank transfers and payments
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/payments/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </Link>
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={() => setSearchQuery("")}
            className="px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Filter className="w-4 h-4 mr-2 inline" />
            <span>Filter</span>
          </button>
          <a
            href="/import-template-payments.csv"
            download
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Template</span>
          </a>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payments</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(summary?.totalPaymentsAmount || 0)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">{summary?.totalPaymentsCount || 0} vouchers</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Advance PO Payments</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-1">
                {formatCurrency(summary?.advancePaymentsAmount || 0)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Before delivery</p>
            </div>
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
              <CreditCard className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Invoice Settlements</p>
              <h3 className="text-2xl font-bold text-indigo-600 mt-1">
                {formatCurrency(summary?.invoicePaymentsAmount || 0)}
              </h3>
              <p className="text-xs text-slate-400 mt-1">Against bills</p>
            </div>
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
              <FileCheck className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Payment Method</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">Bank Transfer</h3>
              <p className="text-xs text-slate-400 mt-1">Primary method</p>
            </div>
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Payment No, Supplier, or Bank Reference..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-shadow"
            >
              <option value="ALL">All Methods</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="OTHER">Other</option>
            </select>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-500">Loading payments...</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No payments found</p>
            <Link
              href="/payments/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Record your first payment &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">Payment No</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Target Reference</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors group">
                    <td className="px-6 py-4">
                      <Link
                        href={`/payments/${p.id}`}
                        className="font-mono font-bold text-xs text-blue-600 hover:underline"
                      >
                        {p.paymentNumber}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {formatDate(p.paymentDate)}
                    </td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/suppliers/${p.supplier.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                      >
                        {p.supplier.name}
                      </Link>
                      <p className="text-xs text-slate-400 font-mono">{p.supplier.supplierId}</p>
                    </td>
                    <td className="px-6 py-4">
                      {p.purchaseOrder ? (
                        <div className="flex flex-col">
                          <Link
                            href={`/purchase-orders/${p.purchaseOrder.id}`}
                            className="font-mono text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            <span>{p.purchaseOrder.poNumber}</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-sans">Advance</span>
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            PO: {formatCurrency(p.purchaseOrder.grandTotal)}
                          </span>
                        </div>
                      ) : p.invoice ? (
                        <div className="flex flex-col">
                          <Link
                            href={`/invoices/${p.invoice.id}`}
                            className="font-mono text-xs font-bold text-indigo-600 hover:underline"
                          >
                            {p.invoice.invoiceNumber}
                          </Link>
                          <span className="text-[11px] text-slate-400">
                            Inv: {formatCurrency(p.invoice.grandTotal)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">General Payment</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${getMethodColor(p.paymentMethod)}`}>
                        {p.paymentMethod.replace("_", " ")}
                      </span>
                      {p.bankReference && (
                        <div className="text-[11px] font-mono text-slate-400 mt-1">Ref: {p.bankReference}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(p.amount, p.currency)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/payments/${p.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-100 dark:text-slate-400 dark:hover:bg-blue-900/30 hover:text-blue-600"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/payments/${p.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-amber-100 dark:text-slate-400 dark:hover:bg-amber-900/30 hover:text-amber-600"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(p.id, p.paymentNumber)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-100 dark:text-slate-400 dark:hover:bg-rose-900/30 hover:text-rose-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 hover:text-slate-900">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Showing <span className="font-bold text-slate-700 dark:text-slate-300">{filteredPayments.length}</span> of{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">{payments.length}</span> payments
        </p>
        <div className="text-xs text-slate-400">
          {summary && (
            <>
              Total: {formatCurrency(summary.totalPaymentsAmount || 0)} •{" "}
              {summary.totalPaymentsCount || 0} transactions
            </>
          )}
        </div>
      </div>
    </div>
  );
}
