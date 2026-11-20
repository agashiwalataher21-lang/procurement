"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  FileText,
  DollarSign,
  Building,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Plus,
  Eye
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/purchase-invoices/${params.id}`);
      if (!res.ok) throw new Error("Invoice not found");
      const json = await res.json();
      setInvoice(json.invoice);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load invoice");
      router.push("/purchase-invoices");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
          <div className="w-6 h-6 border-3 border-blue-300 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-sm text-slate-500 font-medium">Loading invoice...</p>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="p-16 text-center">
        <AlertCircle className="w-16 h-16 text-slate-300 dark:text-slate-700 mx-auto mb-4" />
        <p className="text-slate-600 dark:text-slate-400 font-medium">Invoice not found</p>
        <Link href="/purchase-invoices" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          Return to invoices
        </Link>
      </div>
    );
  }

  const balance = invoice.grandTotal - invoice.paidAmount;
  const isPaid = balance < 0.01;
  const isOverdue = new Date(invoice.dueDate) < new Date() && !isPaid;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div className="flex items-center gap-4">
          <Link
            href="/purchase-invoices"
            className="p-2.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-6 h-6 text-blue-600" />
              {invoice.invoiceNumber}
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">Purchase Invoice • {formatDate(invoice.invoiceDate)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {balance > 0.01 && (
            <Link
              href={`/payments/new?invoiceId=${invoice.id}`}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white rounded-lg text-sm font-bold shadow-sm transition-all"
            >
              <DollarSign className="w-4 h-4" />
              Pay {formatCurrency(balance)}
            </Link>
          )}

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-bold shadow-sm transition-all dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
        </div>
      </div>

      {/* Alert if Overdue */}
      {isOverdue && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 rounded-xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-rose-800 dark:text-rose-200">Invoice Overdue</p>
            <p className="text-sm text-rose-700 dark:text-rose-300">This invoice was due on {formatDate(invoice.dueDate)} and has not been paid in full.</p>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden print:shadow-none print:border-none">
        <div className="p-8 space-y-8">
          {/* Header Section */}
          <div className="border-b border-slate-200 dark:border-slate-800 pb-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                  BAIT AL HADAF
                </h2>
                <p className="text-sm text-slate-500 mt-1">General Trading L.L.C. • Dubai, UAE</p>
                <p className="text-xs text-slate-400 mt-0.5">TRN: 100458928300003</p>
              </div>
              <div className="text-right space-y-2">
                <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg inline-block">
                  <p className="text-xs font-bold uppercase tracking-wider">VENDOR INVOICE</p>
                </div>
                <div>
                  <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white">
                    {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Inv Date: {formatDate(invoice.invoiceDate)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Supplier & PO Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 dark:bg-blue-950/30 p-5 rounded-lg border border-blue-200 dark:border-blue-800/50">
              <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-2">Supplier / Vendor</p>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{invoice.supplier.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 font-mono">{invoice.supplier.supplierId}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">TRN: {invoice.supplier.trn || "—"}</p>
            </div>

            <div className="bg-purple-50 dark:bg-purple-950/30 p-5 rounded-lg border border-purple-200 dark:border-purple-800/50">
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider mb-2">Purchase Order</p>
              <Link
                href={`/purchase-orders/${invoice.purchaseOrder.id}`}
                className="text-lg font-bold font-mono text-blue-600 hover:text-blue-700 dark:hover:text-blue-400"
              >
                {invoice.purchaseOrder.poNumber}
              </Link>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                Payment Terms: {invoice.notes?.split("Payment Terms: ")[1]?.split(".")[0] || "Net 30"}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Due: {formatDate(invoice.dueDate)}</p>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-2">Currency & Rate</p>
              <p className="text-lg font-black font-mono text-slate-900 dark:text-white">{invoice.currency || "AED"}</p>
              {invoice.currency && invoice.currency !== "AED" ? (
                <>
                  <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                    1 {invoice.currency} = {invoice.exchangeRate} AED
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    AED Equiv: {formatCurrency(invoice.grandTotal * (invoice.exchangeRate || 1), "AED")}
                  </p>
                </>
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Base Currency (1.0000)</p>
              )}
            </div>
          </div>

          {/* Line Items */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Line Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 dark:border-slate-800">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase">Item Code</th>
                    <th className="px-4 py-3 text-left font-bold text-xs uppercase">Description</th>
                    <th className="px-4 py-3 text-center font-bold text-xs uppercase">Qty</th>
                    <th className="px-4 py-3 text-right font-bold text-xs uppercase">Unit Price ({invoice.currency || "AED"})</th>
                    <th className="px-4 py-3 text-right font-bold text-xs uppercase">Total ({invoice.currency || "AED"})</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {invoice.items.map((item: any, idx: number) => (
                    <tr key={idx} className={item.isExtraFromPo ? "bg-amber-50 dark:bg-amber-950/20" : ""}>
                      <td className="px-4 py-3 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {item.isExtraFromPo ? "EXTRA" : item.itemCode}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900 dark:text-white">
                        {item.itemName}
                        {item.isExtraFromPo && (
                          <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-200 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300">
                            Extra Charge
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900 dark:text-white">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {formatCurrency(item.unitPrice, invoice.currency)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.total, invoice.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-200 dark:border-slate-800">
            {/* Payment Status */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Payment Status</h4>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Invoice Total ({invoice.currency || "AED"}):</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Amount Paid ({invoice.currency || "AED"}):</span>
                  <span className="font-mono font-bold text-emerald-600">{formatCurrency(invoice.paidAmount, invoice.currency)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">Remaining Balance:</span>
                  <span className={`font-mono font-bold text-lg ${isPaid ? "text-emerald-600" : "text-rose-600"}`}>
                    {formatCurrency(Math.max(0, balance), invoice.currency)}
                  </span>
                </div>
                {invoice.currency && invoice.currency !== "AED" && (
                  <div className="pt-1 flex justify-between items-center text-xs font-semibold text-slate-500">
                    <span>AED Remaining:</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(Math.max(0, balance) * (invoice.exchangeRate || 1), "AED")}
                    </span>
                  </div>
                )}
                {isPaid && (
                  <div className="flex items-center gap-2 pt-2 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-sm font-bold">Fully Paid</span>
                  </div>
                )}
              </div>
            </div>

            {/* Invoice Totals */}
            <div className="space-y-3 text-right">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(invoice.subtotal, invoice.currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>VAT (5%):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(invoice.vatAmount, invoice.currency)}
                </span>
              </div>
              <div className="pt-2 border-t-2 border-slate-900 dark:border-slate-700 flex justify-between items-center">
                <span className="text-lg font-black text-slate-900 dark:text-white">Total Payable ({invoice.currency || "AED"}):</span>
                <span className="font-mono text-2xl font-black text-blue-600">{formatCurrency(invoice.grandTotal, invoice.currency)}</span>
              </div>
              {invoice.currency && invoice.currency !== "AED" && (
                <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                  <span>AED Equivalent (Base @ {invoice.exchangeRate}):</span>
                  <span className="font-mono text-base">{formatCurrency(invoice.grandTotal * (invoice.exchangeRate || 1), "AED")}</span>
                </div>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">Remarks</p>
              <p className="text-sm text-slate-700 dark:text-slate-300">{invoice.notes}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}