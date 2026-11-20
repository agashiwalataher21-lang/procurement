"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Package,
  Barcode,
  Calculator,
  Image as ImageIcon,
  Plus,
  RefreshCw,
  Check,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { GLOBAL_CURRENCIES } from "@/lib/countryRules";

const DEFAULT_CATEGORIES = [
  "Motorcycle Spare Parts",
  "Generator Spare Parts",
  "Electrical Components",
  "Lubricants & Filters",
  "Brakes & Suspension",
  "Body Parts",
  "Engine Components",
  "Transmission & Clutch",
  "Tires & Tubes",
];

const DEFAULT_BRANDS = [
  "Generic",
  "Yamaha",
  "Honda",
  "Suzuki",
  "Bajaj",
  "Kawasaki",
  "Perkins",
  "Brembo",
  "NGK",
  "Denso",
  "Bosch",
  "Koyo",
];

export default function NewProductPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  // Lists with "+ Add" capability
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [brands, setBrands] = useState<string[]>(DEFAULT_BRANDS);
  const [currencies, setCurrencies] = useState(GLOBAL_CURRENCIES);

  // Custom inline toggles
  const [customCategory, setCustomCategory] = useState("");
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const [customBrand, setCustomBrand] = useState("");
  const [isAddingBrand, setIsAddingBrand] = useState(false);

  const [customPurchaseUnit, setCustomPurchaseUnit] = useState("");
  const [isAddingPurchaseUnit, setIsAddingPurchaseUnit] = useState(false);

  const [customStockUnit, setCustomStockUnit] = useState("");
  const [isAddingStockUnit, setIsAddingStockUnit] = useState(false);

  const [customCurrency, setCustomCurrency] = useState("");
  const [isAddingCurrency, setIsAddingCurrency] = useState(false);

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
    purchaseUnit: "PCS",
    stockUnit: "PCS",
    unitCustom: "",
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
  });

  // Calculate Reorder Point Function
  const handleCalculateReorderPoint = () => {
    let avgDaily = parseFloat(formData.avgDailyUsage);
    const leadTime = parseInt(formData.supplierLeadTime, 10) || 14;
    const safety = parseFloat(formData.safetyStock) || 15;

    // If avgDailyUsage is empty or 0, estimate sensible daily velocity from Min Stock
    if (isNaN(avgDaily) || avgDaily <= 0) {
      const minStk = parseFloat(formData.minStock) || 10;
      avgDaily = Math.max(1, Math.round((minStk / leadTime) * 10) / 10);
      setFormData((prev) => ({ ...prev, avgDailyUsage: avgDaily.toString() }));
    }

    // Standard Inventory Formula: (Average Daily Usage × Lead Time) + Safety Stock
    const leadTimeDemand = Math.ceil(avgDaily * leadTime);
    const calculatedReorder = Math.ceil(leadTimeDemand + safety);
    const recommendedMaxStock = Math.max(parseFloat(formData.maxStock) || 0, calculatedReorder * 2);

    setFormData((prev) => ({
      ...prev,
      reorderLevel: calculatedReorder.toString(),
      maxStock: recommendedMaxStock.toString(),
      minStock: safety.toString(),
    }));

    toast.success(
      `Reorder Point Calculated: ${calculatedReorder} units (Lead Demand: ${leadTimeDemand} + Safety: ${safety})`,
      { duration: 4500 }
    );
  };

  const handleSaveCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    if (!categories.includes(trimmed)) {
      setCategories((prev) => [trimmed, ...prev]);
    }
    setFormData((prev) => ({ ...prev, category: trimmed }));
    setCustomCategory("");
    setIsAddingCategory(false);
    toast.success(`Category "${trimmed}" added!`);
  };

  const handleSaveCustomBrand = () => {
    const trimmed = customBrand.trim();
    if (!trimmed) return;
    if (!brands.includes(trimmed)) {
      setBrands((prev) => [trimmed, ...prev]);
    }
    setFormData((prev) => ({ ...prev, brand: trimmed }));
    setCustomBrand("");
    setIsAddingBrand(false);
    toast.success(`Brand "${trimmed}" added!`);
  };

  const handleSaveCustomPurchaseUnit = () => {
    const trimmed = customPurchaseUnit.trim().toUpperCase();
    if (!trimmed) return;
    setFormData((prev) => ({ ...prev, purchaseUnit: trimmed }));
    setCustomPurchaseUnit("");
    setIsAddingPurchaseUnit(false);
    toast.success(`Purchase Unit "${trimmed}" set!`);
  };

  const handleSaveCustomStockUnit = () => {
    const trimmed = customStockUnit.trim().toUpperCase();
    if (!trimmed) return;
    setFormData((prev) => ({ ...prev, stockUnit: trimmed }));
    setCustomStockUnit("");
    setIsAddingStockUnit(false);
    toast.success(`Stock Unit "${trimmed}" set!`);
  };

  const handleSaveCustomCurrency = () => {
    const code = customCurrency.trim().toUpperCase();
    if (!code || code.length < 2 || code.length > 5) {
      toast.error("Please enter a valid 3-letter currency code (e.g. INR, USD, MYR)");
      return;
    }
    if (!currencies.some((c) => c.code === code)) {
      setCurrencies((prev) => [{ code, name: `Custom (${code})`, symbol: code }, ...prev]);
    }
    setFormData((prev) => ({ ...prev, currency: code }));
    setCustomCurrency("");
    setIsAddingCurrency(false);
    toast.success(`Currency ${code} added & selected!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.itemCode.trim() || !formData.itemName.trim()) {
      toast.error("Item Code and Item Name are required");
      return;
    }

    setSubmitting(true);
    try {
      const resolvedUOM =
        formData.unitOfMeasurement === "CUSTOM" && formData.unitCustom.trim()
          ? formData.unitCustom.trim().toUpperCase()
          : formData.unitOfMeasurement;

      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          unitOfMeasurement: resolvedUOM,
          defaultPurchasePrice: parseFloat(formData.defaultPurchasePrice) || 0,
          conversionFactor: parseFloat(formData.conversionFactor) || 1,
          minStock: parseFloat(formData.minStock) || 10,
          maxStock: parseFloat(formData.maxStock) || 100,
          reorderLevel: parseFloat(formData.reorderLevel) || 25,
          safetyStock: parseFloat(formData.safetyStock) || 15,
          supplierLeadTime: parseInt(formData.supplierLeadTime, 10) || 14,
          avgDailyUsage: parseFloat(formData.avgDailyUsage) || 0,
          productPicture: formData.productPicture || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create product");

      toast.success("Product added to catalog successfully");
      router.push("/products");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/products"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Product</h1>
            <p className="text-sm text-slate-500">Add motorcycle or generator part with full specifications</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
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
              <input
                type="text"
                required
                value={formData.itemCode}
                onChange={(e) => setFormData({ ...formData, itemCode: e.target.value.toUpperCase() })}
                placeholder="e.g. YAM-DT175-001"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Alternative Code
              </label>
              <input
                type="text"
                value={formData.altItemCode}
                onChange={(e) => setFormData({ ...formData, altItemCode: e.target.value.toUpperCase() })}
                placeholder="Aftermarket or supplier code"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                OEM Code
              </label>
              <input
                type="text"
                value={formData.oemCode}
                onChange={(e) => setFormData({ ...formData, oemCode: e.target.value.toUpperCase() })}
                placeholder="Original manufacturer part #"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Barcode
              </label>
              <div className="relative">
                <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="Scan or enter barcode"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Brand Dropdown + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Brand / Manufacturer
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingBrand(!isAddingBrand)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingBrand ? "Cancel" : "+ Add Brand"}
                </button>
              </div>

              {!isAddingBrand ? (
                <select
                  value={formData.brand}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingBrand(true);
                    } else {
                      setFormData({ ...formData, brand: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {brands.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add New Brand...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customBrand}
                    onChange={(e) => setCustomBrand(e.target.value)}
                    placeholder="Enter brand name..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomBrand}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Category Dropdown + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Category
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCategory(!isAddingCategory)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingCategory ? "Cancel" : "+ Add Category"}
                </button>
              </div>

              {!isAddingCategory ? (
                <select
                  value={formData.category}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingCategory(true);
                    } else {
                      setFormData({ ...formData, category: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add New Category...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter category name..."
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomCategory}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Item Name *
              </label>
              <input
                type="text"
                required
                value={formData.itemName}
                onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                placeholder="e.g. Yamaha Engine Cylinder Block V2 for DT175"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Model Compatibility
              </label>
              <input
                type="text"
                value={formData.modelCompatibility}
                onChange={(e) => setFormData({ ...formData, modelCompatibility: e.target.value })}
                placeholder="e.g. Yamaha DT175 (1982-1990), DT200R, Honda CG125, Perkins 404D-22"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Product Picture URL
              </label>
              <div className="relative">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={formData.productPicture}
                  onChange={(e) => setFormData({ ...formData, productPicture: e.target.value })}
                  placeholder="https://example.com/product-image.jpg"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Description / Notes
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Fitment details, material specifications, OEM references..."
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Unit Conversions & Pricing */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Unit Conversions & Pricing</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Base UOM Dropdown */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Base UOM
              </label>
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
                  className="w-full mt-2 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg text-sm font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>

            {/* Purchase Unit Dropdown + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Purchase Unit
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingPurchaseUnit(!isAddingPurchaseUnit)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingPurchaseUnit ? "Cancel" : "+ Add"}
                </button>
              </div>

              {!isAddingPurchaseUnit ? (
                <select
                  value={formData.purchaseUnit}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingPurchaseUnit(true);
                    } else {
                      setFormData({ ...formData, purchaseUnit: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="PCS">PCS (Pieces)</option>
                  <option value="SET">SET</option>
                  <option value="BOX">BOX</option>
                  <option value="CARTON">CARTON</option>
                  <option value="PAIR">PAIR</option>
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add Custom Unit...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customPurchaseUnit}
                    onChange={(e) => setCustomPurchaseUnit(e.target.value.toUpperCase())}
                    placeholder="e.g. BUNDLE"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomPurchaseUnit}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              )}
            </div>

            {/* Stock Unit Dropdown + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Stock Unit
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingStockUnit(!isAddingStockUnit)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingStockUnit ? "Cancel" : "+ Add"}
                </button>
              </div>

              {!isAddingStockUnit ? (
                <select
                  value={formData.stockUnit}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingStockUnit(true);
                    } else {
                      setFormData({ ...formData, stockUnit: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="PCS">PCS (Pieces)</option>
                  <option value="SET">SET</option>
                  <option value="BOX">BOX</option>
                  <option value="PAIR">PAIR</option>
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add Custom Unit...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customStockUnit}
                    onChange={(e) => setCustomStockUnit(e.target.value.toUpperCase())}
                    placeholder="e.g. ROLL"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomStockUnit}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Conversion Factor
              </label>
              <div className="p-2.5 rounded-lg bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex items-center gap-2 text-sm">
                <span className="font-bold font-mono text-blue-800 dark:text-blue-200">1 {formData.purchaseUnit} =</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.conversionFactor}
                  onChange={(e) => setFormData({ ...formData, conversionFactor: e.target.value })}
                  className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-blue-300 rounded-lg text-xs font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="font-bold font-mono text-blue-800 dark:text-blue-200">{formData.stockUnit}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Default Purchase Cost
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.defaultPurchasePrice}
                onChange={(e) => setFormData({ ...formData, defaultPurchasePrice: e.target.value })}
                placeholder="0.00"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Currency Dropdown + Add Option */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Currency
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingCurrency(!isAddingCurrency)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" />
                  {isAddingCurrency ? "Cancel" : "+ Add"}
                </button>
              </div>

              {!isAddingCurrency ? (
                <select
                  value={formData.currency}
                  onChange={(e) => {
                    if (e.target.value === "__ADD_NEW__") {
                      setIsAddingCurrency(true);
                    } else {
                      setFormData({ ...formData, currency: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {currencies.map((c) => (
                    <option key={c.code} value={c.code}>
                      {c.code} - {c.name}
                    </option>
                  ))}
                  <option value="__ADD_NEW__" className="font-bold text-blue-600">
                    + Add Custom Currency...
                  </option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={5}
                    value={customCurrency}
                    onChange={(e) => setCustomCurrency(e.target.value.toUpperCase())}
                    placeholder="e.g. INR"
                    className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleSaveCustomCurrency}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm"
                  >
                    <Check className="w-3 h-3" /> Save
                  </button>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Avg Daily Usage (units/day)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.avgDailyUsage}
                onChange={(e) => setFormData({ ...formData, avgDailyUsage: e.target.value })}
                placeholder="e.g. 5"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Inventory Control Settings & Smart Reorder Point Calculator */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Inventory Control Settings</h2>
            </div>
            <button
              type="button"
              onClick={handleCalculateReorderPoint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Calculate Reorder Point
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Min Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Max Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxStock}
                onChange={(e) => setFormData({ ...formData, maxStock: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Reorder Level
              </label>
              <input
                type="number"
                min="0"
                value={formData.reorderLevel}
                onChange={(e) => setFormData({ ...formData, reorderLevel: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Safety Stock
              </label>
              <input
                type="number"
                min="0"
                value={formData.safetyStock}
                onChange={(e) => setFormData({ ...formData, safetyStock: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Lead Time (Days)
              </label>
              <input
                type="number"
                min="1"
                value={formData.supplierLeadTime}
                onChange={(e) => setFormData({ ...formData, supplierLeadTime: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="bg-blue-50/80 dark:bg-blue-950/30 p-4 rounded-xl border border-blue-200 dark:border-blue-900 flex items-start gap-3">
            <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900 dark:text-blue-300 space-y-1">
              <p className="font-bold">Automated Reorder Point Formula:</p>
              <p className="text-slate-600 dark:text-slate-400 font-mono">
                Reorder Point = (Average Daily Usage × Supplier Lead Time) + Safety Stock
              </p>
              <p className="text-slate-500">
                Clicking <strong>Calculate Reorder Point</strong> automatically computes your reorder threshold and optimizes maximum stock capacity.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/products"
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Saving Product..." : "Save Product"}
          </button>
        </div>
      </form>
    </div>
  );
}
