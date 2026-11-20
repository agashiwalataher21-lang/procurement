"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Download,
  Printer,
  Edit,
  CreditCard,
  Truck,
  FileText,
  Calendar,
  Users,
  DollarSign,
  Package,
  Percent
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PurchaseOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionSubmitting, setActionSubmitting] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPO();
    }
  }, [params.id]);

  const fetchPO = async () => {
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}`);
      if (!res.ok) throw new Error("Failed to load PO");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load purchase order");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    setActionSubmitting(true);
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to update status");
      toast.success(`PO status changed to ${newStatus}`);
      fetchPO();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setActionSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading purchase order details...</p>
      </div>
    );
  }

  if (!data || !data.purchaseOrder) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">Purchase order not found</p>
        <Link href="/purchase-orders" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          Return to purchase orders
        </Link>
      </div>
    );
  }

  const po = data.purchaseOrder;
  const tracking = data.tracking;

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link
            href="/purchase-orders"
            className="mt-1 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-white bg-blue-600 px-2 py-0.5 rounded">
                {po.poNumber}
              </span>
              <span
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                  po.status === "APPROVED"
                    ? "bg-blue-100 text-blue-700"
                    : po.status === "PENDING_APPROVAL"
                    ? "bg-amber-100 text-amber-700"
                    : po.status === "FULLY_RECEIVED"
                    ? "bg-emerald-100 text-emerald-700"
                    : po.status === "PARTIALLY_RECEIVED"
                    ? "bg-purple-100 text-purple-700"
                    : "bg-slate-100 text-slate-700"
                }`}
              >
                {po.status.replace("_", " ")}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {po.supplier.name}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Ordered {formatDate(po.orderDate)} • Expected delivery {formatDate(po.expectedDeliveryDate)}
            </p>
          </div>
        </div>

        {/* Bill status banner */}
        {po.invoices && (
          <div className={`rounded-xl border px-4 py-3 flex items-center gap-2 text-sm font-semibold ${
            po.invoices.length === 0
              ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
              : "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
          }`}>
            {po.invoices.length === 0 ? (
              <>
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Bill Not Made — no invoice has been recorded against this PO yet.</span>
                <Link href={`/purchase-invoices/new?poId=${po.id}`} className="ml-auto px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors">
                  Convert to Bill
                </Link>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{po.invoices.length} bill(s) recorded against this PO.</span>
                <Link href={`/purchase-invoices/new?poId=${po.id}`} className="ml-auto px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors">
                  Create Another Bill
                </Link>
              </>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end">
          {po.status === "PENDING_APPROVAL" && (
            <>
              <button
                onClick={() => handleStatusChange("APPROVED")}
                disabled={actionSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve
              </button>
              <button
                onClick={() => handleStatusChange("CANCELLED")}
                disabled={actionSubmitting}
                className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" />
                Reject
              </button>
            </>
          )}

          {po.status === "APPROVED" && (
            <Link
              href={`/grn/new?poId=${po.id}`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
            >
              <Truck className="w-4 h-4" />
              Receive Goods
            </Link>
          )}

          {["APPROVED", "PARTIALLY_RECEIVED", "FULLY_RECEIVED"].includes(po.status) && (
            <>
              <Link
                href={`/purchase-invoices/new?poId=${po.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
              >
                <FileText className="w-4 h-4" />
                Convert to Bill
              </Link>
              <Link
                href={`/payments/new?poId=${po.id}&supplierId=${po.supplierId}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
              >
                <CreditCard className="w-4 h-4" />
                Record Payment
              </Link>
            </>
          )}

          <Link
            href={`/purchase-orders/${po.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Link>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>

          <button
            className="flex items-center gap-2 px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Delivery & Payment Tracking Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500 uppercase">Days Since Order</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{tracking.daysSinceOrder}</p>
          {tracking.daysOverdue > 0 && (
            <p className="text-xs text-rose-600 font-bold mt-1">{tracking.daysOverdue} days overdue ⚠️</p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500 uppercase">PO Total Value</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(po.grandTotal, po.currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500 uppercase">Amount Paid</p>
          <p className="text-2xl font-bold text-emerald-600 mt-1">
            {formatCurrency(tracking.totalPaid, po.currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500 uppercase">Outstanding Balance</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {formatCurrency(tracking.poBalance, po.currency)}
          </p>
        </div>
      </div>

      {/* PO Line Items Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <h2 className="font-bold text-slate-900 dark:text-white">Order Items & Delivery Status</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
              <tr>
                <th className="px-6 py-3">Item Code</th>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">Ordered Qty</th>
                <th className="px-6 py-3">Received Qty</th>
                <th className="px-6 py-3">Pending Qty</th>
                <th className="px-6 py-3">Unit Price</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3 text-right">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {po.items.map((item: any) => {
                const progress = item.quantity > 0 ? (item.receivedQty / item.quantity) * 100 : 0;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600">{item.itemCode}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 dark:text-white">{item.itemName}</td>
                    <td className="px-6 py-4 font-mono font-bold">{item.quantity}</td>
                    <td className="px-6 py-4 font-mono font-bold text-emerald-600">{item.receivedQty}</td>
                    <td className="px-6 py-4 font-mono font-bold text-amber-600">{item.quantity - item.receivedQty}</td>
                    <td className="px-6 py-4 font-semibold">{formatCurrency(item.unitPrice, po.currency)}</td>
                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">{formatCurrency(item.total, po.currency)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="w-24 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all"
                          style={{ width: `${Math.min(100, progress)}%` }}
                        />
                      </div>
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400 mt-1 block">
                        {Math.round(progress)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Summary & Charges */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Calculations */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-3">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Order Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono">{formatCurrency(po.subtotal, po.currency)}</span>
            </div>
            {po.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Discount Applied</span>
                <span className="font-mono">-{formatCurrency(po.discountAmount, po.currency)}</span>
              </div>
            )}
            {po.shippingAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping & Freight</span>
                <span className="font-mono">{formatCurrency(po.shippingAmount, po.currency)}</span>
              </div>
            )}
            {po.otherExpensesAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Other Expenses</span>
                <span className="font-mono">{formatCurrency(po.otherExpensesAmount, po.currency)}</span>
              </div>
            )}
            {po.vatAmount > 0 && (
              <div className="flex justify-between text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-2">
                <span>VAT (5%)</span>
                <span className="font-mono">{formatCurrency(po.vatAmount, po.currency)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg text-slate-900 dark:text-white border-t border-slate-200 dark:border-slate-700 pt-2">
              <span>Grand Total ({po.currency || "AED"})</span>
              <span className="font-mono">{formatCurrency(po.grandTotal, po.currency)}</span>
            </div>
            {po.currency && po.currency !== "AED" && (
              <div className="flex justify-between items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                <span>AED Equivalent (Base @ {po.exchangeRate}):</span>
                <span className="font-mono text-base">{formatCurrency(po.grandTotal * (po.exchangeRate || 1), "AED")}</span>
              </div>
            )}
          </div>
        </div>

        {/* PO Metadata */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
          <h3 className="font-bold text-slate-900 dark:text-white">Order Details</h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Currency & Exchange Rate</p>
              <p className="text-slate-900 dark:text-white font-mono font-bold">
                {po.currency || "AED"} {po.currency && po.currency !== "AED" ? `(1 ${po.currency} = ${po.exchangeRate} AED)` : "(Base)"}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Created By</p>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{po.createdBy}</p>
            </div>
            {po.approvedBy && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved By</p>
                <p className="text-slate-700 dark:text-slate-300 font-medium">{po.approvedBy}</p>
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Created Date</p>
              <p className="text-slate-700 dark:text-slate-300 font-medium">{formatDate(po.createdAt)}</p>
            </div>
            {po.notes && (
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notes</p>
                <p className="text-slate-700 dark:text-slate-300 mt-1 whitespace-pre-wrap">{po.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payments Section */}
      {po.payments?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-600" />
              Payment History
            </h3>
          </div>
          <div className="space-y-3">
            {po.payments.map((p: any) => (
              <div key={p.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{p.paymentNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDate(p.paymentDate)} • {p.paymentMethod}
                    {p.bankReference && ` • Ref: ${p.bankReference}`}
                  </p>
                </div>
                <span className="font-bold text-emerald-600 font-mono">
                  {formatCurrency(p.amount, p.currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GRNs Section */}
      {po.grns?.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-blue-600" />
              Goods Received Notes
            </h3>
          </div>
          <div className="space-y-3">
            {po.grns.map((g: any) => (
              <Link
                key={g.id}
                href={`/grn/${g.id}`}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <div>
                  <p className="font-bold text-blue-600 font-mono">{g.grnNumber}</p>
                  <p className="text-xs text-slate-500 mt-1">Received on {formatDate(g.receivedDate)} by {g.receivedBy}</p>
                </div>
                <span className="text-xs font-bold bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                  {g.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
