"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, FileText, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function EditInvoicePage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    invoiceNumber: "",
    poId: "",
    supplierId: "",
    invoiceDate: "",
    dueDate: "",
    paymentTerms: "Net 30",
    notes: "",
    items: [] as any[],
  });

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/purchase-invoices/${params.id}`);
      if (!res.ok) throw new Error("Failed to load invoice");
      const json = await res.json();
      const inv = json.invoice;
      setFormData({
        invoiceNumber: inv.invoiceNumber || "",
        poId: inv.poId || "",
        supplierId: inv.supplierId || "",
        invoiceDate: inv.invoiceDate ? inv.invoiceDate.split("T")[0] : new Date().toISOString().split("T")[0],
        dueDate: inv.dueDate ? inv.dueDate.split("T")[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        paymentTerms: inv.notes?.split("Payment Terms: ")[1]?.split(".")[0] || "Net 30",
        notes: inv.notes || "",
        items: inv.items || [],
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch invoice details");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || !formData.poId || !formData.invoiceNumber || formData.items.length === 0) {
      toast.error("Supplier, PO, Invoice Number, and items are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        items: formData.items.map((item: any) => ({
          ...item,
          invoiceQuantity: item.quantity,
          invoiceUnitPrice: item.unitPrice,
        })),
      };

      const res = await fetch(`/api/purchase-invoices/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update invoice");
      }

      toast.success("Invoice updated successfully");
      router.push(`/purchase-invoices/${params.id}`);
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
        <p className="mt-4 text-sm text-slate-500">Loading invoice...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/purchase-invoices/${params.id}`}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {formData.invoiceNumber}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Invoice</h1>
            </div>
            <p className="text-sm text-slate-500">Update invoice details and reconcile with PO</p>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800 dark:text-amber-300">
          <p className="font-bold">Three-Way Matching</p>
          <p className="text-xs mt-0.5 text-amber-700 dark:text-amber-400">
            This invoice will be matched against the Purchase Order and Goods Received Note for reconciliation.
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Invoice Number *
              </label>
              <input
                type="text"
                required
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Purchase Order *
              </label>
              <input
                type="text"
                value={formData.poId}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Supplier *
              </label>
              <input
                type="text"
                value={formData.supplierId}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Payment Terms
              </label>
              <input
                type="text"
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-3">
                Invoice Items
              </h3>
              <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800">
                    <tr>
                      <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 dark:text-slate-400">Item Code</th>
                      <th className="px-4 py-2 text-left font-semibold text-xs text-slate-600 dark:text-slate-400">Description</th>
                      <th className="px-4 py-2 text-center font-semibold text-xs text-slate-600 dark:text-slate-400">Qty</th>
                      <th className="px-4 py-2 text-right font-semibold text-xs text-slate-600 dark:text-slate-400">Unit Price</th>
                      <th className="px-4 py-2 text-right font-semibold text-xs text-slate-600 dark:text-slate-400">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {formData.items.map((item: any, idx: number) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-mono text-xs">{item.itemCode}</td>
                        <td className="px-4 py-2 text-slate-700 dark:text-slate-300">{item.itemName}</td>
                        <td className="px-4 py-2 text-center font-mono text-xs">{item.quantity}</td>
                        <td className="px-4 py-2 text-right font-mono text-xs">{item.unitPrice}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.total}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Note: Items are locked from the original invoice. To change items, create a new invoice.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/purchase-invoices/${params.id}`}
            className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-100 transition-colors"
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
