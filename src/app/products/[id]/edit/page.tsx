"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Package, Barcode, Calculator, Image as ImageIcon, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    itemCode: "",
    altItemCode: "",
    oemCode: "",
    barcode: "",
    itemName: "",
    description: "",
    brand: "Generic",
    category: "Motorcycle Spare Parts",
    modelCompatibility: "",
    unitOfMeasurement: "PCS",
    unitCustom: "",
    purchaseUnit: "PCS",
    stockUnit: "PCS",
    conversionFactor: "1",
    defaultPurchasePrice: "",
    currency: "AED",
    minStock: "10",
    maxStock: "100",
    reorderLevel: "25",
    safetyStock: "15",
    supplierLeadTime: "14",
    avgDailyUsage: "",
    productPicture: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    async function loadProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load product");

        const p = data.product || data;
        const standardUOMs = ["PCS", "SET", "BOX", "CARTON", "PAIR", "LITRE", "KG", "METER"];
        const currentUOM = p.unitOfMeasurement || "PCS";
        const isCustomUOM = !standardUOMs.includes(currentUOM);

        setFormData({
          itemCode: p.itemCode || "",
          altItemCode: p.altItemCode || "",
          oemCode: p.oemCode || "",
          barcode: p.barcode || "",
          itemName: p.itemName || "",
          description: p.description || "",
          brand: p.brand || "Generic",
          category: p.category || "Motorcycle Spare Parts",
          modelCompatibility: p.modelCompatibility || "",
          unitOfMeasurement: isCustomUOM ? "CUSTOM" : currentUOM,
          unitCustom: isCustomUOM ? currentUOM : "",
          purchaseUnit: p.purchaseUnit || "PCS",
          stockUnit: p.stockUnit || "PCS",
          conversionFactor: String(p.conversionFactor || 1),
          defaultPurchasePrice: String(p.defaultPurchasePrice || ""),
          currency: p.currency || "AED",
          minStock: String(p.minStock || 10),
          maxStock: String(p.maxStock || 100),
          reorderLevel: String(p.reorderLevel || 25),
          safetyStock: String(p.safetyStock || 15),
          supplierLeadTime: String(p.supplierLeadTime || 14),
          avgDailyUsage: String(p.avgDailyUsage || ""),
          productPicture: p.productPicture || "",
          status: p.status || "ACTIVE",
        });
      } catch (err: any) {
        toast.error(err.message || "Failed to load product");
        router.push("/products");
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode || !formData.itemName) {
      toast.error("Item Code and Item Name are required");
      return;
    }

    setSubmitting(true);
    try {
      const finalUOM =
        formData.unitOfMeasurement === "CUSTOM"
          ? formData.unitCustom.trim() || "PCS"
          : formData.unitOfMeasurement;

      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          unitOfMeasurement: finalUOM,
          defaultPurchasePrice: parseFloat(formData.defaultPurchasePrice) || 0,
          conversionFactor: parseFloat(formData.conversionFactor) || 1,
          minStock: parseFloat(formData.minStock) || 10,
          maxStock: parseFloat(formData.maxStock) || 100,
          reorderLevel: parseFloat(formData.reorderLevel) || 25,
          safetyStock: parseFloat(formData.safetyStock) || 15,
          supplierLeadTime: parseInt(formData.supplierLeadTime) || 14,
          productPicture: formData.productPicture || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      toast.success("Product updated successfully");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Product</h1>
            <p className="text-sm text-slate-500">Update product specifications and pricing</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Basic Information</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Item Code / SKU *
              </label>
              <input type="text" required value={formData.itemCode} onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Alternative Item Code</label>
              <input type="text" value={formData.altItemCode} onChange={(e) => setFormData({ ...formData, altItemCode: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">OEM Code</label>
              <input type="text" value={formData.oemCode} onChange={(e) => setFormData({ ...formData, oemCode: e.target.value.toUpperCase() })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Barcode</label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={formData.barcode} onChange={(e) => setFormData({ ...formData, barcode: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Brand / Manufacturer</label>
              <input type="text" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Category</label>
              <select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="Motorcycle Spare Parts">Motorcycle Spare Parts</option>
                <option value="Generator Spare Parts">Generator Spare Parts</option>
                <option value="Electrical Components">Electrical Components</option>
                <option value="Lubricants & Filters">Lubricants & Filters</option>
                <option value="Brakes & Suspension">Brakes & Suspension</option>
                <option value="Body Parts">Body Parts</option>
              </select>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Item Name *</label>
              <input type="text" required value={formData.itemName} onChange={(e) => setFormData({ ...formData, itemName: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Model Compatibility</label>
              <input type="text" value={formData.modelCompatibility} onChange={(e) => setFormData({ ...formData, modelCompatibility: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Product Picture URL</label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={formData.productPicture} onChange={(e) => setFormData({ ...formData, productPicture: e.target.value })} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
              </div>
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Description / Technical Specifications</label>
              <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Status</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Unit Conversions & Pricing</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Base UOM</label>
              <div>
                <select
                  value={formData.unitOfMeasurement}
                  onChange={(e) => {
                    if (e.target.value === "CUSTOM") {
                      setFormData({ ...formData, unitOfMeasurement: "CUSTOM", unitCustom: "" });
                    } else {
                      setFormData({ ...formData, unitOfMeasurement: e.target.value, unitCustom: "" });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="PCS">PCS (Pieces)</option>
                  <option value="SET">SET</option>
                  <option value="BOX">BOX</option>
                  <option value="CARTON">CARTON</option>
                  <option value="PAIR">PAIR</option>
                  <option value="LITRE">LITRE</option>
                  <option value="KG">KG</option>
                  <option value="METER">METER</option>
                  <option value="CUSTOM">+ Add Custom UOM...</option>
                </select>
                {formData.unitOfMeasurement === "CUSTOM" && (
                  <input
                    type="text"
                    value={formData.unitCustom}
                    onChange={(e) => setFormData({ ...formData, unitCustom: e.target.value.toUpperCase() })}
                    placeholder="e.g. PACK, CAN, BOTTLE"
                    className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-slate-400/40 dark:placeholder:text-slate-500/40 placeholder:italic"
                  />
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Purchase Unit</label>
              <select value={formData.purchaseUnit} onChange={(e) => setFormData({ ...formData, purchaseUnit: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="PCS">PCS (Pieces)</option><option value="SET">SET</option><option value="BOX">BOX</option><option value="CARTON">CARTON</option><option value="PAIR">PAIR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Stock Unit</label>
              <select value={formData.stockUnit} onChange={(e) => setFormData({ ...formData, stockUnit: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600">
                <option value="PCS">PCS (Pieces)</option><option value="SET">SET</option><option value="BOX">BOX</option><option value="CARTON">CARTON</option><option value="PAIR">PAIR</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Conversion Factor</label>
              <div className="p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-wrap items-center gap-2 text-sm">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span> 1
                </span>
                <span className="font-bold font-mono text-blue-800 dark:text-blue-200 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-700 min-w-[50px] text-center">
                  {formData.purchaseUnit}
                </span>
                <span className="text-xs text-slate-500 font-medium">=</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.conversionFactor}
                  onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-xs font-bold text-blue-800 dark:text-blue-200 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-xs text-slate-500 font-medium">x</span>
                <span className="font-bold font-mono text-blue-800 dark:text-blue-200 px-2 py-1 bg-white dark:bg-slate-900 rounded-lg border border-blue-200 dark:border-blue-700 min-w-[50px] text-center">
                  {formData.stockUnit}
                </span>
              </div>
              <div className="mt-2 text-[10px] text-slate-500 italic">
                e.g., 1 {formData.purchaseUnit} = {formData.conversionFactor || 1} {formData.stockUnit}
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Default Purchase Cost</label>
              <input type="number" step="0.01" value={formData.defaultPurchasePrice} onChange={(e) => setFormData({ ...formData, defaultPurchasePrice: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Average Daily Usage (units/day)</label>
              <input type="number" min="0" step="0.01" value={formData.avgDailyUsage} onChange={(e) => setFormData({ ...formData, avgDailyUsage: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 placeholder:text-slate-400/40 dark:placeholder:text-slate-500/40 placeholder:italic" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Supplier Lead Time (Days)</label>
              <input type="number" min="1" value={formData.supplierLeadTime} onChange={(e) => setFormData({ ...formData, supplierLeadTime: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Package className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Inventory Control Settings</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Min Stock</label><input type="number" min="0" value={formData.minStock} onChange={(e) => setFormData({ ...formData, minStock: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Max Stock</label><input type="number" min="0" value={formData.maxStock} onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Reorder Level</label><input type="number" min="0" value={formData.reorderLevel} onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
            <div><label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Safety Stock</label><input type="number" min="0" value={formData.safetyStock} onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600" /></div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">Calculate Reorder Point</label>
              <button type="button" onClick={() => {
                const avgDaily = parseFloat(formData.avgDailyUsage) || 0;
                const leadTime = parseInt(formData.supplierLeadTime) || 14;
                const safety = parseFloat(formData.safetyStock) || 15;
                const calculated = Math.ceil((avgDaily * leadTime) + safety);
                setFormData({ ...formData, reorderLevel: calculated.toString() });
              }} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-all">
                <RefreshCw className="w-3.5 h-3.5" /> Calculate Reorder Point
              </button>
              <div className="mt-2 text-[10px] text-slate-500 italic">
                Formula: ({formData.avgDailyUsage || 0} × {formData.supplierLeadTime || 14}) + {formData.safetyStock || 15} = {Math.ceil(((parseFloat(formData.avgDailyUsage) || 0) * (parseInt(formData.supplierLeadTime) || 14)) + (parseFloat(formData.safetyStock) || 15))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link href="/products" className="px-5 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold hover:bg-slate-100 transition-colors">Cancel</Link>
          <button type="submit" disabled={submitting} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50">
            <Save className="w-4 h-4" />
            {submitting ? "Saving..." : "Update Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
