"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Search,
  Download,
  FileText,
  DollarSign,
  CreditCard,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  RefreshCw,
} from "lucide-react";

interface SalesInvoiceItem {
  id: string;
  itemCode: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
  total: number;
  productId?: string | null;
}

interface SalesInvoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerPhone?: string | null;
  customerEmail?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  currency: string;
  subtotal: number;
  discountAmount: number;
  vatAmount: number;
  grandTotal: number;
  status: string;
  source?: string | null;
  sourceId?: string | null;
  notes?: string | null;
  createdBy: string;
  createdAt: string;
  items: SalesInvoiceItem[];
  payments: { id: string; amount: number; status: string }[];
  paidAmount: number;
  balance: number;
}

interface Summary {
  totalInvoices: number;
  totalSales: number;
  totalPaid: number;
  totalBalance: number;
}

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700",
  ISSUED: "bg-blue-100 text-blue-700",
  PARTIALLY_PAID: "bg-amber-100 text-amber-700",
  PAID: "bg-emerald-100 text-emerald-700",
  OVERDUE: "bg-red-100 text-red-700",
  CANCELLED: "bg-red-100 text-red-500",
};

export default function SalesInvoicesPage() {
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [summary, setSummary] = useState<Summary>({ totalInvoices: 0, totalSales: 0, totalPaid: 0, totalBalance: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [customerFilter, setCustomerFilter] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // New invoice form state
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    dueDate: "",
    notes: "",
    vatRate: 5,
    discountAmount: 0,
    items: [{ itemCode: "", itemName: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
  });

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (customerFilter) params.set("customer", customerFilter);

      const res = await fetch(`/api/sales-invoices?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to load sales invoices");
      const data = await res.json();
      setInvoices(data.invoices || []);
      setSummary(data.summary || { totalInvoices: 0, totalSales: 0, totalPaid: 0, totalBalance: 0 });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const addItemRow = () => {
    setForm((f) => ({
      ...f,
      items: [...f.items, { itemCode: "", itemName: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
    }));
  };

  const removeItemRow = (idx: number) => {
    setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setForm((f) => ({
      ...f,
      items: f.items.map((it, i) => (i === idx ? { ...it, [field]: value } : it)),
    }));
  };

  const computeFormTotals = () => {
    const subtotal = form.items.reduce((s, it) => {
      const line = Math.max(0, it.quantity * it.unitPrice - it.discount + it.tax);
      return s + line;
    }, 0);
    const disc = parseFloat(String(form.discountAmount)) || 0;
    const principal = Math.max(0, subtotal - disc);
    const vat = Math.round(principal * (form.vatRate / 100) * 100) / 100;
    const grand = principal + vat;
    return { subtotal, principal, vat, grand };
  };

  const submitInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");
    try {
      const res = await fetch("/api/sales-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone || undefined,
          customerEmail: form.customerEmail || undefined,
          invoiceDate: form.invoiceDate,
          dueDate: form.dueDate || undefined,
          notes: form.notes || undefined,
          vatRate: form.vatRate,
          discountAmount: form.discountAmount,
          items: form.items.map((it) => ({
            itemCode: it.itemCode || undefined,
            itemName: it.itemName,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: it.discount || 0,
            tax: it.tax || 0,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to create invoice");
        return;
      }
      setSuccessMsg(`Invoice ${data.invoice.invoiceNumber} created successfully`);
      setShowNewModal(false);
      setForm({
        customerName: "",
        customerPhone: "",
        customerEmail: "",
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: "",
        notes: "",
        vatRate: 5,
        discountAmount: 0,
        items: [{ itemCode: "", itemName: "", quantity: 1, unitPrice: 0, discount: 0, tax: 0 }],
      });
      fetchInvoices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const totals = computeFormTotals();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sales Invoices</h1>
          <p className="text-sm text-slate-500 mt-1">
            Revenue recognition · AED · UAE VAT 5%
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchInvoices}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            New Sales Invoice
          </button>
        </div>
      </div>

      {/* Success / Error banners */}
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

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Invoices</span>
            <FileText className="w-5 h-5 text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">{summary.totalInvoices}</div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Total Sales</span>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            AED {summary.totalSales.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Collected</span>
            <CreditCard className="w-5 h-5 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            AED {summary.totalPaid.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">Outstanding</span>
            <DollarSign className="w-5 h-5 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-800">
            AED {summary.totalBalance.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 shadow-sm flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
            placeholder="Search invoice # or customer…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="ISSUED">Issued</option>
          <option value="PARTIALLY_PAID">Partially Paid</option>
          <option value="PAID">Paid</option>
          <option value="OVERDUE">Overdue</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <input
          value={customerFilter}
          onChange={(e) => setCustomerFilter(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchInvoices()}
          placeholder="Customer name…"
          className="px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={fetchInvoices}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Apply
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left">
                <th className="px-4 py-3 font-semibold text-slate-600">Invoice #</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Date</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Customer</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Items</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Total (AED)</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Paid</th>
                <th className="px-4 py-3 font-semibold text-slate-600 text-right">Balance</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Status</th>
                <th className="px-4 py-3 font-semibold text-slate-600">Source</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading sales invoices…
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-slate-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                    No sales invoices found.
                    <div className="mt-2">
                      <button
                        onClick={() => setShowNewModal(true)}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                      >
                        Create your first sales invoice →
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-800">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(inv.invoiceDate).toLocaleDateString("en-AE")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-800">{inv.customerName}</div>
                      {inv.customerPhone && (
                        <div className="text-xs text-slate-400">{inv.customerPhone}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600">{inv.items.length}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-800">
                      {inv.grandTotal.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600">
                      {inv.paidAmount.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-amber-600">
                      {inv.balance.toLocaleString("en-AE", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          STATUS_COLORS[inv.status] || "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {inv.status === "PAID" && <CheckCircle className="w-3 h-3" />}
                        {inv.status === "OVERDUE" && <XCircle className="w-3 h-3" />}
                        {inv.status === "ISSUED" && <Clock className="w-3 h-3" />}
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {inv.source ? (
                        <span className="text-xs px-2 py-0.5 rounded bg-purple-50 text-purple-600 font-medium">
                          {inv.source}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Invoice Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">New Sales Invoice</h2>
              <button
                onClick={() => setShowNewModal(false)}
                className="text-slate-400 hover:text-slate-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <form onSubmit={submitInvoice} className="p-6 space-y-5">
              {/* Customer info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Customer Name *</label>
                  <input
                    required
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. Al Maktoum Motors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Phone</label>
                  <input
                    value={form.customerPhone}
                    onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="+971 …"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                  <input
                    type="email"
                    value={form.customerEmail}
                    onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="customer@example.com"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Invoice Date</label>
                    <input
                      type="date"
                      required
                      value={form.invoiceDate}
                      onChange={(e) => setForm({ ...form, invoiceDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Due Date</label>
                    <input
                      type="date"
                      value={form.dueDate}
                      onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Line Items
                  </label>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Item
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs text-slate-500 uppercase">
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Name *</th>
                        <th className="px-3 py-2 w-20">Qty</th>
                        <th className="px-3 py-2 w-24">Price</th>
                        <th className="px-3 py-2 w-20">Disc</th>
                        <th className="px-3 py-2 w-20">VAT</th>
                        <th className="px-3 py-2 w-24 text-right">Total</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {form.items.map((it, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2">
                            <input
                              value={it.itemCode}
                              onChange={(e) => updateItem(idx, "itemCode", e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="SKU"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              required
                              value={it.itemName}
                              onChange={(e) => updateItem(idx, "itemName", e.target.value)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                              placeholder="Item name"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.quantity}
                              onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.unitPrice}
                              onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.discount}
                              onChange={(e) => updateItem(idx, "discount", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={it.tax}
                              onChange={(e) => updateItem(idx, "tax", parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {(it.quantity * it.unitPrice - it.discount + it.tax).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <button
                              type="button"
                              onClick={() => removeItemRow(idx)}
                              disabled={form.items.length === 1}
                              className="text-red-400 hover:text-red-600 disabled:opacity-30"
                            >
                              ×
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1">Notes</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Optional notes…"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-24">VAT Rate %</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={form.vatRate}
                      onChange={(e) => setForm({ ...form, vatRate: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-medium text-slate-500 w-24">Discount AED</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={form.discountAmount}
                      onChange={(e) => setForm({ ...form, discountAmount: parseFloat(e.target.value) || 0 })}
                      className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1">
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>Subtotal</span>
                      <span>AED {totals.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-slate-500">
                      <span>VAT ({form.vatRate}%)</span>
                      <span>AED {totals.vat.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold text-slate-800 pt-1">
                      <span>Grand Total</span>
                      <span>AED {totals.grand.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  Create Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
