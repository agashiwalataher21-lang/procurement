"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Truck,
  Building,
  CheckCircle2,
  AlertTriangle,
  Package,
  Calendar,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";

interface GrnFormItem {
  productId: string;
  itemCode: string;
  itemName: string;
  orderedQuantity: number;
  previouslyReceivedQty: number;
  newlyReceivedQty: number;
  condition: string;
  notes: string;
}

function NewGrnForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPoId = searchParams.get("poId") || "";

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [selectedPoId, setSelectedPoId] = useState(preSelectedPoId);
  const [selectedPo, setSelectedPo] = useState<any>(null);

  const [receivedDate, setReceivedDate] = useState(new Date().toISOString().split("T")[0]);
  const [receivedBy, setReceivedBy] = useState("Salim Al-Nuaimi (Storekeeper)");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<GrnFormItem[]>([]);

  useEffect(() => {
    fetchEligiblePOs();
  }, []);

  const fetchEligiblePOs = async () => {
    try {
      const res = await fetch("/api/purchase-orders");
      const data = await res.json();
      const eligible = (data.purchaseOrders || []).filter(
        (po: any) =>
          po.status === "APPROVED" ||
          po.status === "PARTIALLY_RECEIVED" ||
          po.status === "DELAYED"
      );
      setPurchaseOrders(eligible);

      if (preSelectedPoId) {
        loadPoDetails(preSelectedPoId);
      } else if (eligible.length > 0) {
        setSelectedPoId(eligible[0].id);
        loadPoDetails(eligible[0].id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load eligible purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const loadPoDetails = async (poId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`);
      const data = await res.json();
      if (data.purchaseOrder) {
        setSelectedPo(data.purchaseOrder);
        const mappedItems: GrnFormItem[] = data.purchaseOrder.items.map((item: any) => {
          const remaining = Math.max(0, item.quantity - item.receivedQty);
          return {
            productId: item.productId || "",
            itemCode: item.itemCode,
            itemName: item.itemName,
            orderedQuantity: item.quantity,
            previouslyReceivedQty: item.receivedQty,
            newlyReceivedQty: remaining, // default to remaining for user ease
            condition: "Good",
            notes: "",
          };
        });
        setItems(mappedItems);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load PO items");
    }
  };

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    loadPoDetails(poId);
  };

  const handleItemChange = (index: number, field: keyof GrnFormItem, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId) {
      toast.error("Please select a valid Purchase Order");
      return;
    }

    const totalNewlyReceived = items.reduce((s, i) => s + (parseFloat(String(i.newlyReceivedQty)) || 0), 0);
    if (totalNewlyReceived <= 0) {
      toast.error("Newly received quantity must be greater than 0 for at least one item");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        poId: selectedPoId,
        supplierId: selectedPo.supplierId,
        receivedDate,
        receivedBy,
        notes,
        items,
      };

      const res = await fetch("/api/grn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create GRN");

      toast.success(`Goods Received Note ${data.grn.grnNumber} confirmed and stock updated!`);
      router.push(`/grn/${data.grn.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/grn"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Create Goods Received Note</h1>
            <p className="text-sm text-slate-500">
              Receive shipments against approved Purchase Orders and verify warehouse quantities
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Selection & Metadata */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              Purchase Order & Delivery Reference
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Purchase Order *
              </label>
              <select
                required
                value={selectedPoId}
                onChange={(e) => handlePoChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {purchaseOrders.length === 0 ? (
                  <option value="">No eligible approved POs available</option>
                ) : (
                  purchaseOrders.map((po) => (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplier.name} ({po.status})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Received Date *
              </label>
              <input
                type="date"
                required
                value={receivedDate}
                onChange={(e) => setReceivedDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Received By (Officer) *
              </label>
              <input
                type="text"
                required
                value={receivedBy}
                onChange={(e) => setReceivedBy(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Delivery / Container Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Bill of Lading ref, container inspection condition, delivery driver details..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Receiving Items Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Package className="w-5 h-5 text-blue-600" />
                Line Items Receiving & Inspection
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Enter actual quantity physically received for this delivery. Remaining items will stay tracked.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-3">Item / SKU</th>
                  <th className="p-3 w-24 text-center">Ordered</th>
                  <th className="p-3 w-24 text-center">Previously Recv</th>
                  <th className="p-3 w-32 text-center bg-emerald-50/50 dark:bg-emerald-950/20">Newly Received *</th>
                  <th className="p-3 w-24 text-center">Remaining</th>
                  <th className="p-3 w-36">Condition</th>
                  <th className="p-3">Inspection Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-500">
                      No items found for this Purchase Order.
                    </td>
                  </tr>
                ) : (
                  items.map((item, index) => {
                    const newlyRecv = parseFloat(String(item.newlyReceivedQty)) || 0;
                    const prevRecv = item.previouslyReceivedQty || 0;
                    const remaining = Math.max(0, item.orderedQuantity - (prevRecv + newlyRecv));

                    return (
                      <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3">
                          <span className="font-mono text-xs font-bold text-blue-600 block">
                            {item.itemCode}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-white text-xs">
                            {item.itemName}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                          {item.orderedQuantity}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-500">
                          {item.previouslyReceivedQty}
                        </td>
                        <td className="p-3 text-center bg-emerald-50/30 dark:bg-emerald-950/10">
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={item.newlyReceivedQty}
                            onChange={(e) =>
                              handleItemChange(index, "newlyReceivedQty", parseFloat(e.target.value) || 0)
                            }
                            className="w-24 text-center px-2 py-1.5 bg-white dark:bg-slate-800 border-2 border-emerald-500 rounded-lg font-bold font-mono text-emerald-700 dark:text-emerald-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-amber-600">
                          {remaining}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.condition}
                            onChange={(e) => handleItemChange(index, "condition", e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                          >
                            <option value="Good">Good / Passed</option>
                            <option value="Damaged">Damaged Goods</option>
                            <option value="Shortage">Shortage Detected</option>
                            <option value="Excess">Excess Quantity</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            type="text"
                            value={item.notes}
                            onChange={(e) => handleItemChange(index, "notes", e.target.value)}
                            placeholder="Box #, serials..."
                            className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
                          />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/grn"
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || items.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <CheckCircle2 className="w-4 h-4" />
            {submitting ? "Updating Inventory..." : "Confirm & Update Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewGrnPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading GRN form...</div>}>
      <NewGrnForm />
    </Suspense>
  );
}
