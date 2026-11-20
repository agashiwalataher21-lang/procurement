"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Eye,
  ShoppingCart,
  Download,
  Edit,
  FileText,
  Trash2,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface PurchaseOrder {
  id: string;
  poNumber: string;
  orderDate: string;
  expectedDeliveryDate: string;
  status: string;
  currency: string;
  exchangeRate?: number;
  grandTotal: number;
  supplier: {
    id: string;
    name: string;
    supplierId: string;
  };
  items: any[];
  payments: any[];
  invoices?: any[];
}

export default function PurchaseOrdersPage() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await fetch("/api/purchase-orders");
      const data = await res.json();
      setOrders(data.purchaseOrders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, poNumber: string) => {
    if (window.confirm(`Are you sure you want to delete purchase order ${poNumber}? This action cannot be undone.`)) {
      try {
        const res = await fetch(`/api/purchase-orders/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to delete purchase order");
          return;
        }
        toast.success("Purchase order deleted successfully");
        fetchOrders();
      } catch (error) {
        console.error("Error deleting purchase order:", error);
        toast.error("An error occurred");
      }
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.supplier.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const isDelayedCount = orders.filter((o) => {
    const isDelayed =
      new Date() > new Date(o.expectedDeliveryDate) &&
      o.status !== "FULLY_RECEIVED" &&
      o.status !== "CLOSED" &&
      o.status !== "CANCELLED";
    return isDelayed;
  }).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Purchase Orders</h1>
          <p className="text-sm text-slate-500 mt-1">Create, approve, and track purchase orders with suppliers</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/purchase-orders/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New PO</span>
          </Link>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by PO Number or Supplier Name..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-shadow"
            >
              <option value="ALL">All Statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="PENDING_APPROVAL">Pending Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="PARTIALLY_RECEIVED">Partially Received</option>
              <option value="FULLY_RECEIVED">Fully Received</option>
              <option value="PARTIALLY_INVOICED">Partially Invoiced</option>
              <option value="FULLY_INVOICED">Fully Invoiced</option>
              <option value="CLOSED">Closed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-500">Loading purchase orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-12 text-center">
            <ShoppingCart className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No purchase orders found</p>
            <Link href="/purchase-orders/new" className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
              Create your first PO &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">PO Number</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Order Date</th>
                  <th className="px-6 py-3">Delivery Date</th>
                  <th className="px-6 py-3">Total Amount</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map((po) => {
                  const isDelayed =
                    new Date() > new Date(po.expectedDeliveryDate) &&
                    po.status !== "FULLY_RECEIVED" &&
                    po.status !== "CLOSED" &&
                    po.status !== "CANCELLED";

                  return (
                    <tr key={po.id} className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-blue-600 dark:text-blue-400">{po.poNumber}</td>
                      <td className="px-6 py-4">
                        <Link href={`/suppliers/${po.supplier.id}`} className="font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors">
                          {po.supplier.name}
                        </Link>
                        <p className="text-xs text-slate-400 font-mono">{po.supplier.supplierId}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(po.orderDate)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className={isDelayed ? "text-rose-600 font-bold" : "text-slate-600 dark:text-slate-400"}>
                            {formatDate(po.expectedDeliveryDate)}
                          </span>
                          {isDelayed && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-700">Delayed</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white font-mono">{formatCurrency(po.grandTotal, po.currency)}</div>
                        {po.currency && po.currency !== "AED" && (
                          <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                            AED {(po.grandTotal * (po.exchangeRate || 1)).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            po.status === "APPROVED"
                              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                              : po.status === "PENDING_APPROVAL"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                              : po.status === "FULLY_RECEIVED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : po.status === "PARTIALLY_RECEIVED"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
                              : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                          }`}
                        >
                          {po.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/purchase-orders/${po.id}`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-100 dark:text-slate-400 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/purchase-orders/${po.id}/edit`}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-amber-100 dark:text-slate-400 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-colors"
                            title="Edit"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(po.id, po.poNumber)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-100 dark:text-slate-400 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Showing <span className="font-bold text-slate-700 dark:text-slate-300">{filteredOrders.length}</span> of{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">{orders.length}</span> purchase orders
        </p>
        <div className="text-xs text-slate-400">{isDelayedCount} delayed</div>
      </div>
    </div>
  );
}
