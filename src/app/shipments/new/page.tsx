"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ship, Package } from "lucide-react";
import { toast } from "sonner";

export default function NewShipmentPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    poId: "",
    shipmentNumber: "",
    carrier: "",
    trackingNumber: "",
    containerNumber: "",
    billOfLading: "",
    portOfLoading: "",
    portOfDischarge: "Jebel Ali Port, Dubai",
    etd: "",
    eta: "",
    actualArrivalDate: "",
    status: "IN_TRANSIT",
    shippingCost: "",
    notes: "",
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const poRes = await fetch("/api/purchase-orders");
      const poData = await poRes.json();
      setPurchaseOrders(poData.purchaseOrders || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.poId || !formData.shipmentNumber) {
      toast.error("Purchase Order and Shipment Number are required");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        poId: formData.poId,
        shipmentNumber: formData.shipmentNumber,
        carrier: formData.carrier || null,
        trackingNumber: formData.trackingNumber || null,
        containerNumber: formData.containerNumber || null,
        billOfLading: formData.billOfLading || null,
        portOfLoading: formData.portOfLoading || null,
        portOfDischarge: formData.portOfDischarge || "Jebel Ali Port, Dubai",
        etd: formData.etd ? new Date(formData.etd) : null,
        eta: formData.eta ? new Date(formData.eta) : null,
        actualArrivalDate: formData.actualArrivalDate ? new Date(formData.actualArrivalDate) : null,
        status: formData.status,
        shippingCost: parseFloat(formData.shippingCost) || 0,
        notes: formData.notes || null,
      };

      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create shipment");

      toast.success(`Shipment ${data.shipment.shipmentNumber} created successfully!`);
      router.push(`/shipments`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create shipment");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading form...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/shipments"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">New International Shipment / Cargo</h1>
            <p className="text-sm text-slate-500">Record cargo booking, bill of lading, container number, and ETD/ETA</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ship className="w-5 h-5 text-blue-600" />
              Cargo & Shipment Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Purchase Order *
              </label>
              <select
                required
                value={formData.poId}
                onChange={(e) => setFormData({ ...formData, poId: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Select Purchase Order...</option>
                {purchaseOrders.map((po) => (
                  <option key={po.id} value={po.id}>
                    {po.poNumber} — {po.supplier?.name || "Supplier"} ({po.currency} {po.grandTotal}) [{po.status}]
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Shipment / Cargo Ref Number *
              </label>
              <input
                required
                value={formData.shipmentNumber}
                onChange={(e) => setFormData({ ...formData, shipmentNumber: e.target.value })}
                placeholder="e.g. SHP-2026-0001 or CRG-89021"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Carrier / Shipping Line / Cargo Agent
              </label>
              <input
                value={formData.carrier}
                onChange={(e) => setFormData({ ...formData, carrier: e.target.value })}
                placeholder="e.g. Maersk, MSC, Emirates SkyCargo"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Tracking Number
              </label>
              <input
                value={formData.trackingNumber}
                onChange={(e) => setFormData({ ...formData, trackingNumber: e.target.value })}
                placeholder="e.g. MSK001234567"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Bill of Lading / AWB #
              </label>
              <input
                value={formData.billOfLading}
                onChange={(e) => setFormData({ ...formData, billOfLading: e.target.value })}
                placeholder="e.g. MSKDXB123456"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Container Number
              </label>
              <input
                value={formData.containerNumber}
                onChange={(e) => setFormData({ ...formData, containerNumber: e.target.value })}
                placeholder="e.g. MSKU1234567"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Port of Loading (Origin)
              </label>
              <input
                value={formData.portOfLoading}
                onChange={(e) => setFormData({ ...formData, portOfLoading: e.target.value })}
                placeholder="e.g. Shanghai, Guangzhou, Mumbai"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Port of Discharge (Destination)
              </label>
              <input
                value={formData.portOfDischarge}
                onChange={(e) => setFormData({ ...formData, portOfDischarge: e.target.value })}
                placeholder="e.g. Jebel Ali Port, Dubai"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                ETD (Estimated Departure)
              </label>
              <input
                type="date"
                value={formData.etd}
                onChange={(e) => setFormData({ ...formData, etd: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                ETA (Estimated Arrival)
              </label>
              <input
                type="date"
                value={formData.eta}
                onChange={(e) => setFormData({ ...formData, eta: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Actual Arrival Date
              </label>
              <input
                type="date"
                value={formData.actualArrivalDate}
                onChange={(e) => setFormData({ ...formData, actualArrivalDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="BOOKED">Booked</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="CUSTOMS_CLEARANCE">Customs Clearance</option>
                <option value="ARRIVED">Arrived</option>
                <option value="DELIVERED">Delivered</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Freight & Cargo Charges (AED)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Notes & Cargo Details
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Carton count, gross weight (kg), CBM volume, cargo forwarder remarks..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href="/shipments"
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
          >
            <Package className="w-4 h-4" />
            {submitting ? "Saving Cargo..." : "Create Shipment"}
          </button>
        </div>
      </form>
    </div>
  );
}
