"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Wallet,
  TrendingUp,
  TrendingDown,
  DollarSign,
  CreditCard,
  FileText,
  Calendar,
  ArrowRight,
  Search,
  Filter,
  Plus,
  Download,
  Upload,
  ArrowUpRight,
  ArrowDownRight,
  Home,
  BookOpen
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface AccountSummary {
  totalCash: number;
  totalBank: number;
  totalAccountsReceivable: number;
  totalAccountsPayable: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
}

interface RecentTransaction {
  id: string;
  date: string;
  description: string;
  type: "income" | "expense" | "transfer";
  category: string;
  amount: number;
  status: "completed" | "pending";
  reference: string;
}

export default function AccountsPage({ overrideTab }: { overrideTab?: string }) {
  const [summary, setSummary] = useState<AccountSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [payables, setPayables] = useState<any[]>([]);
  const [receivables, setReceivables] = useState<any[]>([]);
  const [journalEntries, setJournalEntries] = useState<any[]>([]);
  const [ledgerTransactions, setLedgerTransactions] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(overrideTab || "dashboard");

  useEffect(() => {
    if (overrideTab) {
      setActiveTab(overrideTab);
    }
  }, [overrideTab]);

  useEffect(() => {
    fetchDashboardData();
    fetchPayables();
    fetchReceivables();
    fetchJournalEntries();
    fetchLedgers();
    fetchSuppliers();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/accounts/dashboard");
      const data = await res.json();
      setSummary(data.summary);
      setRecentTransactions(data.recentTransactions || []);
    } catch (error) {
      console.error("Error fetching dashboard:", error);
      setSummary(null);
      setRecentTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPayables = async () => {
    try {
      const res = await fetch("/api/purchase-invoices?status=CONFIRMED");
      const data = await res.json();
      setPayables(data.invoices || []);
    } catch (error) {
      console.error("Error fetching payables:", error);
      setPayables([]);
    }
  };

  const fetchReceivables = async () => {
    // Customer module removed - return empty
    setReceivables([]);
  };

  const fetchJournalEntries = async () => {
    try {
      const res = await fetch("/api/accounts/journal");
      const data = await res.json();
      setJournalEntries(data.journals || []);
    } catch (error) {
      console.error("Error fetching journal entries:", error);
      setJournalEntries([]);
    }
  };

  const fetchLedgers = async (supplierId?: string) => {
    try {
      const sid = supplierId ?? selectedSupplier;
      const url = sid && sid !== "all" ? `/api/accounts/ledgers?supplierId=${encodeURIComponent(sid)}` : "/api/accounts/ledgers";
      const res = await fetch(url);
      const data = await res.json();
      setLedgerTransactions(data.ledgers || []);
    } catch (error) {
      console.error("Error fetching ledgers:", error);
      setLedgerTransactions([]);
    }
  };

  const handleSupplierChange = (value: string) => {
    setSelectedSupplier(value);
    fetchLedgers(value);
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      if (!res.ok) {
        throw new Error(`Failed to fetch suppliers: ${res.status}`);
      }
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      setSuppliers([]);
    }
  };

  const getBalance = () => {
    if (!summary) return 0;
    return summary.totalCash + summary.totalBank;
  };

  const getNetProfitMargin = () => {
    if (!summary || summary.totalRevenue === 0) return 0;
    return ((summary.netProfit / summary.totalRevenue) * 100).toFixed(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Accounts & Finance</h1>
          <p className="text-sm text-slate-500">
            Complete financial management, accounts payable/receivable, and reporting
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/accounts/journal"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            New Entry
          </Link>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 transition-all">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {[
            { id: "dashboard", label: "Dashboard", icon: Home },
            { id: "payable", label: "Accounts Payable", icon: TrendingDown },
            { id: "receivable", label: "Accounts Receivable", icon: TrendingUp },
            { id: "journal", label: "Journal Entries", icon: FileText },
            { id: "ledgers", label: "Ledgers", icon: BookOpen },
            { id: "reports", label: "Financial Reports", icon: FileText },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-b-2 border-blue-600"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard Content */}
      {activeTab === "dashboard" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Key Financial Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white shadow-lg shadow-emerald-500/20">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-white/20 rounded-lg">
                  <Wallet className="w-6 h-6" />
                </div>
                <span className="text-emerald-100 text-xs font-medium bg-white/10 px-2 py-1 rounded-full">
                  Current
                </span>
              </div>
              <p className="text-emerald-100 text-sm font-medium mb-1">Total Cash & Bank</p>
              <h3 className="text-3xl font-bold">{formatCurrency(getBalance())}</h3>
              <p className="text-emerald-50 text-xs mt-2">Available for operations</p>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-50 dark:bg-amber-900/30 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-amber-600" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Accounts Receivable</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary?.totalAccountsReceivable || 0)}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full">
                  +2.5% this month
                </span>
                <span className="text-xs text-slate-400">Outstanding invoices</span>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-rose-50 dark:bg-rose-900/30 rounded-lg">
                  <TrendingDown className="w-6 h-6 text-rose-600" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Accounts Payable</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary?.totalAccountsPayable || 0)}
              </h3>
              {(summary?.totalAccountsPayable || 0) > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-rose-600 font-medium bg-rose-50 dark:bg-rose-900/30 px-2 py-0.5 rounded-full">
                    Outstanding
                  </span>
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/30 rounded-lg">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <p className="text-slate-500 text-sm font-medium mb-1">Net Profit (YTD)</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(summary?.netProfit || 0)}
              </h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${summary?.netProfit && summary.netProfit > 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30"}`}>
                  {getNetProfitMargin()}% margin
                </span>
                <span className="text-xs text-slate-400">This fiscal year</span>
              </div>
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
              <Link href="/accounts/journal" className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3">Category</th>
                    <th className="px-6 py-3">Reference</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {recentTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(tx.date)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{tx.description}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                          tx.category === "Sales" || tx.category === "Accounts Receivable"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                        }`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {tx.reference}
                      </td>
                      <td className={`px-6 py-4 text-right font-bold ${
                        tx.type === "income" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                      }`}>
                        {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                          tx.status === "completed"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        }`}>
                          {tx.status === "completed" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {recentTransactions.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                        No recent transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-blue-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Record Payment</h3>
                <div className="p-2 bg-white/20 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <p className="text-blue-100 text-sm mb-4">Pay suppliers or record invoice settlements</p>
              <Link href="/payments/new" className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-50 transition-colors">
                <Plus className="w-4 h-4" /> Start Payment
              </Link>
            </div>

            <div className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-emerald-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">New Invoice</h3>
                <div className="p-2 bg-white/20 rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
              <p className="text-emerald-100 text-sm mb-4">Create and send professional invoices to customers</p>
              <Link href="/invoices/new" className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-emerald-700 px-4 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
                <Plus className="w-4 h-4" /> Create Invoice
              </Link>
            </div>

            <div className="bg-gradient-to-br from-amber-600 to-amber-700 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-amber-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">Financial Reports</h3>
                <div className="p-2 bg-white/20 rounded-lg">
                  <Home className="w-5 h-5" />
                </div>
              </div>
              <p className="text-amber-100 text-sm mb-4">Generate balance sheets, P&L, and cash flow</p>
              <Link href="/accounts/reports" className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-amber-700 px-4 py-2 rounded-lg hover:bg-amber-50 transition-colors">
                <Home className="w-4 h-4" /> View Reports
              </Link>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg">General Ledger</h3>
                <div className="p-2 bg-white/20 rounded-lg">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
              <p className="text-purple-100 text-sm mb-4">View detailed account transactions and balances</p>
              <button onClick={() => setActiveTab("ledgers")} className="inline-flex items-center gap-2 text-sm font-semibold bg-white text-purple-700 px-4 py-2 rounded-lg hover:bg-purple-50 transition-colors">
                <BookOpen className="w-4 h-4" /> View Ledgers
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Payable */}
      {activeTab === "payable" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Accounts Payable</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search payables..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <select className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none">
                <option>All Suppliers</option>
                <option>Overdue</option>
                <option>Pending</option>
              </select>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-4 text-xs font-semibold text-slate-500 uppercase">
              <div>Invoice</div>
              <div>Supplier</div>
              <div>Due Date</div>
              <div className="text-right">Amount Due</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {payables.length > 0 ? (
                payables.map((inv: any) => (
                  <div key={inv.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 grid grid-cols-4 gap-4 items-center">
                    <div className="font-mono text-sm text-blue-600">{inv.invoiceNumber}</div>
                    <div className="font-medium text-slate-900 dark:text-white">{inv.supplier?.name}</div>
                    <div className={`text-sm ${new Date(inv.dueDate) < new Date() ? "text-rose-600 font-semibold" : "text-slate-600 dark:text-slate-400"}`}>
                      {formatDate(inv.dueDate)} {new Date(inv.dueDate) < new Date() ? "(Overdue)" : ""}
                    </div>
                    <div className="text-right font-bold text-slate-900 dark:text-white">{formatCurrency(inv.grandTotal)}</div>
                  </div>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    No accounts payable found
                  </td>
                </tr>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Accounts Receivable */}
      {activeTab === "receivable" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Accounts Receivable</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" placeholder="Search receivables..." className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Create Invoice</button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 grid grid-cols-4 gap-4 text-xs font-semibold text-slate-500 uppercase">
              <div>Invoice</div>
              <div>Customer</div>
              <div>Due Date</div>
              <div className="text-right">Amount Due</div>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {receivables.length > 0 ? (
                receivables.map((inv: any) => (
                  <div key={inv.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 grid grid-cols-4 gap-4 items-center">
                    <div className="font-mono text-sm text-emerald-600">{inv.invoiceNumber}</div>
                    <div className="font-medium text-slate-900 dark:text-white">{inv.customerName}</div>
                    <div className="text-sm text-slate-600 dark:text-slate-400">{formatDate(inv.dueDate)}</div>
                    <div className="text-right font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(inv.grandTotal)}</div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-500">
                  No accounts receivable found (customer module disabled)
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Journal Entries */}
      {activeTab === "journal" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Journal Entries</h2>
            <Link href="/accounts/journal/new" className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">
              <Plus className="w-4 h-4" /> Add Entry
            </Link>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 bg-gradient-to-r from-purple-600 to-indigo-700 rounded-xl p-6 text-white">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6" />
                <h3 className="font-bold text-lg">Quick Journal Entry</h3>
              </div>
              <p className="text-purple-100 text-sm mb-4">Record manual accounting entries for adjustments, depreciation, or special transactions</p>
              <Link href="/accounts/journal/new" className="inline-flex items-center gap-2 bg-white text-purple-700 px-4 py-2 rounded-lg font-semibold hover:bg-purple-50 transition-colors">
                <Plus className="w-4 h-4" /> Create Journal Entry
              </Link>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white">Recent Journal Entries</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {journalEntries.length > 0 ? (
                journalEntries.map((entry: any) => (
                  <div key={entry.id} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${entry.status === "POSTED" ? "bg-emerald-500" : "bg-amber-500"}`}></div>
                        <span className="font-bold text-slate-900 dark:text-white">{entry.description}</span>
                        <span className="text-xs bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">{entry.journalNumber}</span>
                      </div>
                      <span className="text-xs text-slate-500">{formatDate(entry.date)}</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      {entry.lines?.map((line: any) => (
                        <div key={line.id}>
                          <span className="text-slate-500">{line.account?.name}</span>
                          <div className="text-right font-medium text-slate-900 dark:text-white">
                            {line.debit > 0 ? formatCurrency(line.debit) : formatCurrency(line.credit)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-6 py-12 text-center text-slate-500">
                  No journal entries found
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Ledgers */}
      {activeTab === "ledgers" && (
        <div className="space-y-6 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">General Ledger</h2>
              <p className="text-sm text-slate-500">View ledger transactions with supplier-wise details</p>
            </div>
            <div className="flex items-center gap-2">
              <select
                aria-label="Filter by supplier"
                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                value={selectedSupplier}
                onChange={(e) => handleSupplierChange(e.target.value)}
              >
                <option value="all">All Suppliers</option>
                {suppliers.map((s: any) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <button
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
                onClick={() => handleSupplierChange("all")}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Supplier-wise Summary Cards */}
          {selectedSupplier === "all" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Total Assets</h4>
                    <p className="text-xs text-slate-500">Cash, Inventory, Receivables</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(summary?.totalCash && summary.totalBank ? summary.totalCash + summary.totalBank : 0)}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-rose-100 dark:bg-rose-900/30 rounded-lg">
                    <TrendingDown className="w-5 h-5 text-rose-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Total Liabilities</h4>
                    <p className="text-xs text-slate-500">Payables, Loans, Accruals</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-rose-600">{formatCurrency(summary?.totalAccountsPayable || 0)}</p>
              </div>

              <div className="bg-white dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">Net Equity</h4>
                    <p className="text-xs text-slate-500">Retained earnings + capital</p>
                  </div>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(summary?.netProfit || 0)}</p>
              </div>
            </div>
          )}

          {/* Supplier-wise Ledger Transactions */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 dark:text-white">
                {selectedSupplier === "all" ? "All Supplier Transactions" : `Transactions for ${suppliers.find((s: any) => s.id === selectedSupplier)?.name || "Unknown Supplier"}`}
              </h3>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                <span>Debit</span>
                <span className="w-2 h-2 bg-rose-500 rounded-full ml-2"></span>
                <span>Credit</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Account</th>
                    <th className="px-6 py-3">Supplier</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Debit</th>
                    <th className="px-6 py-3 text-right">Credit</th>
                    <th className="px-6 py-3 text-right">Balance</th>
                    <th className="px-6 py-3 text-center">Ref</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {ledgerTransactions.length > 0 ? (
                    ledgerTransactions.map((tx: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                          {formatDate(tx.date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`font-semibold ${
                            tx.debit > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                          }`}>
                            {tx.accountName}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                          {tx.supplierName || "-"}
                        </td>
                        <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{tx.description}</td>
                        <td className="px-6 py-4 text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {tx.debit > 0 ? formatCurrency(tx.debit) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-rose-600 dark:text-rose-400">
                          {tx.credit > 0 ? formatCurrency(tx.credit) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                          {formatCurrency(tx.runningBalance)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-mono text-slate-500">{tx.journalNumber || "-"}</span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No ledger transactions found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Financial Reports */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-in fade-in">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Financial Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <Home className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Balance Sheet</h3>
              <p className="text-sm text-slate-500 mb-4">View assets, liabilities, and equity as of any date</p>
              <Link href="/reports?tab=13" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                Generate Report <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Profit & Loss</h3>
              <p className="text-sm text-slate-500 mb-4">Revenue, expenses, and net income for any period</p>
              <Link href="/reports?tab=12" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                Generate Report <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <DollarSign className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Cash Flow</h3>
              <p className="text-sm text-slate-500 mb-4">Operating, investing, and financing activities</p>
              <Link href="/reports?tab=14" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                Generate Report <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 hover:shadow-md transition-shadow">
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-lg w-12 h-12 flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Aged Receivables</h3>
              <p className="text-sm text-slate-500 mb-4">Customer balances by aging period</p>
              <Link href="/reports?tab=4" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
                Generate Report <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
