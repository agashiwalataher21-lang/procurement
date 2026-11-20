"use client";

import React, { useEffect, useState } from "react";
import {
  Users,
  TrendingDown,
  TrendingUp,
  DollarSign,
  Clock,
  Package,
  AlertTriangle,
  ChevronRight,
  Filter,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface SupplierPrice {
  supplierId: string;
  supplierName: string;
  supplierCode: string;
  quotedPrice: number;
  previousPrice: number | null;
  moq: number;
  leadTimeDays: number;
  isCheapest: boolean;
  lastUpdated: string;
}

interface ProductComparison {
  productId: string;
  itemCode: string;
  itemName: string;
  brand: string;
  defaultPurchasePrice: number;
  supplierPrices: SupplierPrice[];
  cheapestSupplier: SupplierPrice | null;
  lastPurchasePrice: number | null;
  lastPurchaseSupplier: string | null;
  lastPurchaseDate: string | null;
  priceChangePercent: number | null;
  totalSuppliersQuoting: number;
}

export default function SupplierPriceComparisonPage() {
  const [comparisonData, setComparisonData] = useState<ProductComparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<ProductComparison | null>(null);

  useEffect(() => {
    fetchComparisonData();
  }, []);

  const fetchComparisonData = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/suppliers/price-comparison");
      const data = await res.json();
      setComparisonData(data.comparisonData || []);
      if (data.comparisonData?.length > 0) {
        setSelectedProduct(data.comparisonData[0]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load price comparison data");
    } finally {
      setLoading(false);
    }
  };

  const filteredData = comparisonData.filter(
    (p) =>
      p.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriceChangeIcon = (percent: number | null) => {
    if (percent === null) return null;
    if (percent > 0) return <TrendingUp className="w-4 h-4 text-rose-500" />;
    if (percent < 0) return <TrendingDown className="w-4 h-4 text-emerald-500" />;
    return null;
  };

  const getPriceChangeClass = (percent: number | null) => {
    if (percent === null) return "";
    if (percent > 0) return "text-rose-600 bg-rose-50 dark:bg-rose-950/30";
    if (percent < 0) return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30";
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-600" />
            Supplier Price Comparison
          </h1>
          <p className="text-sm text-slate-500">
            Side-by-side comparison of supplier quotations for the same items
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4">
        <div className="flex items-center gap-3">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Item Code, Product Name, or Brand..."
            className="flex-1 px-4 py-2 bg-transparent border-none focus:outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Products ({filteredData.length})
            </h2>
          </div>
          <div className="max-h-[600px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500">Loading...</div>
            ) : filteredData.length === 0 ? (
              <div className="p-8 text-center text-slate-500">No products found</div>
            ) : (
              filteredData.map((product) => (
                <button
                  key={product.productId}
                  onClick={() => setSelectedProduct(product)}
                  className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                    selectedProduct?.productId === product.productId ? "bg-blue-50 dark:bg-blue-950/30" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        {product.itemCode}
                      </div>
                      <div className="font-semibold text-sm text-slate-900 dark:text-white mt-0.5">
                        {product.itemName}
                      </div>
                      <div className="text-xs text-slate-500 mt-1">{product.brand}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {product.totalSuppliersQuoting} suppliers
                      </div>
                      {product.cheapestSupplier && (
                        <div className="text-xs font-bold text-emerald-600 mt-1">
                          {formatCurrency(product.cheapestSupplier.quotedPrice)}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Price Comparison Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProduct ? (
            <>
              {/* Product Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                        {selectedProduct.itemCode}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {selectedProduct.brand}
                      </span>
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {selectedProduct.itemName}
                    </h2>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-slate-500">Last Purchase</div>
                    <div className="font-semibold text-slate-900 dark:text-white">
                      {selectedProduct.lastPurchasePrice
                        ? formatCurrency(selectedProduct.lastPurchasePrice)
                        : "N/A"}
                    </div>
                    <div className="text-xs text-slate-500">
                      {selectedProduct.lastPurchaseSupplier || "No purchases"}
                    </div>
                  </div>
                </div>

                {/* Price Trend Alert */}
                {selectedProduct.priceChangePercent !== null && (
                  <div
                    className={`mt-4 p-3 rounded-lg flex items-center gap-3 ${getPriceChangeClass(
                      selectedProduct.priceChangePercent
                    )}`}
                  >
                    {getPriceChangeIcon(selectedProduct.priceChangePercent)}
                    <div className="flex-1">
                      <span className="font-semibold">
                        {selectedProduct.priceChangePercent > 0 ? "Price Increase" : "Price Decrease"}
                      </span>
                      <span className="text-sm ml-2">
                        vs. last purchase: {selectedProduct.priceChangePercent > 0 ? "+" : ""}
                        {selectedProduct.priceChangePercent?.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Supplier Comparison Table */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Supplier Quotations ({selectedProduct.supplierPrices.length})
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold text-xs uppercase">
                      <tr>
                        <th className="p-4">Rank</th>
                        <th className="p-4">Supplier</th>
                        <th className="p-4 text-right">Quoted Price</th>
                        <th className="p-4 text-right">MOQ</th>
                        <th className="p-4 text-center">Lead Time</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {selectedProduct.supplierPrices
                        .sort((a, b) => a.quotedPrice - b.quotedPrice)
                        .map((supplier, index) => (
                          <tr
                            key={supplier.supplierId}
                            className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                              supplier.isCheapest ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                            }`}
                          >
                            <td className="p-4">
                              <span
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  index === 0
                                    ? "bg-amber-400 text-amber-900"
                                    : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                                }`}
                              >
                                {index + 1}
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {supplier.supplierName}
                              </div>
                              <div className="text-xs text-slate-500">{supplier.supplierCode}</div>
                            </td>
                            <td className="p-4 text-right">
                              <div className="font-bold text-lg text-slate-900 dark:text-white">
                                {formatCurrency(supplier.quotedPrice)}
                              </div>
                              {supplier.previousPrice && (
                                <div
                                  className={`text-xs font-semibold ${
                                    supplier.quotedPrice < supplier.previousPrice
                                      ? "text-emerald-600"
                                      : supplier.quotedPrice > supplier.previousPrice
                                      ? "text-rose-600"
                                      : "text-slate-500"
                                  }`}
                                >
                                  {supplier.quotedPrice < supplier.previousPrice ? "↓" : "↑"}{" "}
                                  {formatCurrency(supplier.previousPrice)}
                                </div>
                              )}
                            </td>
                            <td className="p-4 text-right font-mono text-slate-600 dark:text-slate-400">
                              {supplier.moq} units
                            </td>
                            <td className="p-4 text-center">
                              <span className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-400">
                                <Clock className="w-3.5 h-3.5" />
                                {supplier.leadTimeDays} days
                              </span>
                            </td>
                            <td className="p-4">
                              {supplier.isCheapest && (
                                <span className="px-2 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded text-xs font-bold">
                                  BEST PRICE
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {selectedProduct.supplierPrices.length === 0 && (
                  <div className="p-8 text-center text-slate-500">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    <p>No supplier quotations found for this product</p>
                    <p className="text-xs mt-1">Add quotations via Supplier Management</p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-12 text-center">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">Select a product to view price comparison</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}