"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, ShoppingCart, AlertCircle, Plus, X, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Product {
  id: string;
  itemCode: string;
  itemName: string;
  defaultPurchasePrice: number;
  currency: string;
}

export default function EditPurchaseOrderPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [formData, setFormData] = useState({
    poNumber: "",
    supplierId: "",
    orderDate: "",
    expectedDeliveryDate: "",
    currency: "AED",
    items: [] as any[],
    discountAmount: 0,
    shippingAmount: 0,
    otherExpensesAmount: 0,
    vatRate: 5,
    notes: "",
    status: "DRAFT",
  });
  const [showProductModal, setShowProductModal] = useState(false);

  useEffect(() => {
    if (params.id) {
      fetchPO();
      fetchProducts();
    }
  }, [params.id]);

  const fetchPO = async () => {
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}`);
      if (!res.ok) throw new Error("Failed to load PO");
      const json = await res.json();
      const po = json.purchaseOrder;
      setFormData({
        poNumber: po.poNumber || "",
        supplierId: po.supplierId || "",
        orderDate: po.orderDate ? po.orderDate.split("T")[0] : new Date().toISOString().split("T")[0],
        expectedDeliveryDate: po.expectedDeliveryDate ? po.expectedDeliveryDate.split("T")[0] : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        currency: po.currency || "AED",
        items: po.items || [],
        discountAmount: po.discountAmount || 0,
        shippingAmount: po.shippingAmount || 0,
        otherExpensesAmount: po.otherExpensesAmount || 0,
        vatRate: 5,
        notes: po.notes || "",
        status: po.status || "DRAFT",
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch PO details");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (product) {
      setFormData((prev) => ({
        ...prev,
        items: [
          ...prev.items,
          {
            id: `new-${Date.now()}`,
            productId: product.id,
            itemCode: product.itemCode,
            itemName: product.itemName,
            quantity: 1,
            unitPrice: product.defaultPurchasePrice,
            discount: 0,
            total: product.defaultPurchasePrice,
          },
        ],
      }));
      setShowProductModal(false);
    }
  };

  const handleRemoveItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    setFormData((prev) => {
      const newItems = [...prev.items];
      const item = { ...newItems[index] };

      if (field === "quantity" || field === "unitPrice" || field === "discount") {
        const qty = parseFloat(value) || 0;
        const price = parseFloat(item.unitPrice) || 0;
        const discount = parseFloat(value === "discount" ? value : item.discount) || 0;
        item.total = qty * price - discount;
      }

      item[field] = value;
      newItems[index] = item;

      return { ...prev, items: newItems };
    });
  };

  const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
  const principalAmount = Math.max(0, subtotal - formData.discountAmount);
  const vatAmount = principalAmount * (formData.vatRate / 100);
  const grandTotal = principalAmount + formData.shippingAmount + formData.otherExpensesAmount + vatAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.supplierId || formData.items.length === 0) {
      toast.error("Supplier and at least one item are required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/purchase-orders/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Failed to update PO");
      }

      toast.success("Purchase Order updated successfully");
      router.push(`/purchase-orders/${params.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading PO...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/purchase-orders/${params.id}`}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {formData.poNumber}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Purchase Order</h1>
            </div>
            <p className="text-sm text-slate-500">Update PO details, items, and reconciliation</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PO Details Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              PO Details
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                PO Number (read-only)
              </label>
              <input
                type="text"
                value={formData.poNumber}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Supplier *
              </label>
              <input
                type="text"
                value={formData.supplierId}
                readOnly
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              >
                <option value="AED">AED - UAE Dirham</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="INR">INR - Indian Rupee</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Order Date *
              </label>
              <input
                type="date"
                required
                value={formData.orderDate}
                onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Expected Delivery Date *
              </label>
              <input
                type="date"
                required
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Notes
              </label>
              <textarea
                rows={2}
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Line Items
            </h2>
            <button
              type="button"
              onClick={() => setShowProductModal(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Product
            </button>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-2.5 text-left font-semibold text-xs text-slate-600 dark:text-slate-400">Product</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-xs text-slate-600 dark:text-slate-400 w-36">Qty</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-xs text-slate-600 dark:text-slate-400 w-36">Unit Price</th>
                  <th className="px-4 py-2.5 text-right font-semibold text-xs text-slate-600 dark:text-slate-400 w-32">Total</th>
                  <th className="px-4 py-2.5 text-center font-semibold text-xs text-slate-600 dark:text-slate-400 w-14">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {formData.items.map((item: any, idx: number) => (
                  <tr key={item.id || idx}>
                    <td className="px-4 py-2.5">
                      <input
                        type="text"
                        value={item.itemName}
                        readOnly
                        className="w-full px-2 py-1 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-transparent"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, "quantity", e.target.value)}
                        className="w-32 px-3 py-1.5 text-center font-mono font-bold text-sm bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unitPrice}
                        onChange={(e) => handleItemChange(idx, "unitPrice", e.target.value)}
                        className="w-32 px-3 py-1.5 text-right font-mono font-bold text-sm bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 shadow-xs"
                      />
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {item.total.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/30 text-rose-600 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {formData.items.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">No items added yet. Click "Add Product" to add items.</p>
          )}

          {/* Add Product Modal */}
          {showProductModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 dark:text-white">Select Product</h3>
                  <button
                    type="button"
                    onClick={() => setShowProductModal(false)}
                    className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="p-4 overflow-y-auto max-h-[50vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {products.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => handleAddItem(product.id)}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-900 dark:text-white">{product.itemName}</p>
                          <p className="text-xs font-mono text-slate-500 mt-1">{product.itemCode}</p>
                          <p className="text-xs text-emerald-600 mt-1">{formatCurrency(product.defaultPurchasePrice, product.currency)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Totals Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-600" />
              Totals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Item Subtotal:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Discount (principal):</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountAmount}
                  onChange={(e) => setFormData({ ...formData, discountAmount: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-2 py-1 text-right font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Principal:</span>
                <span className="font-mono text-slate-900 dark:text-white">{formatCurrency(principalAmount)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Shipping:</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.shippingAmount}
                  onChange={(e) => setFormData({ ...formData, shippingAmount: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-2 py-1 text-right font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">Other Expenses:</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.otherExpensesAmount}
                  onChange={(e) => setFormData({ ...formData, otherExpensesAmount: parseFloat(e.target.value) || 0 })}
                  className="w-24 px-2 py-1 text-right font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                />
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">VAT Rate:</span>
                <select
                  value={[0, 0.5, 1, 2, 3, 5, 15, 25].includes(formData.vatRate) ? String(formData.vatRate) : "custom"}
                  onChange={(e) => setFormData({ ...formData, vatRate: parseFloat(e.target.value) || 0 })}
                  className="w-36 px-2 py-1 text-right font-mono text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"
                >
                  <option value="0">No VAT (0%)</option>
                  <option value="0.5">0.5%</option>
                  <option value="1">1%</option>
                  <option value="2">2%</option>
                  <option value="3">3%</option>
                  <option value="5">UAE VAT (5%)</option>
                  <option value="15">Standard VAT (15%)</option>
                  <option value="25">25%</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-600 dark:text-slate-400">VAT:</span>
                <span className="font-mono font-semibold text-slate-900 dark:text-white">{formatCurrency(vatAmount)}</span>
              </div>
            </div>

            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">Total Payable:</span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(grandTotal)}</span>
              </div>
              <p className="text-xs text-emerald-600/70 mt-2 text-right">{formData.currency}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/purchase-orders/${params.id}`}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
