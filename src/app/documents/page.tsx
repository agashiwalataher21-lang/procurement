"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  FolderOpen,
  Upload,
  Search,
  Filter,
  FileText,
  FileCheck,
  Building,
  Download,
  ExternalLink,
  Plus,
  CheckCircle2,
  Calendar,
  X,
  Pencil,
  Trash2
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface DocumentItem {
  id: string;
  title: string;
  docType: string;
  fileUrl: string;
  fileSize: string;
  mimeType: string;
  createdAt: string;
  uploadedBy: string;
  supplier: { id: string; name: string } | null;
  po: { id: string; poNumber: string } | null;
  invoice: { id: string; invoiceNumber: string } | null;
  grn: { id: string; grnNumber: string } | null;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedSupplier, setSelectedSupplier] = useState("ALL");
  // Edit/Delete modal state
  const [editTarget, setEditTarget] = useState<DocumentItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DocumentItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDocType, setEditDocType] = useState("QUOTATION");
  const [editSupplierId, setEditSupplierId] = useState("");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDocType, setNewDocType] = useState("QUOTATION");
  const [newSupplierId, setNewSupplierId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDocuments();
    fetchSuppliers();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const res = await fetch("/api/suppliers");
      const data = await res.json();
      setSuppliers(data.suppliers || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEdit = (doc: DocumentItem) => {
    setEditTarget(doc);
    setEditTitle(doc.title);
    setEditDocType(doc.docType);
    setEditSupplierId(doc.supplier?.id || "");
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTarget || !editTitle.trim()) {
      toast.error("Document title is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${editTarget.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          docType: editDocType,
          supplierId: editSupplierId || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update");

      toast.success("Document updated successfully!");
      setEditTarget(null);
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message || "Update failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;

    if (!confirm(`Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.`)) {
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/documents/${deleteTarget.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete document");

      toast.success("Document deleted successfully!");
      setDeleteTarget(null);
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message || "Delete failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error("Document title is required");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle,
          docType: newDocType,
          supplierId: newSupplierId || null,
          uploadedBy: "Taher / Procurement Manager",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to upload");

      toast.success("Document uploaded successfully!");
      setShowUploadModal(false);
      setNewTitle("");
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.message || "Upload failed");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.uploadedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.supplier && doc.supplier.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType = selectedType === "ALL" || doc.docType === selectedType;
    const matchesSupplier =
      selectedSupplier === "ALL" || (doc.supplier && doc.supplier.id === selectedSupplier);

    return matchesSearch && matchesType && matchesSupplier;
  });

  const getDocTypeBadge = (type: string) => {
    switch (type) {
      case "QUOTATION":
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400";
      case "PO":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
      case "INVOICE":
        return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
      case "GRN":
        return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
      case "CUSTOMS_DOC":
        return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-blue-600" />
            Documents & Attachments Repository
          </h1>
          <p className="text-sm text-slate-500">
            Centralized storage for supplier quotations, purchase orders, invoices, GRNs, and customs clearances
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
        >
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search documents by title, uploader, supplier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Document Types</option>
            <option value="QUOTATION">Quotations</option>
            <option value="PO">Purchase Orders</option>
            <option value="INVOICE">Invoices</option>
            <option value="GRN">Goods Received Notes (GRN)</option>
            <option value="CUSTOMS_DOC">Customs & Shipping</option>
            <option value="OTHER">Other Documents</option>
          </select>
        </div>

        <div>
          <select
            value={selectedSupplier}
            onChange={(e) => setSelectedSupplier(e.target.value)}
            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="ALL">All Suppliers</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Documents Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-sm text-slate-500">Loading documents...</p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No documents found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-6 py-3">Document Title</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Supplier</th>
                  <th className="px-6 py-3">Linkage Ref</th>
                  <th className="px-6 py-3">Uploaded Date</th>
                  <th className="px-6 py-3">Uploaded By</th>
                  <th className="px-6 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block">
                            {doc.title}
                          </span>
                          <span className="text-xs text-slate-400 font-mono">
                            {doc.fileSize} • {doc.mimeType}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${getDocTypeBadge(doc.docType)}`}>
                        {doc.docType.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-200">
                      {doc.supplier?.name || "General"}
                    </td>
                    <td className="px-6 py-4">
                      {doc.po && (
                        <Link href={`/purchase-orders/${doc.po.id}`} className="font-mono text-xs font-bold text-blue-600 hover:underline block">
                          {doc.po.poNumber}
                        </Link>
                      )}
                      {doc.invoice && (
                        <Link href={`/purchase-invoices/${doc.invoice.id}`} className="font-mono text-xs font-bold text-amber-600 hover:underline block">
                          {doc.invoice.invoiceNumber}
                        </Link>
                      )}
                      {doc.grn && (
                        <Link href={`/grn/${doc.grn.id}`} className="font-mono text-xs font-bold text-emerald-600 hover:underline block">
                          {doc.grn.grnNumber}
                        </Link>
                      )}
                      {!doc.po && !doc.invoice && !doc.grn && (
                        <span className="text-xs text-slate-400">Standalone</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatDate(doc.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                      {doc.uploadedBy}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(doc)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30 rounded-lg text-xs font-semibold text-blue-700 dark:text-blue-300 transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </button>
                        <button
                          onClick={() => setDeleteTarget(doc)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/30 rounded-lg text-xs font-semibold text-rose-700 dark:text-rose-300 transition-colors"
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

      {/* Edit Document Modal */}
      {editTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Pencil className="w-5 h-5 text-blue-600" />
                Edit Document
              </h3>
              <button
                onClick={() => setEditTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Document Type
                  </label>
                  <select
                    value={editDocType}
                    onChange={(e) => setEditDocType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="QUOTATION">Quotation</option>
                    <option value="PO">Purchase Order</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="GRN">Goods Received Note</option>
                    <option value="CUSTOMS_DOC">Customs & Shipping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Associated Supplier
                  </label>
                  <select
                    value={editSupplierId}
                    onChange={(e) => setEditSupplierId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">-- None / General --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditTarget(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-800 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-rose-100 dark:border-rose-800 pb-4">
              <h3 className="text-lg font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-600" />
                Delete Document
              </h3>
              <button
                onClick={() => setDeleteTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-300">
              Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{deleteTarget.title}"</strong>?
              This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={submitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-600" />
                Upload Procurement Document
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Document Title *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Yamaha Q3 Price Quotation 2026"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Document Type
                  </label>
                  <select
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="QUOTATION">Quotation</option>
                    <option value="PO">Purchase Order</option>
                    <option value="INVOICE">Invoice</option>
                    <option value="GRN">Goods Received Note</option>
                    <option value="CUSTOMS_DOC">Customs & Shipping</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                    Associated Supplier
                  </label>
                  <select
                    value={newSupplierId}
                    onChange={(e) => setNewSupplierId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="">-- None / General --</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Select File
                </label>
                <input
                  type="file"
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  {submitting ? "Uploading..." : "Save Document"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
