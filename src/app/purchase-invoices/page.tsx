"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Search,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Clock,
  Eye,
  Filter,
  Download,
  Edit,
  Trash2
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  status: string;
  currency?: string;
  exchangeRate?: number;
  aedGrandTotal?: number;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  paidAmount: number;
  supplier: {
    id: string;
    name: string;
    supplierId: string;
  };
  purchaseOrder: {
    id: string;
    poNumber: string;
  };
  items: any[];
}

export default function PurchaseInvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/purchase-invoices");
      if (!res.ok) throw new Error("Failed to load invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load purchase invoices");
    } finally {
      setLoading(false);
    }
  };

  const filteredInvoices = invoices.filter((inv) => {
    const matchesSearch =
      inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.purchaseOrder.poNumber.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "ALL" || inv.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice ${invoiceNumber}? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/purchase-invoices/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to delete invoice");
          return;
        }
        toast.success("Invoice deleted successfully");
        fetchInvoices();
      } catch (error) {
        console.error("Error deleting invoice:", error);
        toast.error("An error occurred");
      }
    }
  };

  const totalInvoiceValue = invoices.reduce(
    (s, i) => s + (i.aedGrandTotal || (i.grandTotal * (i.exchangeRate || 1))),
    0
  );
  const totalOutstanding = invoices.reduce(
    (s, i) => s + Math.max(0, (i.grandTotal - i.paidAmount) * (i.exchangeRate || 1)),
    0
  );
  const paidCount = invoices.filter(i => i.status === "PAID").length;
  const pendingCount = invoices.filter(i => i.status !== "PAID" && i.status !== "PARTIALLY_PAID").length;

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { label: string; class: string; icon: React.ReactNode } } = {
      CONFIRMED: { label: "Confirmed", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400", icon: <FileText className="w-3 h-3" /> },
      PAID: { label: "Paid", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: <DollarSign className="w-3 h-3" /> },
      PARTIALLY_PAID: { label: "Partial", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: <Clock className="w-3 h-3" /> },
      OVERDUE: { label: "Overdue", class: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400", icon: <AlertCircle className="w-3 h-3" /> },
    };
    return badges[status] || { label: status, class: "bg-slate-100 text-slate-600", icon: <FileText className="w-3 h-3" /> };
  };

  return (
    <div className="space-y-6">
      {/* Header with CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            Purchase Invoices
          </h1>
          <p className="text-sm text-slate-500 mt-1">Record and track vendor bills, reconcile with POs</p>
        </div>
        <Link
          href="/purchase-invoices/new"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
        >
          <Plus className="w-5 h-5" />
          Record Invoice
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/40 p-5 rounded-xl border border-blue-200 dark:border-blue-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Total Invoices</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{invoices.length}</h3>
            </div>
            <FileText className="w-10 h-10 text-blue-300 dark:text-blue-700" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/40 dark:to-purple-900/40 p-5 rounded-xl border border-purple-200 dark:border-purple-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase tracking-wider">Total Value</p>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">{formatCurrency(totalInvoiceValue)}</h3>
            </div>
            <TrendingUp className="w-10 h-10 text-purple-300 dark:text-purple-700" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/40 dark:to-rose-900/40 p-5 rounded-xl border border-rose-200 dark:border-rose-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-rose-600 dark:text-rose-400 uppercase tracking-wider">Outstanding</p>
              <h3 className="text-xl font-bold text-rose-700 dark:text-rose-300 mt-1">{formatCurrency(totalOutstanding)}</h3>
            </div>
            <AlertCircle className="w-10 h-10 text-rose-300 dark:text-rose-700" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/40 dark:to-emerald-900/40 p-5 rounded-xl border border-emerald-200 dark:border-emerald-800/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Paid</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{paidCount}</h3>
            </div>
            <DollarSign className="w-10 h-10 text-emerald-300 dark:text-emerald-700" />
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search invoices, suppliers, POs..."
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm"
        >
          <option value="ALL">All Status</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PAID">Paid</option>
          <option value="PARTIALLY_PAID">Partial</option>
          <option value="OVERDUE">Overdue</option>
        </select>
      </div>

      {/* Invoices Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
              <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
            </div>
            <p className="text-sm text-slate-500 font-medium">Loading invoices...</p>
          </div>
        ) : filteredInvoices.length === 0 ? (
          <div className="p-16 text-center">
            <FileText className="w-16 h-16 text-slate-200 dark:text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-medium">No invoices found</p>
            <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filter</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Invoice #</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Supplier</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">PO Ref</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Dates</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-right text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Balance</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {filteredInvoices.map((inv) => {
                  const balance = inv.grandTotal - inv.paidAmount;
                  const badge = getStatusBadge(inv.status);

                  return (
                    <tr key={inv.id} className="hover:bg-blue-50 dark:hover:bg-blue-950/10 transition-colors">
                      <td className="px-6 py-4">
                        <Link
                          href={`/purchase-invoices/${inv.id}`}
                          className="font-mono text-sm font-bold text-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
                        >
                          {inv.invoiceNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/suppliers/${inv.supplier.id}`}
                          className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                        >
                          {inv.supplier.name}
                        </Link>
                      </td>

                      <td className="px-6 py-4">
                        <Link
                          href={`/purchase-orders/${inv.purchaseOrder.id}`}
                          className="font-mono text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors"
                        >
                          {inv.purchaseOrder.poNumber}
                        </Link>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">
                        <div className="space-y-0.5">
                          <p>{formatDate(inv.invoiceDate)}</p>
                          <p className="text-xs text-slate-500">Due: {formatDate(inv.dueDate)}</p>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                          {formatCurrency(inv.grandTotal, inv.currency)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">+{formatCurrency(inv.vatAmount, inv.currency)} VAT</p>
                        {inv.currency && inv.currency !== "AED" && (
                          <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            AED {(inv.grandTotal * (inv.exchangeRate || 1)).toFixed(2)}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <p className={`font-mono text-sm font-bold ${balance > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                          {formatCurrency(balance, inv.currency)}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">Paid: {formatCurrency(inv.paidAmount, inv.currency)}</p>
                        {inv.currency && inv.currency !== "AED" && balance > 0 && (
                          <p className="text-[11px] font-semibold text-slate-500 font-mono mt-0.5">
                            AED {(balance * (inv.exchangeRate || 1)).toFixed(2)}
                          </p>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/purchase-invoices/${inv.id}`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-900/60 rounded-lg text-xs font-bold transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            View
                          </Link>
                          <Link
                            href={`/purchase-invoices/${inv.id}/edit`}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/60 rounded-lg text-xs font-bold transition-all"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(inv.id, inv.invoiceNumber)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/60 rounded-lg text-xs font-bold transition-all"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </div>
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