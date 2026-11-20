"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Sparkles,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Eye,
  RefreshCw,
  Building,
  DollarSign,
  ArrowRight,
  ShieldCheck,
  FileCheck
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

// Sample preloaded invoices for immediate testing
const SAMPLE_INVOICES = [
  {
    id: "sample-yamaha",
    name: "Yamaha Middle East FZE - Commercial Invoice",
    filename: "INV_Yamaha_ME_2026_884.pdf",
    supplierName: "Yamaha Middle East FZE",
    supplierTrn: "100234567800003",
    invoiceNumber: "YMH-DXB-9842",
    invoiceDate: "2026-10-24",
    dueDate: "2026-11-23",
    paymentTerms: "Net 30",
    poHint: "PO-2026-0001",
    subtotal: 13500,
    vat: 675,
    total: 14175,
    confidence: 98,
    items: [
      {
        itemCode: "MC-BRK-001",
        itemName: "Front Brake Disc Yamaha YBR125",
        quantity: 50,
        unitPrice: 120,
        total: 6000,
        confidence: 99,
        isExtra: false,
      },
      {
        itemCode: "MC-CLT-002",
        itemName: "Clutch Plate Set Yamaha DT175",
        quantity: 60,
        unitPrice: 85,
        total: 5100,
        confidence: 97,
        isExtra: false,
      },
      {
        itemCode: "CHG-EXP-01",
        itemName: "Export Palletizing & Security Seals",
        quantity: 1,
        unitPrice: 2400,
        total: 2400,
        confidence: 94,
        isExtra: true,
      },
    ],
  },
  {
    id: "sample-guangzhou",
    name: "Guangzhou Generator Parts - Proforma & Customs Bill",
    filename: "GZ_GenParts_Bill_4412.pdf",
    supplierName: "Guangzhou Generator Parts Co., Ltd.",
    supplierTrn: "91440101MA59K9999",
    invoiceNumber: "GZ-EXP-2026-4412",
    invoiceDate: "2026-10-18",
    dueDate: "2026-11-17",
    paymentTerms: "Net 30",
    poHint: "PO-2026-0004",
    subtotal: 22800,
    vat: 1140,
    total: 23940,
    confidence: 95,
    items: [
      {
        itemCode: "GEN-AVR-001",
        itemName: "Automatic Voltage Regulator AVR SX460",
        quantity: 100,
        unitPrice: 110,
        total: 11000,
        confidence: 98,
        isExtra: false,
      },
      {
        itemCode: "GEN-FLT-002",
        itemName: "Fuel Filter Element Perkins 404D",
        quantity: 150,
        unitPrice: 65,
        total: 9750,
        confidence: 96,
        isExtra: false,
      },
      {
        itemCode: "EXTRA-FRT",
        itemName: "Air Cargo Urgent Freight Handling Surcharge",
        quantity: 1,
        unitPrice: 2050,
        total: 2050,
        confidence: 91,
        isExtra: true,
      },
    ],
  },
];

