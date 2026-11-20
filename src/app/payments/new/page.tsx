"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  CreditCard,
  Building,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  FileText,
  Upload,
  Plus,
  Check
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { GLOBAL_CURRENCIES } from "@/lib/countryRules";
import { toast } from "sonner";

function NewPaymentForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPoId = searchParams.get("poId") || "";
  const preSelectedSupplierId = searchParams.get("supplierId") || "";

  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    supplierId: preSelectedSupplierId,
    paymentTarget: preSelectedPoId ? "PO" : "PO", // 'PO' | 'INVOICE' | 'DIRECT'
    poId: preSelectedPoId,
    invoiceId: "",
    amount: "",
    currency: "AED",
    paymentMethod: "BANK_TRANSFER",
    bankReference: "",
    paymentDate: new Date().toISOString().split("T")[0],
    notes: "",
    recordedBy: "Fatima Al-Zahra (Senior Accountant)",
  });

  const [selectedPoDetails, setSelectedPoDetails] = useState<any>(null);
  const [selectedInvoiceDetails, setSelectedInvoiceDetails] = useState<any>(null);

  const [paymentMethods, setPaymentMethods] = useState<string[]>([
    "BANK_TRANSFER",
    "CASH",
    "CHEQUE",
    "ONLINE_GATEWAY",
    "OTHER",
  ]);
  const [customMethod, setCustomMethod] = useState("");
  const [isAddingMethod, setIsAddingMethod] = useState(false);

  const [currenciesList, setCurrenciesList] = useState(GLOBAL_CURRENCIES);
  const [customCurrency, setCustomCurrency] = useState("");
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [supRes, poRes, invRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/purchase-orders"),
        fetch("/api/purchase-invoices").catch(() => ({ json: async () => ({ invoices: [] }) })),
      ]);

      const supData = await supRes.json();
      const poData = await poRes.json();
      const invData = await invRes.json();

      setSuppliers(supData.suppliers || []);
      setPurchaseOrders(poData.purchaseOrders || []);
      setInvoices(invData.invoices || []);

      if (!preSelectedSupplierId && supData.suppliers?.length > 0) {
        setFormData((prev) => ({ ...prev, supplierId: supData.suppliers[0].id }));
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load initial data");
    } finally {
      setLoading(false);
    }
  };

  // Update PO details when PO selection changes
  useEffect(() => {
    if (formData.poId) {
      const foundPo = purchaseOrders.find((p) => p.id === formData.poId);
      if (foundPo) {
        const totalPaid = foundPo.payments
          ? foundPo.payments.reduce((sum: number, p: any) => (p.status === "APPROVED" ? sum + p.amount : sum), 0)
          : 0;
        const remaining = Math.max(0, foundPo.grandTotal - totalPaid);
        setSelectedPoDetails({
          poNumber: foundPo.poNumber,
          grandTotal: foundPo.grandTotal,
          totalPaid,
          remaining,
          currency: foundPo.currency || "AED",
          exchangeRate: foundPo.exchangeRate || 1.0,
        });

        setFormData((prev) => ({
          ...prev,
          currency: foundPo.currency || "AED",
          supplierId: prev.supplierId || foundPo.supplierId,
        }));
      }
    } else {
      setSelectedPoDetails(null);
    }
  }, [formData.poId, purchaseOrders]);

  // Update Invoice details when Invoice selection changes (1.4 Invoice balance card)
  useEffect(() => {
    if (formData.invoiceId) {
      const foundInv = invoices.find((i) => i.id === formData.invoiceId);
      if (foundInv) {
        const grandTotal = foundInv.grandTotal || 0;
        const paidAmount = foundInv.paidAmount || 0;
        const appliedAdvance = foundInv.appliedAdvance || 0;
        const netBalance = foundInv.netBalance !== undefined ? foundInv.netBalance : Math.max(0, grandTotal - paidAmount - appliedAdvance);

        setSelectedInvoiceDetails({
          invoiceNumber: foundInv.invoiceNumber,
          grandTotal,
          paidAmount,
          appliedAdvance,
          netBalance,
          status: foundInv.status,
          currency: foundInv.currency || "AED",
          exchangeRate: foundInv.exchangeRate || 1.0,
        });

        setFormData((prev) => ({
          ...prev,
          currency: foundInv.currency || "AED",
          supplierId: prev.supplierId || foundInv.supplierId,
        }));
      }
    } else {
      setSelectedInvoiceDetails(null);
    }
  }, [formData.invoiceId, invoices]);

  // Filter POs by selected supplier
  const supplierPOs = purchaseOrders.filter(
    (po) => !formData.supplierId || po.supplierId === formData.supplierId
  );

  // Filter Invoices by selected supplier
  const supplierInvoices = invoices.filter(
    (inv) => !formData.supplierId || inv.supplierId === formData.supplierId
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    if (!formData.supplierId || isNaN(amountVal) || amountVal <= 0) {
      toast.error("Please specify a valid payment amount and supplier");
      return;
    }

    if (formData.paymentTarget === "PO" && selectedPoDetails) {
      if (amountVal > selectedPoDetails.remaining + 0.01) {
        toast.error(
          `Payment amount (${amountVal.toFixed(2)}) cannot exceed remaining PO balance (${selectedPoDetails.remaining.toFixed(2)})`
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        poId: formData.paymentTarget === "PO" ? formData.poId : null,
        invoiceId: formData.paymentTarget === "INVOICE" ? formData.invoiceId : null,
      };

      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record payment");

      toast.success(`Payment voucher ${data.payment.paymentNumber} created successfully!`);
      router.push(`/payments/${data.payment.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/payments"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Record Payment</h1>
            <p className="text-sm text-slate-500">
              Disburse advance payments against Purchase Orders or settle verified purchase invoices
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Payment Target & Supplier Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Payment Target & Balance Tracking
            </h2>
          </div>

          {/* Payment Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <label
              className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                formData.paymentTarget === "PO"
                  ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Advance / PO Payment
                </span>
                <input
                  type="radio"
                  name="paymentTarget"
                  value="PO"
                  checked={formData.paymentTarget === "PO"}
                  onChange={() => setFormData({ ...formData, paymentTarget: "PO" })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <span className="text-xs text-slate-500">
                Directly against a Purchase Order (even before goods arrival or final invoice)
              </span>
            </label>

            <label
              className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                formData.paymentTarget === "INVOICE"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  Invoice Payment
                </span>
                <input
                  type="radio"
                  name="paymentTarget"
                  value="INVOICE"
                  checked={formData.paymentTarget === "INVOICE"}
                  onChange={() => setFormData({ ...formData, paymentTarget: "INVOICE" })}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <span className="text-xs text-slate-500">
                Pay against an existing confirmed purchase invoice
              </span>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Supplier *
              </label>
              <select
                required
                value={formData.supplierId}
                onChange={(e) => setFormData({ ...formData, supplierId: e.target.value, poId: "", invoiceId: "" })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select supplier...</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.supplierId})
                  </option>
                ))}
              </select>
            </div>

            {formData.paymentTarget === "PO" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Target Purchase Order *
                </label>
                <select
                  required
                  value={formData.poId}
                  onChange={(e) => setFormData({ ...formData, poId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="">Select approved Purchase Order...</option>
                  {supplierPOs.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — Total: {formatCurrency(po.grandTotal, po.currency)} ({po.status})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {formData.paymentTarget === "INVOICE" && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Target Invoice *
                </label>
                <select
                  required
                  value={formData.invoiceId}
                  onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  <option value="">Select confirmed invoice...</option>
                  {supplierInvoices.map((inv) => {
                    const balance = inv.grandTotal - inv.paidAmount;
                    const curr = inv.currency || "AED";
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — Total: {formatCurrency(inv.grandTotal, curr)} | Balance: {formatCurrency(balance, curr)}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {/* Real-time PO Balance Card */}
          {selectedPoDetails && (
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                <span>Selected PO: {selectedPoDetails.poNumber}</span>
                <span>Currency: {selectedPoDetails.currency}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500">Total PO Value</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedPoDetails.grandTotal, selectedPoDetails.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Total Previously Paid</span>
                  <p className="font-bold text-emerald-600">
                    {formatCurrency(selectedPoDetails.totalPaid, selectedPoDetails.currency)}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Remaining Balance to Pay</span>
                  <p className="font-bold text-blue-600 text-base">
                    {formatCurrency(selectedPoDetails.remaining, selectedPoDetails.currency)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Real-time Invoice Balance Card (1.4 / 2.8) */}
          {selectedInvoiceDetails && (
            <div className="p-4 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                <span>Selected Invoice: {selectedInvoiceDetails.invoiceNumber}</span>
                <span>Status: {selectedInvoiceDetails.status}</span>
              </div>
              <div className="grid grid-cols-4 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500">Total Invoice ({selectedInvoiceDetails.currency || "AED"})</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrency(selectedInvoiceDetails.grandTotal, selectedInvoiceDetails.currency || "AED")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">PO Advance Applied</span>
                  <p className="font-bold text-amber-600">
                    {formatCurrency(selectedInvoiceDetails.appliedAdvance, selectedInvoiceDetails.currency || "AED")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Direct Paid</span>
                  <p className="font-bold text-emerald-600">
                    {formatCurrency(selectedInvoiceDetails.paidAmount, selectedInvoiceDetails.currency || "AED")}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Net Due to Pay</span>
                  <p className="font-bold text-indigo-600 text-base">
                    {formatCurrency(selectedInvoiceDetails.netBalance, selectedInvoiceDetails.currency || "AED")}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Amount & Transaction Details */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Disbursement Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Payment Amount ({formData.currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-lg font-bold text-emerald-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Currency with + Add option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Currency *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCurrency(!isAddingCurrency)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingCurrency ? "Cancel" : "+ Add"}
                </button>
              </div>

              {!isAddingCurrency ? (
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingCurrency(true);
                    } else {
                      setFormData({ ...formData, currency: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {currenciesList.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add Currency...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                    placeholder="e.g. INR"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const code = customCurrency.trim().toUpperCase();
                      if (!code) return;
                      if (!currenciesList.some((c) => c.code === code)) {
                        setCurrenciesList((prev) => [{ code, name: `Custom (${code})`, symbol: code }, ...prev]);
                      }
                      setFormData({ ...formData, currency: code });
                      setCustomCurrency("");
                      setIsAddingCurrency(false);
                      toast.success(`Currency ${code} set!`);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Payment Method with + Add option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Payment Method *
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingMethod(!isAddingMethod)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingMethod ? "Cancel" : "+ Add"}
                </button>
              </div>

              {!isAddingMethod ? (
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingMethod(true);
                    } else {
                      setFormData({ ...formData, paymentMethod: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {paymentMethods.map((m) => (
                    <option key={m} value={m}>
                      {m.replace(/_/g, " ")}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add Custom Method...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customMethod}
                    onChange={(e) => setCustomMethod(e.target.value.toUpperCase().replace(/\s+/g, "_"))}
                    placeholder="e.g. UPI, CARD"
                    className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const m = customMethod.trim().toUpperCase().replace(/\s+/g, "_");
                      if (!m) return;
                      if (!paymentMethods.includes(m)) {
                        setPaymentMethods((prev) => [m, ...prev]);
                      }
                      setFormData({ ...formData, paymentMethod: m });
                      setCustomMethod("");
                      setIsAddingMethod(false);
                      toast.success(`Payment method ${m} added!`);
                    }}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Payment Date *
              </label>
              <input
                type="date"
                required
                value={formData.paymentDate}
                onChange={(e) => setFormData({ ...formData, paymentDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Bank Reference / Cheque No
              </label>
              <input
                type="text"
                value={formData.bankReference}
                onChange={(e) => setFormData({ ...formData, bankReference: e.target.value })}
                placeholder="e.g. FT26034989201, CHQ-99120"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Recorded By
              </label>
              <input
                type="text"
                value={formData.recordedBy}
                onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Notes & Remittance Details
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Bank debit advice reference, payment purpose, proforma invoice ref..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/payments"
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Recording..." : "Confirm & Record Payment"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPaymentPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading payment form...</div>}>
      <NewPaymentForm />
    </Suspense>
  );
}
