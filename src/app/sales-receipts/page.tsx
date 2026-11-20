"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  HandCoins,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Banknote,
  CreditCard,
  Landmark,
} from "lucide-react";

interface SalesReceipt {
  id: string;
  receiptNumber: string;
  salesInvoiceId?: string | null;
  salesInvoice?: { invoiceNumber: string; grandTotal: number } | null;
  customerName: string;
  receiptDate: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  bankReference?: string | null;
  notes?: string | null;
  status: string;
  recordedBy: string;
}

export default function SalesReceiptsPage() {
  const [receipts, setReceipts] = useState<SalesReceipt[]>([]);
  const [invoices, setInvoices] = useState<{ id: string; invoiceNumber: string; customerName: string; grandTotal: number; balance: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    salesInvoiceId: "",
    customerName: "",
    amount: "",
    receiptDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    bankReference: "",
    notes: "",
  });

  const fetchReceipts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sales-receipts");
      if (!res.ok) throw new Error("Failed to load receipts");
      const data = await res.json();
      setReceipts(data.receipts || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvoices = async () => {
    try {
      const res = await fetch("/api/sales-invoices?status=ISSUED");
      const data = await res.json();
      setInvoices(
        (data.invoices || []).map((i: any) => ({
          id: i.id,
          invoiceNumber: i.invoiceNumber,
          customerName: i.customerName,
          grandTotal: i.grandTotal,
          balance: i.balance ?? i.grandTotal - i.paidAmount,
        }))
      );
    } catch {
      // non-fatal
    }
  };

  useEffect(() => {
    fetchReceipts();
    fetchInvoices();
  }, []);

  const selectedInvoice = invoices.find((i) => i.id === form.salesInvoiceId);

  const submitReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/sales-receipts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salesInvoiceId: form.salesInvoiceId || undefined,
          customerName: form.customerName || selectedInvoice?.customerName || "Walk-in Customer",
          amount: parseFloat(form.amount),
          receiptDate: form.receiptDate,
          paymentMethod: form.paymentMethod,
          bankReference: form.bankReference || undefined,
          notes: form.notes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to record receipt");
        return;
      }
      setSuccessMsg(`Receipt ${data.receipt.receiptNumber} recorded`);
      setShowModal(false);
      setForm({
        salesInvoiceId: "",
        customerName: "",
        amount: "",
        receiptDate: new Date().toISOString().split("T")[0],
        paymentMethod: "CASH",
        bankReference: "",
        notes: "",
      });
      fetchReceipts();
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const filtered = receipts.filter((r) => {
    const q = search.toLowerCase();
    return (
      r.receiptNumber.toLowerCase().includes(q) ||
      r.customerName.toLowerCase().includes(q) ||
      (r.salesInvoice?.invoiceNumber || "").toLowerCase().includes(q)
    );
  });

  const totalCollected = filtered.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Receipts</h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer payments · Applied against sales invoices · Dr Bank / Cr AR
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchReceipts}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Record Receipt
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4" /> {successMsg}
          <button onClick={() => setSuccessMsg("")} className="ml-auto text-emerald-400 hover:text-emerald-600">×</button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
          <button onClick={() => setError("")} className="ml-auto text-red-400 hover:text-red-600">×</button>
        </div>
      )}

      {/* KPI */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Receipts</span>
            <HandCoins className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{filtered.length}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Collected</span>
            <Banknote className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            AED {totalCollected.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Open Invoices</span>
            <Landmark className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{invoices.length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search receipt #, customer or invoice…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Receipt #</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Invoice</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Method</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Amount (AED)</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading receipts…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <HandCoins className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    No sales receipts yet.
                    <div className="mt-2">
                      <button
                        onClick={() => setShowModal(true)}
                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Record your first receipt →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{r.receiptNumber}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(r.receiptDate).toLocaleDateString("en-AE")}
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">{r.customerName}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {r.salesInvoice?.invoiceNumber || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600">
                        {r.paymentMethod === "CASH" ? (
                          <Banknote className="w-3 h-3" />
                        ) : (
                          <CreditCard className="w-3 h-3" />
                        )}
                        {r.paymentMethod}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-600">
                      {r.amount.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          r.status === "APPROVED"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Receipt Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Record Sales Receipt</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitReceipt} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">
                  Apply to Invoice (optional)
                </label>
                <select
                  value={form.salesInvoiceId}
                  onChange={(e) => {
                    setForm({ ...form, salesInvoiceId: e.target.value, customerName: "" });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">— Cash sale / no invoice —</option>
                  {invoices.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.invoiceNumber} · {i.customerName} · Balance AED {i.balance.toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name *</label>
                <input
                  required
                  value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  placeholder={selectedInvoice?.customerName || "Customer name"}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Amount (AED) *</label>
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Receipt Date</label>
                  <input
                    type="date"
                    required
                    value={form.receiptDate}
                    onChange={(e) => setForm({ ...form, receiptDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Payment Method</label>
                  <select
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                    <option value="CARD">Card</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Bank Reference</label>
                  <input
                    value={form.bankReference}
                    onChange={(e) => setForm({ ...form, bankReference: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {selectedInvoice && (
                <div className="p-3 bg-slate-50 rounded-lg text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Invoice balance</span>
                    <span>AED {selectedInvoice.balance.toFixed(2)}</span>
                  </div>
                  {parseFloat(form.amount) > selectedInvoice.balance + 0.01 && (
                    <div className="mt-1 text-red-600 text-xs">
                      Amount exceeds remaining balance — will be rejected.
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="Optional notes…"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                >
                  Record Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
