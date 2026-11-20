"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Truck,
  Plus,
  Search,
  Filter,
  Package,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Printer,
  Trash2
} from "lucide-react";
import { formatDate, safeJson } from "@/lib/utils";
import { toast } from "sonner";

interface GRN {
  id: string;
  grnNumber: string;
  receivedDate: string;
  receivedBy: string;
  status: string;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
    supplierId: string;
  };
  purchaseOrder: {
    id: string;
    poNumber: string;
    status: string;
  };
  items: any[];
}

export default function GoodsReceivedPage() {
  const [grns, setGrns] = useState<GRN[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GRN | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchGrns();
  }, []);

  const fetchGrns = async () => {
    try {
      const res = await fetch("/api/grn");
      const data = await safeJson<any>(res);
      setGrns(data.grns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/grn/${deleteTarget.id}`, {
        method: "DELETE",
      });
      const data = await safeJson<any>(res);
      if (!res.ok) throw new Error(data.error || "Failed to delete GRN");
      toast.success("GRN soft-deleted successfully");
      setDeleteTarget(null);
      fetchGrns();
    } catch (err: any) {
      toast.error(err.message || "Failed to soft-delete GRN");
    } finally {
      setDeleting(false);
    }
  };

  const filteredGrns = grns.filter((g) => {
    return (
      g.grnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.purchaseOrder.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.receivedBy.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Goods Received Notes (GRN)</h1>
          <p className="text-sm text-slate-500">
            Verify warehouse arrivals, record partial & multiple shipments, and track damaged or shortage items
          </p>
        </div>
        <Link
          href="/grn/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          Receive Goods (GRN)
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Deliveries Verified</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">{grns.length}</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex items-center gap-4">
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Warehouse Location</p>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">Dubai Logistics Hub</h3>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Stock Verification</p>
            <h3 className="text-lg font-bold text-emerald-600 mt-0.5">Automated on Confirm</h3>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by GRN Number, PO Number, Supplier, or Receiving Officer..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* GRN Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-slate-500">Loading Goods Received Notes...</p>
          </div>
        ) : filteredGrns.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No Goods Received Notes found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">GRN Number</th>
                  <th className="px-6 py-3">Received Date</th>
                  <th className="px-6 py-3">PO Reference</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Received Items</th>
                  <th className="px-6 py-3">Received By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredGrns.map((g) => {
                  const totalItemsCount = g.items.reduce((s, i) => s + i.newlyReceivedQty, 0);

                  return (
                    <tr key={g.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600">
                        <Link href={`/grn/${g.id}`} className="hover:underline">
                          {g.grnNumber}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatDate(g.receivedDate)}
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/purchase-orders/${g.purchaseOrder.id}`}
                          className="font-mono text-xs font-bold text-blue-600 hover:underline"
                        >
                          {g.purchaseOrder.poNumber}
                        </Link>
                        <p className="text-[11px] text-slate-400">PO Status: {g.purchaseOrder.status.replace("_", " ")}</p>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          href={`/suppliers/${g.supplier.id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors"
                        >
                          {g.supplier.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800 dark:text-slate-200">
                        <span className="font-mono font-bold text-emerald-600">{totalItemsCount}</span> items ({g.items.length} SKUs)
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {g.receivedBy}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <Link
                            href={`/grn/${g.id}`}
                            className="text-xs font-semibold text-blue-600 hover:underline"
                          >
                            View Note
                          </Link>
                          <button
                            onClick={() => setDeleteTarget(g)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Cancel GRN"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Cancel Goods Received Note?</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">GRN <span className="font-bold text-slate-900 dark:text-white">{deleteTarget.grnNumber}</span> will be soft-deleted and marked CANCELLED.</p>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                <strong>Note:</strong> Counts stay for audit trail; PO status will be reverted via API.
              </div>
            </div>
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/30">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm font-medium">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-medium disabled:opacity-50">{deleting ? "Deleting..." : "Yes, Soft-Delete"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
