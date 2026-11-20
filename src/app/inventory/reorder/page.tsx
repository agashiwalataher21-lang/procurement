"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ShoppingCart,
  CheckSquare,
  Square,
  ArrowRight,
  PackageCheck,
  RefreshCw,
  TrendingDown,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface ReorderItem {
  id: string;
  itemCode: string;
  itemName: string;
  brand: string;
  category: string;
  currentStock: number;
  incomingQty: number;
  salesDemandQty?: number;
  projectedStock: number;
  reorderPoint: number;
  reorderLevel: number;
  safetyStock: number;
  maxStock: number;
  leadTime: number;
  defaultPurchasePrice: number;
  currency: string;
  isBelowReorder: boolean;
  suggestedQty: number;
  preferredSupplierId?: string | null;
  preferredSupplierName?: string;
}

export default function ReorderStockPage() {
  const router = useRouter();
  const [items, setItems] = useState<ReorderItem[]>([]);
  const [allItems, setAllItems] = useState<ReorderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [singleGeneratingId, setSingleGeneratingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"below" | "all">("below");

  const generateSinglePO = async (item: ReorderItem) => {
    setSingleGeneratingId(item.id);
    try {
      const res = await fetch("/api/inventory/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: [{ productId: item.id, suggestedQty: item.suggestedQty || 10, supplierId: item.preferredSupplierId }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate PO");

      toast.success(`Generated Draft PO ${data.createdPOs[0].poNumber} for ${item.itemName}!`);
      router.push(`/purchase-orders/${data.createdPOs[0].id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to generate PO");
    } finally {
      setSingleGeneratingId(null);
    }
  };

  useEffect(() => {
    fetchReorderData();
  }, []);

  const fetchReorderData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory/reorder");
      const data = await res.json();
      setItems(data.reorderItems || []);
      setAllItems(data.allItems || []);
      // Default select all items below reorder
      setSelectedIds((data.reorderItems || []).map((i: ReorderItem) => i.id));
    } catch (e) {
      console.error(e);
      toast.error("Failed to load reorder stock recommendations");
    } finally {
      setLoading(false);
    }
  };

  const toggleSelectAll = () => {
    const currentList = viewMode === "below" ? items : allItems;
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map((i) => i.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((i) => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleGenerateDraftPOs = async () => {
    if (selectedIds.length === 0) {
      toast.error("Please select at least one item to reorder");
      return;
    }

    setGenerating(true);
    try {
      const selectedItemsData = (viewMode === "below" ? items : allItems)
        .filter((i) => selectedIds.includes(i.id))
        .map((i) => ({
          productId: i.id,
          suggestedQty: i.suggestedQty,
        }));

      const res = await fetch("/api/inventory/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selectedItemsData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to generate POs");

      toast.success(`Successfully generated ${data.createdPOs.length} Draft Purchase Order(s)!`);
      router.push("/purchase-orders");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setGenerating(false);
    }
  };

  const currentDisplayList = viewMode === "below" ? items : allItems;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <RefreshCw className="w-6 h-6 text-blue-600" />
            Stock Reorder Recommendation & 1-Click PO Generator
          </h1>
          <p className="text-sm text-slate-500">
            Automated Reorder Point calculation: (Avg Daily Usage × Lead Time) + Safety Stock
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setViewMode("below");
                setSelectedIds(items.map((i) => i.id));
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "below"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Needs Reorder ({items.length})
            </button>
            <button
              onClick={() => {
                setViewMode("all");
                setSelectedIds(allItems.map((i) => i.id));
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                viewMode === "all"
                  ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              All Inventory ({allItems.length})
            </button>
          </div>

          <button
            onClick={handleGenerateDraftPOs}
            disabled={generating || selectedIds.length === 0}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all disabled:opacity-50"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Generate Draft POs ({selectedIds.length})</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Items Below Reorder</span>
            <AlertTriangle className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{items.length}</p>
          <span className="text-xs text-amber-600 dark:text-amber-400 font-semibold mt-1 block">Requires immediate PO</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Total Catalog Items</span>
            <PackageCheck className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{allItems.length}</p>
          <span className="text-xs text-blue-600 font-semibold mt-1 block">Active spare parts</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Selected for Reorder</span>
            <CheckSquare className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">{selectedIds.length}</p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 block">Ready for 1-click PO</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Estimated Reorder Cost</span>
            <TrendingDown className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
            {formatCurrency(
              currentDisplayList
                .filter((i) => selectedIds.includes(i.id))
                .reduce((sum, i) => sum + i.suggestedQty * i.defaultPurchasePrice, 0)
            )}
          </p>
          <span className="text-xs text-purple-600 font-semibold mt-1 block">Excluding VAT & Shipping</span>
        </div>
      </div>

      {/* Reorder Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            {viewMode === "below" ? "Items Triggering Reorder Point" : "Complete Inventory Reorder Analysis"}
          </h2>
          <button
            onClick={toggleSelectAll}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1.5"
          >
            {selectedIds.length === currentDisplayList.length ? "Deselect All" : "Select All"}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">Calculating reorder points...</div>
        ) : currentDisplayList.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <ShieldAlert className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="text-base font-bold text-slate-800 dark:text-slate-200">All stock levels are healthy!</p>
            <p className="text-xs text-slate-400 mt-1">No items have fallen below their reorder thresholds.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.length === currentDisplayList.length && currentDisplayList.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="p-4">Item Code & Name</th>
                  <th className="p-4">Brand / Category</th>
                  <th className="p-4 text-center">Current Stock</th>
                  <th className="p-4 text-center">Incoming POs</th>
                  <th className="p-4 text-center">Sales Demand</th>
                  <th className="p-4 text-center">Projected Stock</th>
                  <th className="p-4 text-center">Reorder Point</th>
                  <th className="p-4 text-center">Suggested Order Qty</th>
                  <th className="p-4 text-right">Estimated Cost (AED)</th>
                  <th className="p-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {currentDisplayList.map((item) => {
                  const isSelected = selectedIds.includes(item.id);
                  const isGeneratingThis = singleGeneratingId === item.id;
                  const estimatedCostFils = item.suggestedQty * item.defaultPurchasePrice;

                  return (
                    <tr
                      key={item.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                        isSelected ? "bg-blue-50/50 dark:bg-blue-950/20" : ""
                      }`}
                    >
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{item.itemName}</div>
                        <div className="text-xs font-mono text-slate-500">{item.itemCode}</div>
                        {item.preferredSupplierName && item.preferredSupplierName !== "Unassigned" && (
                          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                            Supplier: {item.preferredSupplierName}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{item.brand}</div>
                        <div className="text-[10px] text-slate-400">{item.category}</div>
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800 dark:text-slate-200">
                        {item.currentStock}
                      </td>
                      <td className="p-4 text-center font-semibold text-blue-600 dark:text-blue-400">
                        +{item.incomingQty}
                      </td>
                      <td className="p-4 text-center font-semibold text-amber-600 dark:text-amber-400">
                        {item.salesDemandQty && item.salesDemandQty > 0 ? `-${item.salesDemandQty}` : "0"}
                      </td>
                      <td className="p-4 text-center font-bold">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${
                            item.projectedStock <= item.reorderLevel
                              ? "bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300"
                              : "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                          }`}
                        >
                          {item.projectedStock}
                        </span>
                      </td>
                      <td className="p-4 text-center text-slate-600 dark:text-slate-400 font-medium">
                        {item.reorderPoint}
                      </td>
                      <td className="p-4 text-center">
                        <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg font-bold text-xs">
                          {item.suggestedQty} PCS
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(estimatedCostFils)}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => generateSinglePO(item)}
                          disabled={isGeneratingThis || generating}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
                          title="Generate Draft Purchase Order for this item"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {isGeneratingThis ? "Creating..." : "Generate Draft PO"}
                        </button>
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
