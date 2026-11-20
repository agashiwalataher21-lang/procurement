"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { X, History, Loader2, Package, TrendingDown, DollarSign, Calendar, Building2, ExternalLink, Pencil } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export interface PurchaseHistoryRow {
  date: string;
  documentNumber: string;
  vendor: string;
  quantity: number;
  unitCost: number;
  status: string;
  sourceType: "INVOICE" | "PO";
}

export interface PurchaseHistoryData {
  item?: { id: string; itemCode: string; itemName: string };
  summary: {
    lastPurchaseRate: number | null;
    lastOrderedOn: string | null;
    lastVendorName: string | null;
    lastDocumentNumber?: string | null;
    totalStockOnHand: number;
  };
  history: PurchaseHistoryRow[];
}

export type ItemContextAnchor = "modal" | "right" | "below";

interface Props {
  productId: string | null;
  itemName?: string;
  itemCode?: string;
  onClose: () => void;
  anchor?: ItemContextAnchor;
  className?: string;
}

const CACHE = new Map<string, PurchaseHistoryData>();

export function prefetchItemHistory(productId: string) {
  if (!productId || CACHE.has(productId)) return;
  fetch(`/api/items/${productId}/purchase-history`)
    .then((r) => (r.ok ? r.json() : null))
    .then((d) => {
      if (d) CACHE.set(productId, d);
    })
    .catch(() => undefined);
}

export default function ItemContextPanel({
  productId,
  itemName,
  itemCode,
  onClose,
  anchor = "modal",
  className = "",
}: Props) {
  const [data, setData] = useState<PurchaseHistoryData | null>(() =>
    productId ? CACHE.get(productId) ?? null : null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    if (!productId) {
      setData(null);
      setError(null);
      return;
    }
    const cached = CACHE.get(productId);
    if (cached) {
      setData(cached);
      setError(null);
      setLoading(false);
      return;
    }
    const id = ++requestIdRef.current;
    setLoading(true);
    setError(null);
    fetch(`/api/items/${productId}/purchase-history`)
      .then(async (r) => {
        const d = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(d.error || `HTTP ${r.status}`);
        return d;
      })
      .then((d) => {
        if (id !== requestIdRef.current) return;
        CACHE.set(productId, d as PurchaseHistoryData);
        setData(d as PurchaseHistoryData);
      })
      .catch((e) => {
        if (id !== requestIdRef.current) return;
        setError(e.message || "Failed to load history");
      })
      .finally(() => {
        if (id === requestIdRef.current) setLoading(false);
      });
  }, [productId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!productId) return null;

  const stock = data?.summary.totalStockOnHand ?? 0;
  const stockState =
    stock <= 0
      ? { label: "Out of Stock", cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800" }
      : stock < 25
      ? { label: "Low Stock", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800" }
      : { label: "In Stock", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800" };

  const content = (
    <div className="flex flex-col max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Purchase History & Item Context
              </h2>
              {(data?.item?.itemCode || itemCode) && (
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold border border-slate-200 dark:border-slate-700">
                  {data?.item?.itemCode || itemCode}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {data?.item?.itemName || itemName || "Item Details"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body */}
      <div className="p-6 space-y-6 overflow-y-auto">
        {loading && (
          <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Fetching real-time purchase records...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* 4 Stat Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Last Purchase Rate */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  Last Purchase Rate
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {data.summary.lastPurchaseRate != null
                    ? formatCurrency(data.summary.lastPurchaseRate)
                    : "—"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1 truncate">
                  {data.summary.lastDocumentNumber || "No previous bills"}
                </div>
              </div>

              {/* Last Ordered On */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  Last Ordered On
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-white">
                  {data.summary.lastOrderedOn ? formatDate(data.summary.lastOrderedOn) : "—"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Transaction date</div>
              </div>

              {/* Last Vendor Name */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <Building2 className="w-3.5 h-3.5 text-amber-600" />
                  Last Vendor
                </div>
                <div
                  className="text-base font-bold text-slate-900 dark:text-white truncate"
                  title={data.summary.lastVendorName || "—"}
                >
                  {data.summary.lastVendorName || "—"}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">Most recent supplier</div>
              </div>

              {/* Stock on Hand */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  <Package className="w-3.5 h-3.5 text-emerald-600" />
                  Stock on Hand
                </div>
                <div className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                  {stock.toLocaleString()}
                </div>
                <div className="mt-1">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold border ${stockState.cls}`}>
                    {stockState.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick History Table */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-4 h-4 text-blue-600" />
                  Recent Purchase Transactions (Last 5)
                </h3>
                <span className="text-xs text-slate-400">Bills & confirmed POs</span>
              </div>

              {data.history.length === 0 ? (
                <div className="text-center py-8 px-4 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-500 text-sm">
                  No previous purchases or orders found for this inventory item.
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Document #</th>
                        <th className="px-4 py-3">Vendor / Supplier</th>
                        <th className="px-4 py-3 text-right">Quantity</th>
                        <th className="px-4 py-3 text-right">Unit Cost</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {data.history.map((row, i) => (
                        <tr
                          key={`${row.documentNumber}-${row.date}-${i}`}
                          className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="px-4 py-3 whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                            {formatDate(row.date)}
                          </td>
                          <td className="px-4 py-3 font-mono font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                            {row.documentNumber}
                            <span
                              className={`ml-2 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                                row.sourceType === "INVOICE"
                                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
                                  : "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
                              }`}
                            >
                              {row.sourceType}
                            </span>
                          </td>
                          <td
                            className="px-4 py-3 text-slate-700 dark:text-slate-300 max-w-[180px] truncate"
                            title={row.vendor}
                          >
                            {row.vendor}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                            {row.quantity.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-extrabold text-slate-900 dark:text-white">
                            {formatCurrency(row.unitCost)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-bold">
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-4">
          {data?.item && (
            <>
              <Link
                href={`/products/${data.item.id}`}
                className="inline-flex items-center gap-1 font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Open Full Product Record <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <Link
                href={`/products/${data.item.id}/edit`}
                className="inline-flex items-center gap-1 font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400"
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Product
              </Link>
            </>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg text-slate-700 dark:text-slate-200 font-semibold transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );

  // Default is clean professional popup modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="fixed inset-0 -z-10"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className={`w-full max-w-3xl ${className}`} role="dialog" aria-modal="true">
        {content}
      </div>
    </div>
  );
}
