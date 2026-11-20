"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  Package,
  DollarSign,
  ArrowLeft,
  Edit,
  Clock,
  AlertTriangle,
  ShoppingCart,
  Truck,
  CheckCircle2,
  Calendar,
  Layers,
  Tag,
  Hash,
  ShieldAlert,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

interface POLine {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  purchaseOrder?: {
    id: string;
    poNumber: string;
    orderDate: string;
    status: string;
    currency: string;
    supplier?: {
      id: string;
      name: string;
    };
  };
}

interface GRNLine {
  id: string;
  orderedQuantity: number;
  newlyReceivedQty: number;
  condition: string;
  goodsReceivedNote?: {
    id: string;
    grnNumber: string;
    receivedDate: string;
    status: string;
  };
}

interface ProductDetail {
  id: string;
  itemCode: string;
  altItemCode?: string | null;
  oemCode?: string | null;
  barcode?: string | null;
  itemName: string;
  description?: string | null;
  brand: string;
  category: string;
  modelCompatibility?: string | null;
  unitOfMeasurement: string;
  purchaseUnit?: string;
  stockUnit?: string;
  conversionFactor?: number;
  currentStock: number;
  defaultPurchasePrice: number;
  currency: string;
  minStock?: number;
  maxStock?: number;
  reorderLevel?: number;
  reorderPoint?: number;
  safetyStock: number;
  avgDailyUsage?: number | null;
  supplierLeadTime?: number;
  leadTimeDays?: number;
  storageLocation?: string | null;
  status: string;
  productPicture?: string | null;
  poItems?: POLine[];
  grnItems?: GRNLine[];
}

export default function ProductDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data.product || data);
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load product details");
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="p-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-500 font-medium">Loading product details...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-16 text-center">
        <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-semibold">Product not found</p>
        <button
          onClick={() => router.push("/products")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
        >
          Back to Products
        </button>
      </div>
    );
  }

  const effectiveReorder = product.reorderLevel ?? product.reorderPoint ?? 0;
  const isLowStock = product.currentStock <= effectiveReorder;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/products")}
            className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
            title="Back to Products"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{product.itemName}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  product.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {product.status}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{product.itemCode}</span>
              {product.brand && <span>• Brand: {product.brand}</span>}
              {product.category && <span>• Category: {product.category}</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/products/${id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Stock on Hand</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold ${isLowStock ? "text-rose-600" : "text-slate-900 dark:text-white"}`}>
              {product.currentStock}
            </span>
            <span className="text-xs text-slate-400 font-bold">{product.unitOfMeasurement || "PCS"}</span>
          </div>
          {isLowStock && (
            <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Below Reorder Level
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Purchase Price</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(product.defaultPurchasePrice || 0, product.currency || "AED")}
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Default supplier rate</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Reorder Level</span>
            <ShieldAlert className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{effectiveReorder}</span>
            <span className="text-xs text-slate-400 font-bold">{product.unitOfMeasurement || "PCS"}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Reorder trigger threshold</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase tracking-wider">
            <span>Safety Stock</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{product.safetyStock ?? 15}</span>
            <span className="text-xs text-slate-400 font-bold">{product.unitOfMeasurement || "PCS"}</span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">Buffer stock allowance</p>
        </div>
      </div>

      {/* Product Information Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Product Specifications</h2>
          </div>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Item Code (SKU)</span>
            <p className="mt-1 font-mono font-bold text-slate-900 dark:text-white">{product.itemCode}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Alternative / Cross Code</span>
            <p className="mt-1 font-mono text-slate-700 dark:text-slate-300">{product.altItemCode || "—"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">OEM Number</span>
            <p className="mt-1 font-mono text-slate-700 dark:text-slate-300">{product.oemCode || "—"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Barcode</span>
            <p className="mt-1 font-mono text-slate-700 dark:text-slate-300">{product.barcode || "—"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Base UOM</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{product.unitOfMeasurement || "PCS"}</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Conversion Factor</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">
              1 {product.purchaseUnit || "BOX"} = {product.conversionFactor || 1} {product.unitOfMeasurement || "PCS"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Lead Time</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">{product.supplierLeadTime ?? product.leadTimeDays ?? 14} Days</p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Average Daily Usage</span>
            <p className="mt-1 font-bold text-slate-900 dark:text-white">
              {product.avgDailyUsage ? `${product.avgDailyUsage} units/day` : "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Model Compatibility</span>
            <p className="mt-1 text-slate-700 dark:text-slate-300 font-medium">{product.modelCompatibility || "Universal / Generic"}</p>
          </div>
        </div>
      </div>

      {/* Purchase Order History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Purchase Order History</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{product.poItems?.length || 0} order(s)</span>
        </div>
        {!product.poItems || product.poItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No purchase orders recorded for this item yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">PO Number</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3 text-center">Ordered Qty</th>
                  <th className="px-6 py-3 text-right">Unit Price</th>
                  <th className="px-6 py-3 text-right">Total</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {product.poItems.map((line) => (
                  <tr key={line.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-blue-600">
                      {line.purchaseOrder ? (
                        <Link href={`/purchase-orders/${line.purchaseOrder.id}`} className="hover:underline">
                          {line.purchaseOrder.poNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {line.purchaseOrder?.supplier?.name || "Direct Supplier"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                      {line.purchaseOrder?.orderDate ? formatDate(line.purchaseOrder.orderDate) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-bold text-slate-900 dark:text-white">
                      {line.quantity}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono text-slate-700 dark:text-slate-300">
                      {formatCurrency(line.unitPrice, line.purchaseOrder?.currency || product.currency || "AED")}
                    </td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(line.total, line.purchaseOrder?.currency || product.currency || "AED")}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400">
                        {line.purchaseOrder?.status || "ORDERED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Goods Received (GRN) History */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">Goods Received History (GRN)</h2>
          </div>
          <span className="text-xs text-slate-500 font-semibold">{product.grnItems?.length || 0} receipt(s)</span>
        </div>
        {!product.grnItems || product.grnItems.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">No receipt notes recorded for this item yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/40 text-slate-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="px-6 py-3">GRN Number</th>
                  <th className="px-6 py-3">Receipt Date</th>
                  <th className="px-6 py-3 text-center">Ordered Qty</th>
                  <th className="px-6 py-3 text-center">Received Qty</th>
                  <th className="px-6 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {product.grnItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-3.5 font-mono font-bold text-emerald-600">
                      {item.goodsReceivedNote?.grnNumber || "—"}
                    </td>
                    <td className="px-6 py-3.5 text-slate-600 dark:text-slate-400">
                      {item.goodsReceivedNote?.receivedDate ? formatDate(item.goodsReceivedNote.receivedDate) : "—"}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono text-slate-600 dark:text-slate-400">
                      {item.orderedQuantity}
                    </td>
                    <td className="px-6 py-3.5 text-center font-mono font-bold text-emerald-600">
                      {item.newlyReceivedQty}
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                        {item.goodsReceivedNote?.status || item.condition || "RECEIVED"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Option to Edit Product ALSO BELOW HISTORY (Explicit User Requirement) */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">Manage this Product</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Update pricing, inventory reorder thresholds, or unit configurations
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/products")}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-semibold transition-colors"
          >
            Back to Products
          </button>
          <Link
            href={`/products/${id}/edit`}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all hover:shadow-lg"
          >
            <Edit className="w-4 h-4" />
            <span>Edit Product</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
