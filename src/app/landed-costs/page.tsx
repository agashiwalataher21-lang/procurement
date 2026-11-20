"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plane, Plus, Search, Package, Calculator, DollarSign, Anchor } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface LandedCost {
  id: string;
  landedCostNumber: string;
  purchaseOrder: { poNumber: string } | null;
  shipment: { shipmentNumber: string; portOfLoading: string; portOfDischarge: string } | null;
  date: string;
  allocationMethod: string;
  totalPurchaseCost: number;
  totalFreightAmount: number;
  totalCustomsDuty: number;
  totalClearingCharges: number;
  totalLocalTransport: number;
  totalOtherExpenses: number;
  grandTotalLandedCost: number;
  status: string;
}

export default function LandedCostsPage() {
  const [landedCosts, setLandedCosts] = useState<LandedCost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchLandedCosts();
  }, []);

  const fetchLandedCosts = async () => {
    try {
      const res = await fetch("/api/landed-costs");
      const data = await res.json();
      setLandedCosts(data.landedCosts || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load landed costs");
    } finally {
      setLoading(false);
    }
  };

  const filteredCosts = landedCosts.filter((lc) =>
    lc.landedCostNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lc.purchaseOrder?.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lc.shipment?.shipmentNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getTotalExpenses = (lc: LandedCost) =>
    lc.totalFreightAmount + lc.totalCustomsDuty + lc.totalClearingCharges + lc.totalLocalTransport + lc.totalOtherExpenses;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Calculator className="w-6 h-6 text-blue-600" />
            Landed Cost Allocation
          </h1>
          <p className="text-sm text-slate-500">Allocate freight, customs duty, clearing & transport to imported goods</p>
        </div>
        <Link
          href="/landed-costs/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New Landed Cost
        </Link>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by LC #, PO #, or Shipment #..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-5 rounded-xl shadow-lg text-white">
          <div className="text-xs font-semibold opacity-80 uppercase">Total Shipments</div>
          <div className="text-3xl font-extrabold mt-1">{landedCosts.length}</div>
          <div className="text-xs opacity-80 mt-1">Landed cost records</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Freight</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(landedCosts.reduce((sum, lc) => sum + lc.totalFreightAmount, 0))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Customs (5%)</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(landedCosts.reduce((sum, lc) => sum + lc.totalCustomsDuty, 0))}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="text-xs font-semibold text-slate-400 uppercase">Total Landed Cost</div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
            {formatCurrency(landedCosts.reduce((sum, lc) => sum + lc.grandTotalLandedCost, 0))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading...</div>
        ) : filteredCosts.length === 0 ? (
          <div className="p-12 text-center">
            <Calculator className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No landed cost records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-4">LC Number</th>
                  <th className="p-4">PO Reference</th>
                  <th className="p-4">Shipment</th>
                  <th className="p-4">Method</th>
                  <th className="p-4 text-right">Purchase Cost</th>
                  <th className="p-4 text-right">Total Expenses</th>
                  <th className="p-4 text-right">Landed Cost</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCosts.map((lc) => (
                  <tr key={lc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 font-mono font-bold text-xs text-blue-600">{lc.landedCostNumber}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{lc.purchaseOrder?.poNumber || "-"}</td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">{lc.shipment?.shipmentNumber || "-"}</td>
                    <td className="p-4 text-slate-600 dark:text-slate-400">{lc.allocationMethod}</td>
                    <td className="p-4 text-right font-semibold">{formatCurrency(lc.totalPurchaseCost)}</td>
                    <td className="p-4 text-right text-amber-600 font-semibold">{formatCurrency(getTotalExpenses(lc))}</td>
                    <td className="p-4 text-right font-bold text-emerald-600">{formatCurrency(lc.grandTotalLandedCost)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        lc.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"
                      }`}>
                        {lc.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}