"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Printer,
  Truck,
  Building,
  CheckCircle2,
  Package,
  Calendar,
  UserCheck
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function GrnDetailPage() {
  const params = useParams();
  const [grn, setGrn] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchGrn();
    }
  }, [params.id]);

  const fetchGrn = async () => {
    try {
      const res = await fetch(`/api/grn/${params.id}`);
      if (!res.ok) throw new Error("GRN not found");
      const json = await res.json();
      setGrn(json.grn);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load GRN");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading Goods Received Note...</p>
      </div>
    );
  }

  if (!grn) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">Goods Received Note not found</p>
        <Link href="/grn" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          Return to GRN list
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Bar with Print */}
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-3">
          <Link
            href="/grn"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Goods Received Note</h1>
            <p className="text-xs text-slate-500">{grn.grnNumber}</p>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          Print GRN
        </button>
      </div>

      {/* Printable GRN Document */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-zoho p-8 space-y-8 print:p-0 print:border-none print:shadow-none">
        {/* Header */}
        <div className="flex items-start justify-between border-b-2 border-slate-900 dark:border-slate-700 pb-6">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-wide">
              BAIT AL HADAF GENERAL TRADING L.L.C.
            </h2>
            <p className="text-xs font-semibold text-amber-500 uppercase tracking-widest mt-0.5">
              Warehouse Goods Inspection & Receiving
            </p>
            <p className="text-xs text-slate-500 mt-2">
              Dubai Logistics City, UAE • TRN: 100458928300003
            </p>
          </div>
          <div className="text-right">
            <span className="px-3 py-1 rounded bg-emerald-100 text-emerald-800 font-bold text-xs uppercase tracking-wider font-mono">
              GOODS RECEIVED NOTE (GRN)
            </span>
            <p className="text-xl font-extrabold font-mono text-slate-900 dark:text-white mt-2">
              {grn.grnNumber}
            </p>
            <p className="text-xs text-slate-500">Received Date: {formatDate(grn.receivedDate)}</p>
          </div>
        </div>

        {/* Supplier & PO Reference */}
        <div className="grid grid-cols-2 gap-6 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Supplier / Vendor
            </span>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{grn.supplier.name}</p>
            <p className="text-xs text-slate-500 font-mono mt-0.5">ID: {grn.supplier.supplierId}</p>
          </div>

          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Purchase Order Reference
            </span>
            <Link
              href={`/purchase-orders/${grn.purchaseOrder.id}`}
              className="text-base font-bold font-mono text-blue-600 hover:underline block"
            >
              {grn.purchaseOrder.poNumber}
            </Link>
            <p className="text-xs text-slate-500 mt-1">Received by: {grn.receivedBy}</p>
          </div>
        </div>

        {/* Received Items Table */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Verified Inspection Items
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border border-slate-200 dark:border-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-3 border-b">Item Code</th>
                  <th className="p-3 border-b">Product Name</th>
                  <th className="p-3 border-b text-center">Ordered</th>
                  <th className="p-3 border-b text-center">Previously Recv</th>
                  <th className="p-3 border-b text-center">Newly Recv</th>
                  <th className="p-3 border-b text-center">Pending</th>
                  <th className="p-3 border-b">Condition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {grn.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="p-3 font-mono text-xs font-bold text-blue-600">{item.itemCode}</td>
                    <td className="p-3 font-semibold text-slate-900 dark:text-white">{item.itemName}</td>
                    <td className="p-3 text-center font-mono">{item.orderedQuantity}</td>
                    <td className="p-3 text-center font-mono text-slate-500">{item.previouslyReceivedQty}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">{item.newlyReceivedQty}</td>
                    <td className="p-3 text-center font-mono text-amber-600">{item.pendingQty}</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {item.condition}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Notes */}
        {grn.notes && (
          <div className="text-sm border-t border-slate-100 dark:border-slate-800 pt-4">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Receiving Notes & Inspection Remarks
            </span>
            <p className="text-slate-700 dark:text-slate-300">{grn.notes}</p>
          </div>
        )}

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-12 pt-12 border-t border-slate-200 dark:border-slate-800 text-center">
          <div>
            <div className="border-b border-slate-400 pb-8 font-serif italic text-sm text-slate-700 dark:text-slate-300">
              {grn.receivedBy}
            </div>
            <p className="text-xs font-bold uppercase text-slate-500 mt-2">Warehouse Receiving Officer</p>
          </div>
          <div>
            <div className="border-b border-slate-400 pb-8 font-serif italic text-sm text-slate-700 dark:text-slate-300">
              Rashid Khan (Purchase Manager)
            </div>
            <p className="text-xs font-bold uppercase text-slate-500 mt-2">Verified & Accepted</p>
          </div>
        </div>
      </div>
    </div>
  );
}
