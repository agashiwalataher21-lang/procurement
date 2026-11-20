"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  FileSpreadsheet,
  Edit,
  Trash2,
  Package,
  Wrench,
  CheckCircle,
  X,
  Sheet,
  Image,
  MoreVertical,
  DollarSign,
  PackagePlus,
  Truck,
  CreditCard,
  Users,
  Eye
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  itemCode: string;
  itemName: string;
  description: string | null;
  brand: string;
  category: string;
  unitOfMeasurement: string;
  defaultPurchasePrice: number;
  currency: string;
  status: string;
  productPicture?: string | null;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.itemCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "ALL" || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleExportExcel = () => {
    const exportData = filteredProducts.map((p) => ({
      "Item Code": p.itemCode,
      "Item Name": p.itemName,
      Category: p.category,
      Brand: p.brand,
      UOM: p.unitOfMeasurement,
      "Default Purchase Price": p.defaultPurchasePrice,
      Currency: p.currency,
      Status: p.status,
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Products");
    XLSX.writeFile(workbook, "Bait_Al_Hadaf_Products.xlsx");
    toast.success("Products exported successfully to Excel");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let addedCount = 0;
        for (const row of data) {
          const itemCode = row["Item Code"] || row["itemCode"] || row["Code"];
          const itemName = row["Item Name"] || row["itemName"] || row["Name"];
          if (!itemCode || !itemName) continue;

          await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              itemCode: String(itemCode).trim(),
              itemName: String(itemName).trim(),
              brand: row["Brand"] || "Generic",
              category: row["Category"] || "Motorcycle Spare Parts",
              unitOfMeasurement: row["UOM"] || row["Unit"] || "PCS",
              defaultPurchasePrice: parseFloat(row["Default Purchase Price"] || row["Price"] || "0"),
              currency: "AED",
            }),
          });
          addedCount++;
        }

        toast.success(`Successfully imported ${addedCount} products`);
        setShowImportModal(false);
        fetchProducts();
      } catch (err) {
        console.error(err);
        toast.error("Failed to parse or import Excel file");
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      toast.success(`${deleteTarget.itemCode} deactivated successfully`);
      setDeleteTarget(null);
      fetchProducts();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete product");
    } finally {
      setDeleting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateLink = document.createElement("a");
    templateLink.href = "/import-template-products.csv";
    templateLink.download = "import-template-products.csv";
    document.body.appendChild(templateLink);
    templateLink.click();
    document.body.removeChild(templateLink);
    toast.success("Template downloaded successfully");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Product Management</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete inventory catalog for motorcycle & generator spare parts
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleImportClick}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span>Import</span>
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all shadow-sm"
          >
            <Sheet className="w-4 h-4" />
            <span>Template</span>
          </button>
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
          <Link
            href="/products/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
          />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Products</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">{products.length}</h3>
              <p className="text-xs text-slate-400 mt-2">All items in catalog</p>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Motorcycle Parts</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                {products.filter((p) => p.category === "Motorcycle Spare Parts").length}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Bikes & accessories</p>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl">
              <Wrench className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Generator Parts</p>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white">
                {products.filter((p) => p.category === "Generator Spare Parts").length}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Power generation</p>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-900/30 rounded-xl">
              <CheckCircle className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Value</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(
                  products.reduce((sum, p) => sum + p.defaultPurchasePrice, 0)
                )}
              </h3>
              <p className="text-xs text-slate-400 mt-2">Inventory valuation</p>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/30 rounded-xl">
              <DollarSign className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item code, product name, or brand..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-shadow"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 lg:flex-none">
              <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full lg:w-48 pl-10 pr-8 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent appearance-none cursor-pointer transition-shadow"
              >
                <option value="ALL">All Categories</option>
                <option value="Motorcycle Spare Parts">Motorcycle Spare Parts</option>
                <option value="Generator Spare Parts">Generator Spare Parts</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <MoreVertical className="w-4 h-4 text-slate-400 rotate-90" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-20 text-center">
            <div className="inline-block w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Loading product catalog...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-20 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 dark:bg-slate-900 rounded-full mb-6">
              <Package className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No products found</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Try adjusting your search or filter criteria</p>
            <div className="inline-flex">
              <Link
                href="/products/new"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Your First Product
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-4 w-20">Image</th>
                  <th className="px-6 py-4">Item Code</th>
                  <th className="px-6 py-4">Product Name</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Brand</th>
                  <th className="px-6 py-4">UOM</th>
                  <th className="px-6 py-4 text-right">Cost</th>
                  <th className="px-6 py-4 text-center">Status</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                        {p.productPicture ? (
                          <img src={p.productPicture} alt={p.itemName} className="w-full h-full object-cover" />
                        ) : (
                          <Image className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto mt-3" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono font-semibold text-slate-900 dark:text-white">{p.itemCode}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 dark:text-white">{p.itemName}</div>
                      {p.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate max-w-[200px]">{p.description}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                        {p.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-700 dark:text-slate-300">
                      {p.brand}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {p.unitOfMeasurement}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(p.defaultPurchasePrice, p.currency)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          p.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-600"
                        }`}
                      >
                        {p.status === "ACTIVE" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                      <Link
                        href={`/products/${p.id}`}
                        title={`View Details for ${p.itemCode}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 dark:text-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Details
                      </Link>
                      <Link
                        href={`/products/${p.id}/edit`}
                        title={`Edit ${p.itemCode}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 transition-colors"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        Edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(p)}
                        title={`Delete ${p.itemCode}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:text-rose-300 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Excel Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-blue-600 text-white px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-6 h-6" />
                <div>
                  <h3 className="font-bold text-lg">Import Products</h3>
                  <p className="text-xs text-blue-100 mt-0.5">Upload Excel or CSV file</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="p-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Template Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
                <h4 className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-3">
                  How to Import
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-400 mb-4 leading-relaxed">
                  Download the template, fill in your product data following the column order, then upload the file here.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-sm font-semibold text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Excel Template
                </button>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excel-file-input"
                  disabled={importing}
                />
                <label
                  htmlFor="excel-file-input"
                  className="cursor-pointer flex flex-col items-center"
                  onClick={() => setShowImportModal(false)}
                >
                  <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                    {importing ? "Processing and importing products..." : "Click to upload Excel spreadsheet"}
                  </span>
                  <span className="text-xs text-slate-400 mt-2">or drag and drop here</span>
                  <span className="text-[10px] text-slate-400 mt-1 bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded-full inline-block mt-3">
                    Supports .xlsx, .xls, .csv
                  </span>
                </label>
              </div>

              {/* Required Columns */}
              <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Required Columns:</h4>
                <div className="flex flex-wrap gap-2">
                  {["Item Code", "Item Name", "Brand", "Category", "UOM", "Price"].map((col, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded text-[10px] font-mono text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600"
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-end gap-3 bg-slate-50 dark:bg-slate-900/30">
              <button
                onClick={() => setShowImportModal(false)}
                className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Delete Product?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
                Are you sure you want to delete{" "}
                <span className="font-semibold text-slate-900 dark:text-white">{deleteTarget.itemCode}</span> —{" "}
                {deleteTarget.itemName}?
              </p>
              <p className="text-xs text-slate-500 mb-6">
                This will deactivate the product (set to INACTIVE). Existing purchase orders and transactions will not be affected.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  onClick={() => setDeleteTarget(null)}
                  disabled={deleting}
                  className="px-5 py-2.5 border border-slate-200 dark:border-slate-600 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  {deleting ? "Deleting..." : "Delete Product"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
