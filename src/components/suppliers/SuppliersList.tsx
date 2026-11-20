"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Eye,
  MapPin,
  Phone,
  Mail,
  PackagePlus,
  Truck,
  CreditCard,
  Users,
  MoreHorizontal,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface Supplier {
  id: string;
  supplierId: string;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  country: string;
  currency: string;
  paymentTerms: string;
  status: string;
  _count?: {
    purchaseOrders: number;
  };
}

export default function SuppliersList() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      try {
        const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
        if (!res.ok) {
          const error = await res.json();
          toast.error(error.error || "Failed to delete supplier");
          return;
        }
        toast.success("Supplier deleted successfully");
        fetchSuppliers();
      } catch (error) {
        console.error("Error deleting supplier:", error);
        toast.error("An error occurred");
      }
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSuppliers = suppliers.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.supplierId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.contactPerson && s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = filterStatus === "ALL" || s.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Suppliers</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage your supplier database and contacts
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/suppliers/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Supplier</span>
          </Link>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, ID, contact person..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-shadow"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-8 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-shadow"
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 transition-colors">
            <Filter className="w-4 h-4" />
            <span>Filter</span>
          </button>
        </div>
      </div>

      {/* Suppliers Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-slate-500">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No suppliers found</p>
            <Link
              href="/suppliers/new"
              className="inline-block mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Add your first supplier &rarr;
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">Supplier ID</th>
                  <th className="px-6 py-3">Supplier Name</th>
                  <th className="px-6 py-3">Contact Person</th>
                  <th className="px-6 py-3">Country</th>
                  <th className="px-6 py-3">Currency</th>
                  <th className="px-6 py-3">Payment Terms</th>
                  <th className="px-6 py-3 text-center">Status</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredSuppliers.map((supplier) => (
                  <tr
                    key={supplier.id}
                    className="hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                      {supplier.supplierId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {supplier.name}
                        </span>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          {supplier.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {supplier.phone}
                            </span>
                          )}
                          {supplier.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {supplier.email}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-700 dark:text-slate-300">
                      {supplier.contactPerson || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="font-medium text-slate-700 dark:text-slate-300">
                          {supplier.country}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs">
                        {supplier.currency}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 text-xs">
                      {supplier.paymentTerms}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          supplier.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {supplier.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/suppliers/${supplier.id}`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-blue-100 dark:text-slate-400 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          href={`/suppliers/${supplier.id}/edit`}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-amber-100 dark:text-slate-400 dark:hover:bg-amber-900/30 hover:text-amber-600 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(supplier.id, supplier.name)}
                          className="p-1.5 rounded-lg text-slate-600 hover:bg-rose-100 dark:text-slate-400 dark:hover:bg-rose-900/30 hover:text-rose-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 hover:text-slate-900 transition-colors">
                          <MoreHorizontal className="w-4 h-4" />
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

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-sm text-slate-500">
        <p>
          Showing <span className="font-bold text-slate-700 dark:text-slate-300">{filteredSuppliers.length}</span> of{" "}
          <span className="font-bold text-slate-700 dark:text-slate-300">{suppliers.length}</span> suppliers
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSearchQuery("")}
            className="px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
          >
            Reset Filters
          </button>
        </div>
      </div>
    </div>
  );
}
