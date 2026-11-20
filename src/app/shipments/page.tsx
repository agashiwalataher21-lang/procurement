"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plane, Plus, Search, Package, Anchor, Ship, Truck, MapPin, Calendar, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Shipment {
  id: string;
  shipmentNumber: string;
  containerNumber: string | null;
  billOfLading: string | null;
  shippingCompany: string | null;
  portOfLoading: string | null;
  portOfDischarge: string;
  etd: string | null;
  eta: string | null;
  actualArrivalDate: string | null;
  status: string;
  shippingCost: number;
  notes: string | null;
}

export default function ShipmentsPage() {
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      const res = await fetch("/api/shipments");
      const data = await res.json();
      setShipments(data.shipments || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load shipments");
    } finally {
      setLoading(false);
    }
  };

  const filteredShipments = shipments.filter((s) => {
    const matchesSearch =
      s.shipmentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.containerNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.shippingCompany?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { label: string; class: string } } = {
      BOOKED: { label: "Booked", class: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
      IN_TRANSIT: { label: "In Transit", class: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
      CUSTOMS_CLEARANCE: { label: "Customs Clearance", class: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
      ARRIVED: { label: "Arrived", class: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
      DELIVERED: { label: "Delivered", class: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
    };
    return badges[status] || { label: status, class: "bg-slate-100 text-slate-600" };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Ship className="w-6 h-6 text-blue-600" />
            International Shipment Tracking
          </h1>
          <p className="text-sm text-slate-500">Track maritime containers, Air Waybills, and BL numbers</p>
        </div>
        <Link
          href="/shipments/new"
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          New Shipment
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
              placeholder="Search by Shipment #, Container #, or Shipping Line..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Statuses</option>
            <option value="BOOKED">Booked</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
            <option value="ARRIVED">Arrived</option>
            <option value="DELIVERED">Delivered</option>
          </select>
        </div>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {["BOOKED", "IN_TRANSIT", "CUSTOMS_CLEARANCE", "ARRIVED", "DELIVERED"].map((status) => {
          const count = shipments.filter((s) => s.status === status).length;
          const badge = getStatusBadge(status);
          return (
            <div key={status} className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
              <div className="text-xs font-semibold text-slate-400 uppercase">{badge.label}</div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{count}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">Loading shipments...</div>
        ) : filteredShipments.length === 0 ? (
          <div className="p-12 text-center">
            <Ship className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No shipments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-4">Shipment #</th>
                  <th className="p-4">Container / BL</th>
                  <th className="p-4">Shipping Line</th>
                  <th className="p-4">Route</th>
                  <th className="p-4">ETD / ETA</th>
                  <th className="p-4 text-right">Cost</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredShipments.map((shipment) => {
                  const status = getStatusBadge(shipment.status);
                  return (
                    <tr key={shipment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="p-4 font-mono font-bold text-xs text-blue-600">{shipment.shipmentNumber}</td>
                      <td className="p-4">
                        <div className="text-slate-900 dark:text-white">{shipment.containerNumber || "-"}</div>
                        <div className="text-xs text-slate-500 font-mono">{shipment.billOfLading || "-"}</div>
                      </td>
                      <td className="p-4 text-slate-700 dark:text-slate-300">{shipment.shippingCompany || "-"}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                          <MapPin className="w-3 h-3" />
                          {shipment.portOfLoading || "N/A"} → {shipment.portOfDischarge}
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">
                        <div className="text-xs">
                          {shipment.etd ? new Date(shipment.etd).toLocaleDateString() : "-"}
                        </div>
                        <div className="text-xs font-semibold text-amber-600">
                          {shipment.eta ? new Date(shipment.eta).toLocaleDateString() : "-"}
                        </div>
                      </td>
                      <td className="p-4 text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(shipment.shippingCost)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${status.class}`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}