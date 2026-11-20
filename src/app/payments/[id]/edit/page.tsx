"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, CreditCard, AlertCircle, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function EditPaymentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: "",
    paymentTarget: "PO" as "PO" | "INVOICE",
    poId: "" as string | null,
    invoiceId: "" as string | null,
    amount: "",
    currency: "AED",
    paymentMethod: "BANK_TRANSFER",
    bankReference: "",
    paymentDate: "",
    notes: "",
    recordedBy: "",
    status: "APPROVED",
  });
  const [selectedPoDetails, setSelectedPoDetails] = useState<any>(null);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchPayment();
      fetchOptions();
    }
  }, [params.id]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/payments/${params.id}`);
      if (!res.ok) throw new Error("Failed to load payment");
      const json = await res.json();
      const p = json.payment;
      setFormData({
        supplierId: p.supplierId || "",
        paymentTarget: p.poId ? "PO" : p.invoiceId ? "INVOICE" : "PO",
        poId: p.poId || "",
        invoiceId: p.invoiceId || "",
        amount: p.amount.toString(),
        currency: p.currency || "AED",
        paymentMethod: p.paymentMethod || "BANK_TRANSFER",
        bankReference: p.bankReference || "",
        paymentDate: p.paymentDate ? p.paymentDate.split("T")[0] : new Date().toISOString().split("T")[0],
        notes: p.notes || "",
        recordedBy: p.recordedBy || "Accountant",
        status: p.status || "APPROVED",
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch payment details");
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [supRes, poRes, invRes] = await Promise.all([
        fetch("/api/suppliers"),
        fetch("/api/purchase-orders"),
        fetch("/api/purchase-invoices"),
      ]);
      const supData = await supRes.json();
      const poData = await poRes.json();
      const invData = await invRes.json();
      setSuppliers(supData.suppliers || []);
      setPurchaseOrders(poData.purchaseOrders || []);
      setInvoices(invData.invoices || []);
    } catch (e) {
      console.error(e);
    }
  };

  const updatePoDetails = (poId: string) => {
    const po = purchaseOrders.find((p) => p.id === poId);
    if (po) {
      const totalPaid = po.payments
        ? po.payments.reduce((sum: number, p: any) => (p.status === "APPROVED" ? sum + p.amount : sum), 0)
        : 0;
      const remaining = Math.max(0, po.grandTotal - totalPaid);
      setSelectedPoDetails({
        poNumber: po.poNumber,
        grandTotal: po.grandTotal,
        totalPaid,
        remaining,
        currency: po.currency,
      });
    } else {
      setSelectedPoDetails(null);
    }
  };

  useEffect(() => {
    if (formData.paymentTarget === "PO" && formData.poId) {
      updatePoDetails(formData.poId);
    }
  }, [formData.poId, formData.paymentTarget, purchaseOrders]);

  // Reset PO and invoice when supplier changes
  useEffect(() => {
    if (formData.supplierId) {
      setFormData((prev) => ({ ...prev, poId: "", invoiceId: "" }));
    }
  }, [formData.supplierId]);

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
        supplierId: formData.supplierId,
        poId: formData.paymentTarget === "PO" ? formData.poId : null,
        invoiceId: formData.paymentTarget === "INVOICE" ? formData.invoiceId : null,
        amount: formData.amount,
        currency: formData.currency,
        paymentMethod: formData.paymentMethod,
        bankReference: formData.bankReference,
        paymentDate: formData.paymentDate,
        notes: formData.notes,
        recordedBy: formData.recordedBy,
        status: formData.status,
      };

      const res = await fetch(`/api/payments/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update payment");
      }

      toast.success("Payment updated successfully");
      router.push(`/payments/${params.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading payment...</p>
      </div>
    );
  }

  const supplierPOs = purchaseOrders.filter((po) => !formData.supplierId || po.supplierId === formData.supplierId);
  const supplierInvoices = invoices.filter((inv) => !formData.supplierId || inv.supplierId === formData.supplierId);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/payments/${params.id}`}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {formData.paymentTarget === "PO" && selectedPoDetails ? selectedPoDetails.poNumber : formData.invoiceId}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Payment</h1>
            </div>
            <p className="text-sm text-slate-500">Update payment details and reconcile with PO/Invoice</p>
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
                <span className="font-bold text-sm text-slate-900 dark:text-white">Advance / PO Payment</span>
                <input
                  type="radio"
                  name="paymentTarget"
                  value="PO"
                  checked={formData.paymentTarget === "PO"}
                  onChange={() => setFormData({ ...formData, paymentTarget: "PO", invoiceId: "" })}
                  className="w-4 h-4 text-blue-600"
                />
              </div>
              <span className="text-xs text-slate-500">Directly against a Purchase Order</span>
            </label>

            <label
              className={`p-4 rounded-xl border-2 cursor-pointer flex flex-col gap-1 transition-all ${
                formData.paymentTarget === "INVOICE"
                  ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900 dark:text-white">Invoice Payment</span>
                <input
                  type="radio"
                  name="paymentTarget"
                  value="INVOICE"
                  checked={formData.paymentTarget === "INVOICE"}
                  onChange={() => setFormData({ ...formData, paymentTarget: "INVOICE", poId: "" })}
                  className="w-4 h-4 text-indigo-600"
                />
              </div>
              <span className="text-xs text-slate-500">Pay against an existing confirmed purchase invoice</span>
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
                {suppliers.map((s: any) => (
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
                      {po.poNumber} — Total: {po.grandTotal.toFixed(2)} {po.currency} ({po.status})
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
                    return (
                      <option key={inv.id} value={inv.id}>
                        {inv.invoiceNumber} — Total: {inv.grandTotal.toFixed(2)} AED | Balance: {balance.toFixed(2)}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}
          </div>

          {selectedPoDetails && (
            <div className="p-4 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
                <span>Selected PO: {selectedPoDetails.poNumber}</span>
                <span>Currency: {selectedPoDetails.currency}</span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-1">
                <div>
                  <span className="text-xs text-slate-500">Total PO Value</span>
                  <p className="font-bold text-slate-800 dark:text-slate-200">{selectedPoDetails.grandTotal.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Total Previously Paid</span>
                  <p className="font-bold text-emerald-600">{selectedPoDetails.totalPaid.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Remaining Balance to Pay</span>
                  <p className="font-bold text-blue-600 text-base">{selectedPoDetails.remaining.toFixed(2)}</p>
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Payment Amount (AED) *
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

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Payment Method *
              </label>
              <select
                value={formData.paymentMethod}
                onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="BANK_TRANSFER">Bank Transfer / SWIFT</option>
                <option value="CASH">Cash</option>
                <option value="CHEQUE">Cheque</option>
                <option value="OTHER">Other</option>
              </select>
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

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/payments/${params.id}`}
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
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
