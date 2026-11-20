"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Edit,
  Phone,
  Mail,
  MapPin,
  Building,
  CreditCard,
  FileText,
  Truck,
  ShoppingCart,
  FolderOpen,
  DollarSign,
  Calendar,
  AlertCircle
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default function SupplierDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pos");

  useEffect(() => {
    if (params.id) {
      fetchSupplier();
    }
  }, [params.id]);

  const fetchSupplier = async () => {
    try {
      const res = await fetch(`/api/suppliers/${params.id}`);
      if (!res.ok) throw new Error("Failed to load supplier");
      const json = await res.json();
      setData(json);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading supplier profile...</p>
      </div>
    );
  }

  if (!data || !data.supplier) {
    return (
      <div className="p-12 text-center">
        <p className="text-slate-500">Supplier not found</p>
        <Link href="/suppliers" className="mt-4 inline-block text-blue-600 text-sm font-semibold hover:underline">
          Return to suppliers
        </Link>
      </div>
    );
  }

  const { supplier, metrics } = data;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/suppliers"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                {supplier.supplierId}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{supplier.name}</h1>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  supplier.status === "ACTIVE"
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                }`}
              >
                {supplier.status}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {supplier.country} • Payment Terms: {supplier.paymentTerms} • Default Currency: {supplier.currency}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href={`/suppliers/${supplier.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Edit className="w-4 h-4" />
            Edit Supplier Info
          </Link>
        </div>
      </div>

      {/* KPI Balances - Essential Separation of PO Balance vs Invoice Balance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500">Total Purchase Orders</p>
          <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {formatCurrency(metrics.totalPOValue, supplier.currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500">Total Payments Made</p>
          <p className="text-xl font-bold text-emerald-600 mt-1">
            {formatCurrency(metrics.totalPayments, supplier.currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500">PO Outstanding Balance</p>
          <p className="text-xl font-bold text-blue-600 mt-1">
            {formatCurrency(metrics.poBalance, supplier.currency)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho">
          <p className="text-xs font-medium text-slate-500">Invoice Unpaid Balance</p>
          <p className="text-xl font-bold text-amber-600 mt-1">
            {formatCurrency(metrics.invoiceBalance, supplier.currency)}
          </p>
        </div>
      </div>

      {/* Contact & Bank Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Contact Details</h3>
            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <p className="font-semibold">{supplier.contactPerson || "No contact person"}</p>
              {supplier.phone && (
                <p className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  {supplier.phone}
                </p>
              )}
              {supplier.email && (
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  {supplier.email}
                </p>
              )}
              {supplier.address && (
                <p className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  {supplier.address}
                </p>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Tax & Payment Terms</h3>
            <div className="space-y-1.5 text-slate-700 dark:text-slate-300">
              <p>
                <span className="text-slate-500">TRN:</span> {supplier.trn || "Not Registered"}
              </p>
              <p>
                <span className="text-slate-500">Currency:</span> {supplier.currency}
              </p>
              <p>
                <span className="text-slate-500">Terms:</span> {supplier.paymentTerms}
              </p>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">Bank Details</h3>
            <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
              {supplier.bankDetails || "No bank details recorded"}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 dark:border-slate-800">
        <div className="flex gap-6">
          {[
            { id: "pos", label: `Purchase Orders (${supplier.purchaseOrders.length})`, icon: ShoppingCart },
            { id: "payments", label: `Payments (${supplier.payments.length})`, icon: CreditCard },
            { id: "grns", label: `Goods Received (${supplier.grns.length})`, icon: Truck },
            { id: "invoices", label: `Invoices (${supplier.invoices.length})`, icon: FileText },
            { id: "documents", label: `Documents (${supplier.documents.length})`, icon: FolderOpen },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-1 border-b-2 text-sm font-semibold transition-all ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-500 hover:text-slate-700"
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {activeTab === "pos" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">PO Number</th>
                  <th className="px-6 py-3">Order Date</th>
                  <th className="px-6 py-3">Delivery Date</th>
                  <th className="px-6 py-3">Grand Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supplier.purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No purchase orders for this supplier yet.
                    </td>
                  </tr>
                ) : (
                  supplier.purchaseOrders.map((po: any) => (
                    <tr key={po.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-bold text-blue-600 font-mono text-xs">{po.poNumber}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(po.orderDate)}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">{formatDate(po.expectedDeliveryDate)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(po.grandTotal, po.currency)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                          {po.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link
                          href={`/purchase-orders/${po.id}`}
                          className="text-xs text-blue-600 font-semibold hover:underline"
                        >
                          View PO
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "payments" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Payment No</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Method</th>
                  <th className="px-6 py-3">Reference</th>
                  <th className="px-6 py-3">Amount</th>
                  <th className="px-6 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supplier.payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No payments recorded yet.
                    </td>
                  </tr>
                ) : (
                  supplier.payments.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-6 py-4 font-bold text-blue-600 font-mono text-xs">{p.paymentNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(p.paymentDate)}</td>
                      <td className="px-6 py-4 text-slate-700 font-medium">{p.paymentMethod}</td>
                      <td className="px-6 py-4 text-slate-500 text-xs">{p.bankReference || "-"}</td>
                      <td className="px-6 py-4 font-bold text-emerald-600">{formatCurrency(p.amount, p.currency)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "grns" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">GRN Number</th>
                  <th className="px-6 py-3">Received Date</th>
                  <th className="px-6 py-3">Received By</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supplier.grns.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                      No Goods Received Notes recorded yet.
                    </td>
                  </tr>
                ) : (
                  supplier.grns.map((g: any) => (
                    <tr key={g.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-blue-600 font-mono text-xs">{g.grnNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(g.receivedDate)}</td>
                      <td className="px-6 py-4 text-slate-700">{g.receivedBy}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">
                          {g.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/grn/${g.id}`} className="text-xs text-blue-600 font-semibold hover:underline">
                          View GRN
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "invoices" && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="px-6 py-3">Invoice Number</th>
                  <th className="px-6 py-3">Invoice Date</th>
                  <th className="px-6 py-3">Due Date</th>
                  <th className="px-6 py-3">Grand Total</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {supplier.invoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                      No purchase invoices created yet.
                    </td>
                  </tr>
                ) : (
                  supplier.invoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 font-bold text-blue-600 font-mono text-xs">{inv.invoiceNumber}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(inv.invoiceDate)}</td>
                      <td className="px-6 py-4 text-slate-600">{formatDate(inv.dueDate)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatCurrency(inv.grandTotal)}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 rounded-full text-[10px] font-bold uppercase bg-blue-100 text-blue-700">
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link href={`/invoices/${inv.id}`} className="text-xs text-blue-600 font-semibold hover:underline">
                          View Invoice
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="p-6">
            {supplier.documents.length === 0 ? (
              <p className="text-center text-slate-500 py-6">No documents attached to this supplier.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {supplier.documents.map((doc: any) => (
                  <div key={doc.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center gap-3">
                    <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div className="flex-1 truncate">
                      <p className="font-semibold text-sm truncate">{doc.title}</p>
                      <p className="text-xs text-slate-400">{doc.fileSize} • {doc.docType}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
