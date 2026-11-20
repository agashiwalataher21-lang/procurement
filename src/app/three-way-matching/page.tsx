"use client";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Scale,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  DollarSign,
  Package,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface MatchingData {
  poId: string;
  poNumber: string;
  supplierName: string;
  orderDate: string;
  grandTotal: number;
  status: string;
  itemsCount: number;
  matchedItemsCount: number;
  isFullyMatched: boolean;
}

interface ComparisonLine {
  itemCode: string;
  itemName: string;
  poQuantity: number;
  poUnitPrice: number;
  poTotal: number;
  grnReceived: number;
  invoiceBilled: number;
  invoiceAmount: number;
  varianceQty: number;
  varianceAmount: number;
  isQtyMatched: boolean;
  isAmountMatched: boolean;
  status: string;
}

interface MatchingDetail {
  po: { id: string; poNumber: string; supplier: any; orderDate: string; status: string };
  comparisonLines: ComparisonLine[];
  totals: {
    poSubtotal: number;
    invoiceSubtotal: number;
    poVat: number;
    invoiceVat: number;
    poGrandTotal: number;
    invoiceGrandTotal: number;
    totalPayments: number;
    outstandingBalance: number;
  };
  hasDiscrepancies: boolean;
}

function ThreeWayMatchingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [matchingData, setMatchingData] = React.useState<MatchingData[]>([]);
  const [detail, setDetail] = React.useState<MatchingDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingDetail, setLoadingDetail] = React.useState(false);
  const selectedPoId = searchParams.get("poId");

  React.useEffect(() => {
    fetchMatchingSummary();
  }, []);

  React.useEffect(() => {
    if (selectedPoId) {
      fetchMatchingDetail(selectedPoId);
    }
  }, [selectedPoId]);

  const fetchMatchingSummary = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/three-way-matching");
      const data = await res.json();
      setMatchingData(data.matchingData || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load matching data");
    } finally {
      setLoading(false);
    }
  };

  const fetchMatchingDetail = async (poId: string) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/three-way-matching?poId=${poId}`);
      const data = await res.json();
      setDetail(data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load matching details");
    } finally {
      setLoadingDetail(false);
    }
  };

  const getStatusBadge = (matched: boolean, full: boolean) => {
    if (full) return { label: "Fully Matched", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400", icon: CheckCircle };
    if (matched) return { label: "Partial Match", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400", icon: AlertTriangle };
    return { label: "Pending", class: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400", icon: XCircle };
  };

  if (selectedPoId && detail) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/three-way-matching")}
            className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold hover:bg-slate-200"
          >
            ← Back to Summary
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Scale className="w-6 h-6 text-blue-600" />
              Three-Way Matching
            </h1>
            <p className="text-sm text-slate-500">PO vs GRN vs Invoice reconciliation for {detail.po.poNumber}</p>
          </div>
        </div>

        {/* Discrepancy Alert */}
        {detail.hasDiscrepancies && (
          <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 p-4 rounded-xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <div>
              <h3 className="font-bold text-rose-800 dark:text-rose-200">Discrepancies Detected</h3>
              <p className="text-sm text-rose-700 dark:text-rose-300">
                There are quantity or amount mismatches between PO, GRN, and Invoice. Review highlighted rows below.
              </p>
            </div>
          </div>
        )}

        {/* PO Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Purchase Order</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white mt-1">{detail.po.poNumber}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Supplier</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">{detail.po.supplier.name}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Order Date</div>
              <div className="text-lg font-semibold text-slate-900 dark:text-white mt-1">
                {new Date(detail.po.orderDate).toLocaleDateString()}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500 uppercase tracking-wider">Outstanding</div>
              <div className="text-xl font-bold text-rose-600 mt-1">{formatCurrency(detail.totals.outstandingBalance)}</div>
            </div>
          </div>
        </div>

        {/* Line-by-Line Comparison */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Line-by-Line Reconciliation</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-4">Item</th>
                  <th className="p-4 text-center">PO Qty</th>
                  <th className="p-4 text-center">GRN Received</th>
                  <th className="p-4 text-center">Invoice Billed</th>
                  <th className="p-4 text-center">Variance (Qty)</th>
                  <th className="p-4 text-right">PO Total</th>
                  <th className="p-4 text-right">Invoice Total</th>
                  <th className="p-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {detail.comparisonLines.map((line, idx) => (
                  <tr key={idx} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${line.status === "DISCREPANCY" ? "bg-rose-50/50 dark:bg-rose-950/10" : ""}`}>
                    <td className="p-4">
                      <div className="font-mono text-xs text-blue-600">{line.itemCode}</div>
                      <div className="font-semibold text-slate-900 dark:text-white">{line.itemName}</div>
                    </td>
                    <td className="p-4 text-center font-semibold">{line.poQuantity}</td>
                    <td className="p-4 text-center">
                      <span className={line.grnReceived > 0 ? "text-emerald-600 font-semibold" : "text-slate-400"}>
                        {line.grnReceived || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={line.invoiceBilled > 0 ? "text-amber-600 font-semibold" : "text-slate-400"}>
                        {line.invoiceBilled || "-"}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {line.varianceQty !== 0 ? (
                        <span className={`font-bold px-2 py-0.5 rounded text-xs ${line.varianceQty < 0 ? "bg-rose-100 text-rose-700" : "bg-amber-100 text-amber-700"}`}>
                          {line.varianceQty > 0 ? "+" : ""}{line.varianceQty}
                        </span>
                      ) : (
                        <span className="text-emerald-600">0</span>
                      )}
                    </td>
                    <td className="p-4 text-right font-mono">{formatCurrency(line.poTotal)}</td>
                    <td className="p-4 text-right font-mono font-semibold">{formatCurrency(line.invoiceAmount)}</td>
                    <td className="p-4 text-center">
                      {line.status === "MATCHED" ? (
                        <CheckCircle className="w-5 h-5 text-emerald-600 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-rose-600 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">Financial Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <div className="text-xs text-slate-500">PO Subtotal</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(detail.totals.poSubtotal)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Invoice Subtotal</div>
              <div className={`text-lg font-bold ${detail.totals.poSubtotal === detail.totals.invoiceSubtotal ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(detail.totals.invoiceSubtotal)}
              </div>
            </div>
            <div>
              <div className="text-xs text-slate-500">PO VAT</div>
              <div className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(detail.totals.poVat)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-500">Invoice VAT</div>
              <div className={`text-lg font-bold ${detail.totals.poVat === detail.totals.invoiceVat ? "text-emerald-600" : "text-rose-600"}`}>
                {formatCurrency(detail.totals.invoiceVat)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Scale className="w-6 h-6 text-blue-600" />
          Three-Way Matching
        </h1>
        <p className="text-sm text-slate-500">Automated PO vs GRN vs Invoice reconciliation with configurable tolerance limits</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Fully Matched</div>
          <div className="text-3xl font-extrabold mt-1">
            {matchingData.filter((m) => m.isFullyMatched).length}
          </div>
          <div className="text-xs opacity-80 mt-1">POs ready for payment</div>
        </div>
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Partial Match</div>
          <div className="text-3xl font-extrabold mt-1">
            {matchingData.filter((m) => m.matchedItemsCount > 0 && !m.isFullyMatched).length}
          </div>
          <div className="text-xs opacity-80 mt-1">In progress</div>
        </div>
        <div className="bg-gradient-to-r from-rose-600 to-rose-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Pending</div>
          <div className="text-3xl font-extrabold mt-1">
            {matchingData.filter((m) => m.matchedItemsCount === 0).length}
          </div>
          <div className="text-xs opacity-80 mt-1">Awaiting documents</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Value</div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(matchingData.reduce((sum, m) => sum + m.grandTotal, 0))}
          </div>
          <div className="text-xs text-slate-500 mt-1">In matching pool</div>
        </div>
      </div>

      {/* Matching List */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Purchase Orders Pending Reconciliation</h2>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : matchingData.length === 0 ? (
          <div className="p-12 text-center">
            <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No purchase orders to reconcile</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {matchingData.map((po) => {
              const badge = getStatusBadge(po.matchedItemsCount > 0, po.isFullyMatched);
              const Icon = badge.icon;
              return (
                <button
                  key={po.poId}
                  onClick={() => router.push(`/three-way-matching?poId=${po.poId}`)}
                  className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${badge.class}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">{po.poNumber}</div>
                      <div className="text-sm text-slate-600 dark:text-slate-400">{po.supplierName}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <div className="font-bold text-slate-900 dark:text-white">{formatCurrency(po.grandTotal)}</div>
                      <div className="text-xs text-slate-500">{po.itemsCount} items</div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.class}`}>
                      {badge.label}
                    </span>
                    <ChevronRight className="w-5 h-5 text-slate-400" />
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ThreeWayMatchingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading...</div>}>
      <ThreeWayMatchingContent />
    </Suspense>
  );
}
