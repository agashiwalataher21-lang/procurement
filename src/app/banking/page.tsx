"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Landmark,
  Plus,
  Trash2,
  X,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  Clock,
  BadgeCheck,
  Wallet,
  RefreshCw,
  Loader2,
  Edit,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface BankAccount {
  id: string;
  accountName: string;
  bankName: string;
  accountNumber: string;
  iban?: string | null;
  accountType: string;
  currency: string;
  openingBalance: number;
  status: string;
  classifiedBy: string;
  notes?: string | null;
  balance: number;
  totalCredits: number;
  totalDebits: number;
  pendingCount: number;
  unreconciledCount: number;
  transactionCount: number;
  transactions: any[];
  reconciledUpTo?: string | null;
}

interface BankPayment { id: string; paymentNumber: string; date: string; supplier: string; amount: number; currency: string; method: string; bankReference: string; status: string; }

export default function BankingPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [totals, setTotals] = useState({ totalBank: 0, totalCash: 0, totalCombined: 0 });
  const [bankPayments, setBankPayments] = useState<BankPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState<string>("");

  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BankAccount | null>(null);
  const [saving, setSaving] = useState(false);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);

  const [accountForm, setAccountForm] = useState({ accountName: "", bankName: "", accountNumber: "", iban: "", accountType: "CURRENT", currency: "AED", openingBalance: 0, classifiedBy: "BANK", notes: "" });
  const [txForm, setTxForm] = useState({ bankAccountId: "", date: new Date().toISOString().split("T")[0], description: "", reference: "", type: "DEBIT", amount: 0, category: "OTHER", notes: "" });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/banking");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load banking data");
      setAccounts(data.accounts || []);
      setTotals(data.totals || { totalBank: 0, totalCash: 0, totalCombined: 0 });
      setBankPayments(data.bankPayments || []);
      const active = (data.accounts || []).filter((a: BankAccount) => a.status === "ACTIVE");
      if (!selectedAccountId && active.length > 0) setSelectedAccountId(active[0].id);
    } catch (err: any) {
      toast.error(err.message || "Failed to load banking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId);
  const activeAccounts = accounts.filter((a) => a.status === "ACTIVE");

  const openNewAccount = () => {
    setEditingAccount(null);
    setAccountForm({ accountName: "", bankName: "", accountNumber: "", iban: "", accountType: "CURRENT", currency: "AED", openingBalance: 0, classifiedBy: "BANK", notes: "" });
    setShowAccountModal(true);
  };

  const openEditAccount = (a: BankAccount) => {
    setEditingAccount(a);
    setAccountForm({ accountName: a.accountName, bankName: a.bankName, accountNumber: a.accountNumber, iban: a.iban || "", accountType: a.accountType, currency: a.currency, openingBalance: a.openingBalance, classifiedBy: a.classifiedBy, notes: a.notes || "" });
    setShowAccountModal(true);
  };

  const saveAccount = async () => {
    if (!accountForm.accountName.trim() || !accountForm.bankName.trim() || !accountForm.accountNumber.trim()) {
      toast.error("Account name, bank and account number are required");
      return;
    }
    setSaving(true);
    try {
      if (editingAccount) {
        const res = await fetch(`/api/banking/${editingAccount.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(accountForm) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to update account");
        toast.success("Bank account updated");
      } else {
        const res = await fetch("/api/banking", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(accountForm) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to create account");
        toast.success("Bank account created");
      }
      setShowAccountModal(false);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  const deleteAccount = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/banking/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to deactivate account");
      toast.success("Bank account deactivated");
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to deactivate account");
    } finally {
      setSaving(false);
    }
  };

  const openNewTx = () => {
    setTxForm({ bankAccountId: selectedAccountId || activeAccounts[0]?.id || "", date: new Date().toISOString().split("T")[0], description: "", reference: "", type: "DEBIT", amount: 0, category: "OTHER", notes: "" });
    setShowTxModal(true);
  };

  const saveTx = async () => {
    if (!txForm.bankAccountId || !txForm.description.trim() || !txForm.amount) {
      toast.error("Account, description and amount are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/banking/transactions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(txForm) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record transaction");
      toast.success("Transaction recorded");
      setShowTxModal(false);
      setSelectedTxIds([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to record transaction");
    } finally {
      setSaving(false);
    }
  };

  const markReconciled = async () => {
    if (selectedTxIds.length === 0) { toast.error("Select transactions to reconcile"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/banking/transactions", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: selectedTxIds, status: "RECONCILED" }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reconcile");
      toast.success(`${data.updated} transaction(s) marked reconciled`);
      setSelectedTxIds([]);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reconcile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-20 text-center"><Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-3" /><p className="text-sm text-slate-500">Loading banking...</p></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-blue-600" />
            Banking
          </h1>
          <p className="text-sm text-slate-500">Bank & cash accounts, movements, payments and reconciliation</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={fetchData} className="flex items-center gap-2 px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
          <button onClick={openNewAccount} className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all">
            <Plus className="w-4 h-4" /> Add Bank Account
          </button>
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-blue-100 text-sm font-medium">Total Bank Balance</span>
            <Landmark className="w-5 h-5 text-blue-200" />
          </div>
          <h3 className="text-3xl font-bold">{formatCurrency(totals.totalBank)}</h3>
          <p className="text-blue-100 text-xs mt-2">{activeAccounts.filter((a) => a.classifiedBy === "BANK").length} active bank account(s)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Cash on Hand</span>
            <Wallet className="w-5 h-5 text-emerald-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{formatCurrency(totals.totalCash)}</h3>
          <p className="text-slate-400 text-xs mt-2">{activeAccounts.filter((a) => a.classifiedBy === "CASH").length} cash account(s)</p>
        </div>
        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-500 text-sm font-medium">Unreconciled Items</span>
            <BadgeCheck className="w-5 h-5 text-amber-600" />
          </div>
          <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{activeAccounts.reduce((s, a) => s + a.unreconciledCount, 0)}</h3>
          <p className="text-slate-400 text-xs mt-2">Transactions awaiting reconciliation</p>
        </div>
      </div>

      {/* Accounts */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Bank & Cash Accounts</h2>
          <span className="text-xs text-slate-400">{activeAccounts.length} active · {accounts.length - activeAccounts.length} inactive</span>
        </div>
        {activeAccounts.length === 0 ? (
          <div className="p-12 text-center">
            <Landmark className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500 mb-4">No bank accounts yet. Add your first account to start tracking balances.</p>
            <button onClick={openNewAccount} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold">Add Bank Account</button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Account</th>
                  <th className="px-6 py-3">Bank</th>
                  <th className="px-6 py-3">Number / IBAN</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                  <th className="px-6 py-3 text-center">Pending</th>
                  <th className="px-6 py-3 text-center">Unreconciled</th>
                  <th className="px-6 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {activeAccounts.map((a) => (
                  <tr key={a.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${a.id === selectedAccountId ? "bg-blue-50/50 dark:bg-blue-950/20" : ""}`}>
                    <td className="px-6 py-4">
                      <button onClick={() => setSelectedAccountId(a.id)} className="font-semibold text-blue-700 dark:text-blue-300 hover:underline">{a.accountName}</button>
                      {a.notes && <p className="text-xs text-slate-400 mt-0.5">{a.notes}</p>}
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">{a.bankName}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">
                      {a.accountNumber}
                      {a.iban && <div className="text-[11px] mt-0.5">{a.iban}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">{a.accountType} · {a.currency}</span>
                    </td>
                    <td className="px-6 py-4 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(a.balance, a.currency)}</td>
                    <td className="px-6 py-4 text-center">{a.pendingCount > 0 ? <span className="text-amber-600 font-bold">{a.pendingCount}</span> : <span className="text-slate-400">—</span>}</td>
                    <td className="px-6 py-4 text-center">{a.unreconciledCount > 0 ? <span className="text-blue-600 font-bold">{a.unreconciledCount}</span> : <span className="text-emerald-600 font-bold">✓</span>}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditAccount(a)} className="p-1.5 rounded-lg text-slate-600 hover:bg-amber-100 hover:text-amber-600 transition-colors" title="Edit"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(a)} className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors" title="Deactivate"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Transactions for selected account */}
      {selectedAccount && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Transactions — {selectedAccount.accountName}</h2>
              <p className="text-xs text-slate-500">Opening {formatCurrency(selectedAccount.openingBalance, selectedAccount.currency)} · +Credits {formatCurrency(selectedAccount.totalCredits)} · −Debits {formatCurrency(selectedAccount.totalDebits)} = Balance {formatCurrency(selectedAccount.balance, selectedAccount.currency)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={markReconciled} disabled={selectedTxIds.length === 0 || saving} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50">
                <BadgeCheck className="w-4 h-4" /> Reconcile Selected ({selectedTxIds.length})
              </button>
              <button onClick={openNewTx} className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold">
                <Plus className="w-4 h-4" /> Record Transaction
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-3 py-3 w-8"></th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Reference</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3 text-right">Debit</th>
                  <th className="px-4 py-3 text-right">Credit</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(selectedAccount.transactions || []).map((t: any) => {
                  const checked = selectedTxIds.includes(t.id);
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-3 py-3 text-center">
                        <input type="checkbox" checked={checked} onChange={(e) => setSelectedTxIds(e.target.checked ? [...selectedTxIds, t.id] : selectedTxIds.filter((id) => id !== t.id))} className="accent-blue-600" />
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{formatDate(t.date)}</td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">{t.description}</td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-500">{t.reference || t.transactionNumber || "—"}</td>
                      <td className="px-4 py-3 text-xs text-slate-600">{t.category}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">{t.type === "DEBIT" ? formatCurrency(t.amount) : "—"}</td>
                      <td className="px-4 py-3 text-right font-mono text-emerald-600">{t.type === "CREDIT" ? formatCurrency(t.amount) : "—"}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.status === "RECONCILED" ? "bg-emerald-100 text-emerald-700" : t.status === "PENDING" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          {t.status === "RECONCILED" ? <CheckCircle2 className="w-3 h-3" /> : t.status === "PENDING" ? <Clock className="w-3 h-3" /> : null}
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {(!selectedAccount.transactions || selectedAccount.transactions.length === 0) && (
                  <tr><td colSpan={8} className="px-6 py-10 text-center text-slate-500 text-sm">No transactions yet for this account.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bank-linked supplier payments */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Supplier Payments via Bank / Cheque</h2>
          <Link href="/payments/new" className="text-xs font-bold text-blue-600 hover:underline">Record Payment</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Payment #</th>
                <th className="px-6 py-3">Supplier</th>
                <th className="px-6 py-3">Method</th>
                <th className="px-6 py-3">Bank Reference</th>
                <th className="px-6 py-3 text-right">Amount</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {bankPayments.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-3 text-slate-600 whitespace-nowrap">{p.date}</td>
                  <td className="px-6 py-3 font-mono text-xs text-blue-600">{p.paymentNumber}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900 dark:text-white">{p.supplier}</td>
                  <td className="px-6 py-3 text-xs">{p.method === "CHEQUE" ? <span className="inline-flex items-center gap-1 text-slate-600"><ArrowUpRight className="w-3 h-3" />Cheque</span> : <span className="inline-flex items-center gap-1 text-slate-600"><Landmark className="w-3 h-3" />Bank Transfer</span>}</td>
                  <td className="px-6 py-3 font-mono text-xs text-slate-500">{p.bankReference}</td>
                  <td className="px-6 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(p.amount, p.currency)}</td>
                  <td className="px-6 py-3 text-center"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">{p.status}</span></td>
                </tr>
              ))}
              {bankPayments.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-slate-500 text-sm">No bank or cheque payments recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-blue-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold">{editingAccount ? "Edit Bank Account" : "Add Bank Account"}</h2>
              <button onClick={() => setShowAccountModal(false)} className="p-2 rounded-lg hover:bg-blue-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Account Name *</label>
                <input value={accountForm.accountName} onChange={(e) => setAccountForm({ ...accountForm, accountName: e.target.value })} placeholder="e.g. Emirates NBD — Operating" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Bank Name *</label>
                <input value={accountForm.bankName} onChange={(e) => setAccountForm({ ...accountForm, bankName: e.target.value })} placeholder="e.g. Emirates NBD" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Account Number *</label>
                  <input value={accountForm.accountNumber} onChange={(e) => setAccountForm({ ...accountForm, accountNumber: e.target.value })} placeholder="AE07..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">IBAN</label>
                  <input value={accountForm.iban} onChange={(e) => setAccountForm({ ...accountForm, iban: e.target.value })} placeholder="AE07 0331 2345..." className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Type</label>
                  <select value={accountForm.accountType} onChange={(e) => setAccountForm({ ...accountForm, accountType: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm">
                    <option value="CURRENT">Current</option>
                    <option value="SAVINGS">Savings</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Category</label>
                  <select value={accountForm.classifiedBy} onChange={(e) => setAccountForm({ ...accountForm, classifiedBy: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm">
                    <option value="BANK">Bank</option>
                    <option value="CASH">Cash</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Currency</label>
                  <select value={accountForm.currency} onChange={(e) => setAccountForm({ ...accountForm, currency: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm">
                    <option value="AED">AED</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="SAR">SAR</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Opening Balance</label>
                  <input type="number" step="0.01" value={accountForm.openingBalance} onChange={(e) => setAccountForm({ ...accountForm, openingBalance: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Notes</label>
                <input value={accountForm.notes} onChange={(e) => setAccountForm({ ...accountForm, notes: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-b-2xl">
              <button onClick={() => setShowAccountModal(false)} className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-lg">Cancel</button>
              <button onClick={saveAccount} disabled={saving} className="px-6 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? "Saving..." : editingAccount ? "Update Account" : "Create Account"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            <div className="sticky top-0 bg-emerald-600 text-white px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <h2 className="font-bold">Record Bank Transaction</h2>
              <button onClick={() => setShowTxModal(false)} className="p-2 rounded-lg hover:bg-emerald-700"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Account *</label>
                <select value={txForm.bankAccountId} onChange={(e) => setTxForm({ ...txForm, bankAccountId: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm">
                  <option value="">Select account...</option>
                  {activeAccounts.map((a) => <option key={a.id} value={a.id}>{a.accountName} — {a.bankName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Date</label>
                  <input type="date" value={txForm.date} onChange={(e) => setTxForm({ ...txForm, date: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Type</label>
                  <select value={txForm.type} onChange={(e) => setTxForm({ ...txForm, type: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm">
                    <option value="DEBIT">Debit (money out)</option>
                    <option value="CREDIT">Credit (money in)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Description *</label>
                <input value={txForm.description} onChange={(e) => setTxForm({ ...txForm, description: e.target.value })} placeholder="e.g. Supplier payment — Yamaha" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Amount *</label>
                  <input type="number" step="0.01" min="0" value={txForm.amount} onChange={(e) => setTxForm({ ...txForm, amount: parseFloat(e.target.value) || 0 })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Reference</label>
                  <input value={txForm.reference} onChange={(e) => setTxForm({ ...txForm, reference: e.target.value })} placeholder="e.g. TRF-2026-001" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">Category</label>
                <select value={txForm.category} onChange={(e) => setTxForm({ ...txForm, category: e.target.value })} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 rounded-lg text-sm">
                  <option value="SUPPLIER_PAYMENT">Supplier Payment</option>
                  <option value="SALES_RECEIPT">Sales Receipt</option>
                  <option value="EXPENSE">Expense</option>
                  <option value="TRANSFER">Transfer</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>
            <div className="border-t border-slate-200 px-6 py-4 flex justify-end gap-3 bg-slate-50 dark:bg-slate-900/30 rounded-b-2xl">
              <button onClick={() => setShowTxModal(false)} className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-lg">Cancel</button>
              <button onClick={saveTx} disabled={saving} className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50">{saving ? "Saving..." : "Record Transaction"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mb-4"><Trash2 className="w-6 h-6 text-rose-600" /></div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Deactivate Bank Account?</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Deactivate <span className="font-semibold">{deleteTarget.accountName}</span> at {deleteTarget.bankName}? Transaction history will be preserved.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteTarget(null)} disabled={saving} className="px-5 py-2.5 border border-slate-200 text-sm font-semibold rounded-lg">Cancel</button>
              <button onClick={deleteAccount} disabled={saving} className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 flex items-center gap-2"><Trash2 className="w-4 h-4" />{saving ? "Deactivating..." : "Deactivate"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