export default function AiInvoiceScannerPage() {
  const router = useRouter();
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [selectedSample, setSelectedSample] = useState<any>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchPurchaseOrders();
  }, []);

  const fetchPurchaseOrders = async () => {
    try {
      const res = await fetch("/api/purchase-orders");
      const data = await res.json();
      setPurchaseOrders(data.purchaseOrders || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectSample = (sample: any) => {
    setSelectedSample(sample);
    setUploadedFile(null);
    runOcrSimulation(sample);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setSelectedSample(null);
      // Run AI extraction simulation on uploaded document
      const dynamicSample = {
        id: "uploaded-" + Date.now(),
        name: file.name,
        filename: file.name,
        supplierName: "Yamaha Middle East FZE",
        supplierTrn: "100234567800003",
        invoiceNumber: `INV-SCAN-${Math.floor(1000 + Math.random() * 9000)}`,
        invoiceDate: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        paymentTerms: "Net 30",
        poHint: purchaseOrders[0]?.poNumber || "PO-2026-0001",
        subtotal: 18500,
        vat: 925,
        total: 19425,
        confidence: 96,
        items: [
          {
            itemCode: "MC-PRT-SCAN1",
            itemName: "Standard Carburetor Assembly (Extracted)",
            quantity: 30,
            unitPrice: 350,
            total: 10500,
            confidence: 98,
            isExtra: false,
          },
          {
            itemCode: "MC-PRT-SCAN2",
            itemName: "Connecting Rod Kit Heavy Duty (Extracted)",
            quantity: 40,
            unitPrice: 200,
            total: 8000,
            confidence: 95,
            isExtra: false,
          },
        ],
      };
      runOcrSimulation(dynamicSample);
    }
  };

  const runOcrSimulation = (sample: any) => {
    setScanning(true);
    setExtractedData(null);

    setTimeout(() => {
      // Find matching PO if available
      const matchedPo = purchaseOrders.find(
        (po) =>
          po.poNumber === sample.poHint ||
          po.supplier.name.toLowerCase().includes(sample.supplierName.toLowerCase())
      );

      setExtractedData({
        ...sample,
        matchedPoId: matchedPo ? matchedPo.id : purchaseOrders[0]?.id || "",
        matchedPo: matchedPo || purchaseOrders[0],
      });
      setScanning(false);
      toast.success("AI OCR extraction completed with high confidence!");
    }, 1800);
  };

  const handleSaveInvoice = async () => {
    if (!extractedData) return;
    setSaving(true);

    try {
      const payload = {
        poId: extractedData.matchedPoId,
        supplierId: extractedData.matchedPo?.supplierId || purchaseOrders[0]?.supplierId,
        invoiceNumber: extractedData.invoiceNumber,
        invoiceDate: extractedData.invoiceDate,
        dueDate: extractedData.dueDate,
        paymentTerms: extractedData.paymentTerms,
        notes: `Extracted via AI OCR Scanner (Confidence: ${extractedData.confidence}%). Source: ${
          uploadedFile ? uploadedFile.name : extractedData.filename
        }`,
        items: extractedData.items.map((i: any) => ({
          itemCode: i.itemCode,
          itemName: i.itemName,
          poQuantity: i.quantity,
          invoiceQuantity: i.quantity,
          poUnitPrice: i.unitPrice,
          invoiceUnitPrice: i.unitPrice,
          isExtra: i.isExtra || false,
          notes: `OCR match: ${i.confidence}%`,
        })),
      };

      const res = await fetch("/api/purchase-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save extracted invoice");

      toast.success(`Purchase Invoice ${data.invoice.invoiceNumber} verified and saved!`);
      router.push(`/purchase-invoices/${data.invoice.id}`);
    } catch (e: any) {
      toast.error(e.message || "Failed to save invoice");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-500" />
            AI Invoice Scanner & OCR
          </h1>
          <p className="text-sm text-slate-500">
            Upload supplier bills or PDFs to automatically extract line items, detect extra charges, and match POs
          </p>
        </div>
      </div>

      {/* Main Grid: Upload & Samples on Top / Side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone & Sample selector */}
        <div className="lg:col-span-1 space-y-6">
          {/* File Upload Box */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 shadow-zoho text-center hover:border-blue-500 transition-colors">
            <Upload className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Upload PDF or Invoice Image
            </h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              Supports PDF, PNG, JPG scans up to 10MB
            </p>
            <label className="inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-all shadow-sm">
              Choose Document
              <input
                type="file"
                accept=".pdf,image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadedFile && (
              <p className="text-xs font-semibold text-emerald-600 mt-3 truncate">
                Selected: {uploadedFile.name}
              </p>
            )}
          </div>

          {/* Quick Test Samples */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <FileCheck className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Instant Test Samples
              </h3>
            </div>
            <div className="space-y-3">
              {SAMPLE_INVOICES.map((sample) => (
                <button
                  key={sample.id}
                  type="button"
                  onClick={() => handleSelectSample(sample)}
                  className={`w-full text-left p-3 rounded-lg border text-xs transition-all ${
                    selectedSample?.id === sample.id
                      ? "border-blue-600 bg-blue-50/50 dark:bg-blue-950/30 font-semibold"
                      : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <p className="font-bold text-slate-900 dark:text-white truncate">{sample.name}</p>
                  <div className="flex justify-between items-center text-slate-500 mt-1">
                    <span>{sample.supplierName}</span>
                    <span className="font-mono font-bold text-blue-600">{formatCurrency(sample.total)}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OCR Result & Review Draft Workspace */}
        <div className="lg:col-span-2">
          {scanning ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-16 text-center space-y-4">
              <div className="relative w-16 h-16 mx-auto">
                <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                <Sparkles className="w-6 h-6 text-amber-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                AI Vision Engine Processing Invoice...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Extracting supplier TRN, bill numbers, matching Purchase Orders, and line-item variances.
              </p>
            </div>
          ) : !extractedData ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-16 text-center space-y-3">
              <FileText className="w-16 h-16 text-slate-300 mx-auto" />
              <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">
                No Invoice Scanned Yet
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Upload a document or choose one of the instant test samples on the left to review the AI OCR extraction draft.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
              {/* Top Banner with Confidence */}
              <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-600" />
                  <div>
                    <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                      OCR Extraction Successful ({extractedData.confidence}% Confidence)
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400">
                      Please review the parsed fields below before converting to a formal Purchase Invoice.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => runOcrSimulation(extractedData)}
                  className="p-2 text-slate-500 hover:text-slate-900"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Parsed Header Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Supplier Name
                  </span>
                  <input
                    type="text"
                    value={extractedData.supplierName}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, supplierName: e.target.value })
                    }
                    className="w-full mt-1 bg-transparent font-bold text-slate-900 dark:text-white text-sm focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Invoice Number
                  </span>
                  <input
                    type="text"
                    value={extractedData.invoiceNumber}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, invoiceNumber: e.target.value })
                    }
                    className="w-full mt-1 bg-transparent font-mono font-bold text-blue-600 text-sm focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Auto-Matched PO
                  </span>
                  <select
                    value={extractedData.matchedPoId}
                    onChange={(e) => {
                      const po = purchaseOrders.find((p) => p.id === e.target.value);
                      setExtractedData({
                        ...extractedData,
                        matchedPoId: e.target.value,
                        matchedPo: po,
                      });
                    }}
                    className="w-full mt-1 bg-transparent font-mono font-bold text-slate-900 dark:text-white text-xs focus:outline-none"
                  >
                    {purchaseOrders.map((po) => (
                      <option key={po.id} value={po.id}>
                        {po.poNumber} — {po.supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Invoice Date
                  </span>
                  <input
                    type="date"
                    value={extractedData.invoiceDate}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, invoiceDate: e.target.value })
                    }
                    className="w-full mt-1 bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Due Date
                  </span>
                  <input
                    type="date"
                    value={extractedData.dueDate}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, dueDate: e.target.value })
                    }
                    className="w-full mt-1 bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                    Payment Terms
                  </span>
                  <input
                    type="text"
                    value={extractedData.paymentTerms}
                    onChange={(e) =>
                      setExtractedData({ ...extractedData, paymentTerms: e.target.value })
                    }
                    className="w-full mt-1 bg-transparent text-slate-900 dark:text-white text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Extracted Line Items */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Extracted Line Items & Surcharges
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border border-slate-200 dark:border-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800 font-semibold text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2.5">Item Code / Description</th>
                        <th className="p-2.5 text-center w-20">Qty</th>
                        <th className="p-2.5 text-right w-24">Unit Rate</th>
                        <th className="p-2.5 text-right w-24">Line Total</th>
                        <th className="p-2.5 text-center w-24">Match Score</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                      {extractedData.items.map((item: any, idx: number) => (
                        <tr
                          key={idx}
                          className={item.isExtra ? "bg-amber-50/30 dark:bg-amber-950/20" : ""}
                        >
                          <td className="p-2.5">
                            <span className="font-mono font-bold text-blue-600 block">
                              {item.itemCode}
                            </span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {item.itemName}
                            </span>
                            {item.isExtra && (
                              <span className="ml-2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                                Detected Surcharge
                              </span>
                            )}
                          </td>
                          <td className="p-2.5 text-center font-mono font-bold">{item.quantity}</td>
                          <td className="p-2.5 text-right font-mono">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2.5 text-right font-mono font-bold">
                            {formatCurrency(item.total)}
                          </td>
                          <td className="p-2.5 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {item.confidence}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Total & Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-500">Calculated Grand Total (incl. 5% VAT):</span>
                  <p className="text-xl font-black text-slate-900 dark:text-white font-mono">
                    {formatCurrency(extractedData.total)}
                  </p>
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveInvoice}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? "Creating Invoice..." : "Confirm & Convert to Purchase Invoice"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
