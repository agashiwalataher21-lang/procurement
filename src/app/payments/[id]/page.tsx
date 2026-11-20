"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  CreditCard,
  Building,
  CheckCircle2,
  Calendar,
  DollarSign,
  FileText
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function PaymentDetailPage() {
  const params = useParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchPayment();
    }
  }, [params.id]);

  const fetchPayment = async () => {
    try {
      const res = await fetch(`/api/payments/${params.id}`);
      if (!res.ok) throw new Error("Payment voucher not found");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load payment voucher");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading payment voucher...</p>
      </div>
    );
  }

  if (!data || !data.payment) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">Payment voucher not found</p>
        <Link href="/payments" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          Return to payments
        </Link>
      </div>
    );
  }

  const { payment, poContext } = data;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Print */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/payments"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Payment Voucher</h1>
            <p className="text-xs text-slate-500">{payment.paymentNumber}</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          Print Voucher
        </button>
      </div>

      {/* Printable Payment Voucher Paper */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-zoho p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Company Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">
              BAIT AL HADAF GENERAL TRADING L.L.C.
            </h2>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mt-0.5">
              Motorcycle & Generator Spare Parts
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Dubai, United Arab Emirates • TRN: 100458928300003 • Tel: +971 4 223 8899
            </p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded bg-blue-100 text-blue-800 font-bold text-xs uppercase tracking-wider font-mono">
              OFFICIAL PAYMENT VOUCHER
            </span>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
              {payment.paymentNumber}
            </p>
            <p className="text-xs text-slate-500">Date: {formatDate(payment.paymentDate)}</p>
          </div>
        </div>

        {/* Paid To & Transaction Reference */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Beneficiary / Paid To
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{payment.supplier.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">Supplier ID: {payment.supplier.supplierId}</p>
            {payment.supplier.country && (
              <p className="text-xs text-slate-500 mt-1">Country: {payment.supplier.country}</p>
            )}
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Payment Details
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Method: {payment.paymentMethod.replace("_", " ")}
            </p>
            {payment.bankReference && (
              <p className="text-xs text-slate-600 dark:text-slate-400 font-mono mt-1">
                Bank Ref / SWIFT: {payment.bankReference}
              </p>
            )}
            <p className="text-xs text-slate-500 mt-1">Recorded by: {payment.recordedBy}</p>
          </div>
        </div>

        {/* PO or Invoice Context */}
        {poContext && (
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900 dark:text-blue-300">
              <span>Applied Against Purchase Order: {poContext.poNumber}</span>
              <span className="text-emerald-700 dark:text-emerald-400">Advance Disbursed</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-500">PO Grand Total:</span>{" "}
                <span className="font-bold">{formatCurrency(poContext.poTotal)}</span>
              </div>
              <div>
                <span className="text-slate-500">Cumulative Paid:</span>{" "}
                <span className="font-bold text-emerald-600">{formatCurrency(poContext.poTotalPaid)}</span>
              </div>
              <div>
                <span className="text-slate-500">Remaining Balance:</span>{" "}
                <span className="font-bold text-blue-600">{formatCurrency(poContext.poRemainingBalance)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Amount Box */}
        <div className="p-6 rounded-xl bg-slate-900 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Amount Disbursed
            </span>
            <p className="text-xs text-slate-300 mt-1 italic">
              Amount in words: United Arab Emirates Dirhams Only
            </p>
          </div>
          <p className="text-3xl font-black font-mono text-emerald-400">
            {formatCurrency(payment.amount, payment.currency)}
          </p>
        </div>

        {/* Notes */}
        {payment.notes && (
          <div className="text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Remarks</span>
            <p className="text-slate-700 dark:text-slate-300">{payment.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-3 gap-8 pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
          <div>
            <div className="border-b border-slate-400 pb-8 font-serif italic text-sm text-slate-700 dark:text-slate-300">
              {payment.recordedBy}
            </div>
            <p className="text-xs font-bold uppercase text-slate-500 mt-2">Prepared By</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8 font-serif italic text-sm text-slate-700 dark:text-slate-300">
              Fatima Al-Zahra
            </div>
            <p className="text-xs font-bold uppercase text-slate-500 mt-2">Verified By (Accounts)</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8 font-serif italic text-sm text-slate-700 dark:text-slate-300">
              Taher
            </div>
            <p className="text-xs font-bold uppercase text-slate-500 mt-2">Authorized Signatory</p>
          </div>
        </div>
      </div>
    </div>
  );
}
