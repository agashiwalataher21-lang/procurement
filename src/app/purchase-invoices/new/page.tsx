"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  FileText,
  Building,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  DollarSign,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  History,
  RefreshCw,
  Minus,
  Plus as PlusIcon,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";
import ItemContextPanel, { prefetchItemHistory } from "@/components/items/ItemContextPanel";

interface InvoiceItemForm {
  productId?: string;
  itemCode: string;
  itemName: string;
  poQuantity: number;
  invoiceQuantity: number;
  poUnitPrice: number;
  invoiceUnitPrice: number;
  discount: number;
  isExtra: boolean;
  notes: string;
}

const VAT_PRESETS = [0, 0.5, 1, 2, 3, 5, 15, 25];
const CURRENCY_OPTIONS = [
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "QAR", symbol: "﷼", name: "Qatari Riyal" },
  { code: "OMR", symbol: "ر.ع.", name: "Omani Rial" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
];

function NewPurchaseInvoiceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preSelectedPoId = searchParams.get("poId") || "";

  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currenciesList, setCurrenciesList] = useState(CURRENCY_OPTIONS);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [customCurrencyCode, setCustomCurrencyCode] = useState("");

  const [selectedPoId, setSelectedPoId] = useState(preSelectedPoId);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [currency, setCurrency] = useState("AED");
  const [exchangeRate, setExchangeRate] = useState(1.0);

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [paymentTerms, setPaymentTerms] = useState("Net 30");
  const [notes, setNotes] = useState("");
  const [density, setDensity] = useState<"compact" | "normal" | "spacious">("normal");

  // Tax & discount fields (fix #1, #4)
  const [discountAmount, setDiscountAmount] = useState(0);
  const [shippingAmount, setShippingAmount] = useState(0);
  const [otherExpensesAmount, setOtherExpensesAmount] = useState(0);
  const [vatRate, setVatRate] = useState(5);

  const [items, setItems] = useState<InvoiceItemForm[]>([]);
  const [activeContextProductId, setActiveContextProductId] = useState<string | null>(null);
  const [activeContextIndex, setActiveContextIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchEligiblePOs();
  }, []);

  // Item context — non-modal panel; clicking History or a line row opens it.
  const openItemContext = useCallback((index: number) => {
    const item = items[index];
    if (!item?.productId) {
      toast.error("No product linked to this line — cannot load history");
      return;
    }
    setActiveContextIndex(index);
    setActiveContextProductId(item.productId);
    prefetchItemHistory(item.productId);
  }, [items]);

  const closeItemContext = useCallback(() => {
    setActiveContextProductId(null);
    setActiveContextIndex(null);
  }, []);

  const fetchEligiblePOs = async () => {
    try {
      const res = await fetch("/api/purchase-orders");
      const data = await res.json();
      const pos = data.purchaseOrders || [];
      setPurchaseOrders(pos);

      if (preSelectedPoId) {
        loadPoDetails(preSelectedPoId);
        setSelectedPoId(preSelectedPoId);
      } else if (pos.length > 0) {
        setSelectedPoId(pos[0].id);
        loadPoDetails(pos[0].id);
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load purchase orders");
    } finally {
      setLoading(false);
    }
  };

  const loadPoDetails = async (poId: string) => {
    try {
      const res = await fetch(`/api/purchase-orders/${poId}`);
      const data = await res.json();
      if (data.purchaseOrder) {
        const po = data.purchaseOrder;
        setSelectedPo(po);
        setInvoiceNumber(`INV-SUP-${po.poNumber.replace("PO-", "")}`);
        setCurrency(po.currency || "AED");
        setExchangeRate(po.exchangeRate || 1.0);

        const mappedItems: InvoiceItemForm[] = po.items.map((item: any) => ({
          productId: item.productId || undefined,
          itemCode: item.itemCode,
          itemName: item.itemName,
          poQuantity: item.quantity,
          invoiceQuantity: item.quantity,
          poUnitPrice: item.unitPrice,
          invoiceUnitPrice: item.unitPrice,
          discount: item.discount || 0,
          isExtra: false,
          notes: "",
        }));
        setItems(mappedItems);
        // Pre-fill tax & discount from PO
        setDiscountAmount(po.discountAmount || 0);
        setShippingAmount(po.shippingAmount || 0);
        setOtherExpensesAmount(po.otherExpensesAmount || 0);
        // Derive vatRate from PO vatAmount/principal if available
        const principal = Math.max(0, (po.subtotal || 0) - (po.discountAmount || 0));
        if (principal > 0 && po.vatAmount) {
          const derived = (po.vatAmount / principal) * 100;
          setVatRate(Math.round(derived * 10) / 10);
        } else {
          setVatRate(5);
        }
      }
    } catch (e) {
      console.error(e);
      toast.error("Failed to load PO details");
    }
  };

  const handlePoChange = (poId: string) => {
    setSelectedPoId(poId);
    loadPoDetails(poId);
  };

  const handleItemChange = (index: number, field: keyof InvoiceItemForm, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const addExtraItem = () => {
    setItems([
      ...items,
      {
        itemCode: "EXTRA-CHG",
        itemName: "Freight / Duty / Extra Spare Part",
        poQuantity: 0,
        invoiceQuantity: 1,
        poUnitPrice: 0,
        invoiceUnitPrice: 0,
        discount: 0,
        isExtra: true,
        notes: "Additional charge on supplier bill",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      toast.error("At least one line item is required");
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  // Computations — fix #1: same formula as PO (discount on principal, VAT on principal)
  const subtotal = items.reduce(
    (sum, item) => {
      const qty = parseFloat(String(item.invoiceQuantity)) || 0;
      const rate = parseFloat(String(item.invoiceUnitPrice)) || 0;
      const disc = parseFloat(String(item.discount)) || 0;
      return sum + (qty * rate - disc);
    },
    0
  );
  const disc = parseFloat(String(discountAmount)) || 0;
  const ship = parseFloat(String(shippingAmount)) || 0;
  const otherExp = parseFloat(String(otherExpensesAmount)) || 0;
  const rate = parseFloat(String(vatRate)) || 0;
  const principalAmount = Math.max(0, subtotal - disc);
  const vatAmount = (principalAmount * rate) / 100;
  const grandTotal = principalAmount + ship + otherExp + vatAmount;

  const poOriginalTotal = selectedPo?.grandTotal || 0;
  const variance = grandTotal - poOriginalTotal;

  // PO suggestion / billing status helpers — fix #5
  const selectedPoInvoices = selectedPo?.invoices || [];
  const billedCount = selectedPoInvoices.length;
  const billedTotal = selectedPoInvoices.reduce((s: number, inv: any) => s + (inv.grandTotal || 0), 0);
  const unbilledAmount = Math.max(0, poOriginalTotal - billedTotal);
  const billStatus = !selectedPo ? null : billedCount === 0 ? "NOT_BILLED" : unbilledAmount > 0.01 ? "PARTIALLY_BILLED" : "FULLY_BILLED";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPoId || !selectedPo) {
      toast.error("Please select a Purchase Order");
      return;
    }
    if (!invoiceNumber.trim()) {
      toast.error("Invoice number is required");
      return;
    }
    if (currency !== "AED" && (!exchangeRate || exchangeRate <= 0)) {
      toast.error("Valid exchange rate is required for foreign currency");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        poId: selectedPoId,
        supplierId: selectedPo.supplierId,
        invoiceNumber,
        invoiceDate,
        dueDate,
        paymentTerms,
        notes,
        currency,
        exchangeRate,
        discountAmount: disc,
        shippingAmount: ship,
        otherExpensesAmount: otherExp,
        vatRate: rate,
        items: items.map((item) => ({
          productId: item.productId,
          itemCode: item.itemCode,
          itemName: item.itemName,
          invoiceQuantity: item.invoiceQuantity,
          invoiceUnitPrice: item.invoiceUnitPrice,
          discount: item.discount,
          isExtra: item.isExtra,
        })),
      };

      const res = await fetch("/api/purchase-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to record invoice");

      toast.success(`Purchase Invoice ${data.invoice.invoiceNumber} recorded successfully!`);
      router.push(`/purchase-invoices/${data.invoice.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Loading purchase orders...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/purchase-invoices"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Record Purchase Invoice</h1>
            <p className="text-sm text-slate-500">
              Input vendor bill, reconcile variances with PO, and track line-item prices
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Invoice Metadata */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              Invoice & PO Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Purchase Order *
              </label>
              <select
                required
                value={selectedPoId}
                onChange={(e) => handlePoChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {purchaseOrders.map((po) => {
                  const invCount = (po.invoices || []).length;
                  return (
                    <option key={po.id} value={po.id}>
                      {po.poNumber} — {po.supplier?.name || ""} ({formatCurrency(po.grandTotal || 0)}) {invCount === 0 ? "• Bill Not Made" : `• ${invCount} bill(s)`}
                    </option>
                  );
                })}
              </select>
              {selectedPo && billStatus && (
                <div className={`mt-2 flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg ${
                  billStatus === "NOT_BILLED"
                    ? "bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300"
                    : billStatus === "PARTIALLY_BILLED"
                    ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300"
                    : "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                }`}>
                  {billStatus === "NOT_BILLED" && <AlertTriangle className="w-4 h-4 shrink-0" />}
                  {billStatus !== "NOT_BILLED" && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                  {billStatus === "NOT_BILLED" && (
                    <span>No bill has been made against this PO yet. Remaining billable: {formatCurrency(unbilledAmount)}</span>
                  )}
                  {billStatus === "PARTIALLY_BILLED" && (
                    <span>{billedCount} bill(s) made ({formatCurrency(billedTotal)} billed). Remaining: {formatCurrency(unbilledAmount)}</span>
                  )}
                  {billStatus === "FULLY_BILLED" && (
                    <span>Fully billed ({formatCurrency(billedTotal)}). Any further bill will be an over-bill.</span>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Vendor Invoice Number *
              </label>
              <input
                type="text"
                required
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                placeholder="e.g. YMH-INV-2026-99"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Currency (Locked to PO)
                </label>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Inherited from PO
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  disabled
                  value={`${currency} - ${currenciesList.find((c) => c.code === currency)?.name || currency}`}
                  className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 cursor-not-allowed"
                />
                <span className="px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-700 dark:text-slate-300">
                  {currenciesList.find((c) => c.code === currency)?.symbol || currency}
                </span>
              </div>
              {currency !== "AED" && (
                <div className="mt-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-center justify-between text-xs">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Exchange Rate to AED:</span>
                  <span className="font-mono font-bold text-blue-700 dark:text-blue-300">
                    1 {currency} = {exchangeRate} AED
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Table Density
              </label>
              <select
                value={density}
                onChange={(e) => setDensity(e.target.value as "compact" | "normal" | "spacious")}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="spacious">Spacious</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Supplier / Vendor
              </label>
              <input
                type="text"
                readOnly
                value={selectedPo?.supplier?.name || "Select PO"}
                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Due Date *
              </label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Payment Terms
              </label>
              <select
                value={paymentTerms}
                onChange={(e) => setPaymentTerms(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Immediate">Immediate / Advance</option>
                <option value="Net 15">Net 15 Days</option>
                <option value="Net 30">Net 30 Days</option>
                <option value="Net 60">Net 60 Days</option>
                <option value="Letter of Credit">Letter of Credit (LC)</option>
              </select>
            </div>
          </div>
        </div>

        {/* PO Comparison & Invoice Line Items */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Line Items Reconciliation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Compare PO quantities and prices directly with the supplier bill
              </p>
            </div>
            <button
              type="button"
              onClick={addExtraItem}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-lg text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Extra Fee / Unlisted Item
            </button>
          </div>

          {/* Table Density Toggle */}
          <div className="flex items-center justify-between px-2 py-2">
            <span className="text-xs text-slate-500 font-medium">Table Density:</span>
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
              {(["compact", "normal", "spacious"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDensity(d)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    density === d
                      ? "bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {d.charAt(0).toUpperCase() + d.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                <tr>
                  <th className="p-3">Item</th>
                  <th className="p-3 w-20 text-center">PO Qty</th>
                  <th className="p-3 w-24 text-center bg-blue-50/50 dark:bg-blue-950/20">Inv Qty *</th>
                  <th className="p-3 w-24 text-right">PO Rate</th>
                  <th className="p-3 w-28 text-right bg-blue-50/50 dark:bg-blue-950/20">Inv Rate *</th>
                  <th className="p-3 w-28 text-right">Total</th>
                  <th className="p-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.map((item, index) => {
                  const qty = parseFloat(String(item.invoiceQuantity)) || 0;
                  const ratePrice = parseFloat(String(item.invoiceUnitPrice)) || 0;
                  const itemDisc = parseFloat(String(item.discount)) || 0;
                  const lineTotal = qty * ratePrice - itemDisc;
                  const isQtyDiff = item.poQuantity > 0 && qty !== item.poQuantity;
                  const isPriceDiff = item.poUnitPrice > 0 && ratePrice !== item.poUnitPrice;

                  return (
                    <tr
                      key={index}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${
                        item.isExtra ? "bg-amber-50/30 dark:bg-amber-950/10" : ""
                      }`}
                    >
                      {/* Product & History */}
                      <td className={`
                        p-3
                        ${density === "compact" ? "py-1 px-2" : density === "spacious" ? "py-4 px-4" : "py-2.5 px-3"}
                      `}>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {item.isExtra ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 uppercase">
                                Extra
                              </span>
                            ) : (
                              <span className="font-mono text-xs font-bold text-blue-600">{item.itemCode}</span>
                            )}
                          </div>
                          {!item.isExtra && item.productId && (
                            <button
                              type="button"
                              onClick={() => openItemContext(index)}
                              onMouseEnter={() => prefetchItemHistory(item.productId!)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 border border-blue-200 dark:border-blue-800 transition-all shadow-xs"
                              title="View purchase history & pricing"
                            >
                              <History className="w-3.5 h-3.5" />
                              <span>History</span>
                            </button>
                          )}
                        </div>
                        <input
                          type="text"
                          value={item.itemName}
                          onChange={(e) => handleItemChange(index, "itemName", e.target.value)}
                          className={`w-full mt-1.5 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        />
                      </td>

                      {/* PO Qty */}
                      <td className={`
                        text-center font-mono text-xs text-slate-500 font-bold
                        ${density === "compact" ? "py-1" : density === "spacious" ? "py-4" : "py-2.5"}
                      `}>
                        {item.poQuantity}
                      </td>

                      {/* Inv Qty */}
                      <td className={`
                        text-center bg-blue-50/30 dark:bg-blue-950/10
                        ${density === "compact" ? "py-1" : density === "spacious" ? "py-4" : "py-2.5"}
                      `}>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          value={item.invoiceQuantity}
                          onChange={(e) =>
                            handleItemChange(index, "invoiceQuantity", parseFloat(e.target.value) || 0)
                          }
                          className={`w-full text-center px-2 py-1.5 bg-white dark:bg-slate-900 border-2 rounded-lg font-mono font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            density === "compact" ? "text-xs py-1" : density === "spacious" ? "text-base py-2" : "text-xs py-1.5"
                          } ${isQtyDiff ? "border-amber-500 text-amber-700 dark:text-amber-400" : "border-slate-300 dark:border-slate-600 focus:border-blue-600"}`}
                        />
                      </td>

                      {/* PO Rate */}
                      <td className={`
                        text-right font-mono text-xs text-slate-500
                        ${density === "compact" ? "py-1" : density === "spacious" ? "py-4" : "py-2.5"}
                      `}>
                        {item.poUnitPrice.toFixed(2)}
                      </td>

                      {/* Inv Rate */}
                      <td className={`
                        text-right bg-blue-50/30 dark:bg-blue-950/10
                        ${density === "compact" ? "py-1" : density === "spacious" ? "py-4" : "py-2.5"}
                      `}>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.invoiceUnitPrice}
                          onChange={(e) =>
                            handleItemChange(index, "invoiceUnitPrice", parseFloat(e.target.value) || 0)
                          }
                          className={`w-full text-right px-2 py-1.5 bg-white dark:bg-slate-900 border-2 rounded-lg font-mono font-bold text-slate-900 dark:text-white shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${
                            density === "compact" ? "text-xs py-1" : density === "spacious" ? "text-base py-2" : "text-xs py-1.5"
                          } ${isPriceDiff ? "border-amber-500 text-amber-700 dark:text-amber-400" : "border-slate-300 dark:border-slate-600 focus:border-blue-600"}`}
                        />
                      </td>

                      {/* Line Total */}
                      <td className={`
                        text-right font-mono font-bold text-sm text-slate-900 dark:text-white
                        ${density === "compact" ? "py-1" : density === "spacious" ? "py-4" : "py-2.5"}
                      `}>
                        {formatCurrency(lineTotal, currency)}
                      </td>

                      {/* Action */}
                      <td className={`
                        text-center
                        ${density === "compact" ? "py-1" : density === "spacious" ? "py-4" : "py-2.5"}
                      `}>
                        {item.isExtra && (
                          <button
                            type="button"
                            onClick={() => removeItem(index)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Remove line"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Item context — professional popup modal window */}
          {activeContextProductId && activeContextIndex != null && items[activeContextIndex] && (
            <ItemContextPanel
              anchor="modal"
              productId={activeContextProductId}
              itemName={items[activeContextIndex].itemName}
              itemCode={items[activeContextIndex].itemCode}
              onClose={closeItemContext}
            />
          )}

          {/* Header-level Discount / Shipping / VAT — fix #4 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Discount (on Principal)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Shipping
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={shippingAmount}
                onChange={(e) => setShippingAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Other Expenses
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={otherExpensesAmount}
                onChange={(e) => setOtherExpensesAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                VAT Rate *
              </label>
              <div className="flex gap-2">
                <select
                  value={VAT_PRESETS.includes(rate) ? String(rate) : "custom"}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v !== "custom") setVatRate(parseFloat(v));
                  }}
                  className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {VAT_PRESETS.map((p) => (
                    <option key={p} value={p}>{p === 5 ? "UAE VAT (5%)" : p === 0 ? "No VAT (0%)" : `${p}%`}</option>
                  ))}
                  <option value="custom">Custom</option>
                </select>
                {!VAT_PRESETS.includes(rate) && (
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={vatRate}
                    onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                    className="w-24 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                )}
              </div>
            </div>
          </div>

          {/* Variance & Totals Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
            {/* Variance indicator */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                PO vs Invoice Variance
              </span>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">PO Original Value:</span>
                <span className="font-mono font-bold">{formatCurrency(poOriginalTotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 dark:text-slate-400">This Invoice Total:</span>
                <span className="font-mono font-bold">{formatCurrency(grandTotal, currency)}</span>
              </div>
              <div className="flex items-center justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="font-semibold text-slate-800 dark:text-slate-200">Total Variance:</span>
                <span
                  className={`font-mono font-extrabold ${
                    Math.abs(variance) < 0.01
                      ? "text-emerald-600"
                      : variance > 0
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {variance > 0 ? `+${formatCurrency(variance, currency)}` : formatCurrency(variance, currency)}
                </span>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-2 text-sm text-right pr-2">
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Subtotal (qty × rate − line discount):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(subtotal, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Discount (on principal):</span>
                <span className="font-mono font-bold text-rose-600">
                  −{formatCurrency(disc, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Principal (taxable):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(principalAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Shipping:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(ship, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>Other Expenses:</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(otherExp, currency)}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-400">
                <span>VAT ({rate}% on principal):</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">
                  {formatCurrency(vatAmount, currency)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-blue-600 border-t border-slate-200 dark:border-slate-700 pt-2">
                <span>Grand Total ({currency}):</span>
                <span className="font-mono">{formatCurrency(grandTotal, currency)}</span>
              </div>
              {currency !== "AED" && (
                <div className="flex justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-1">
                  <span>AED Equivalent (Base @ {exchangeRate}):</span>
                  <span className="font-mono">
                    {formatCurrency(grandTotal * exchangeRate, "AED")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/purchase-invoices"
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
            {submitting ? "Saving Invoice..." : "Save Purchase Invoice"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function NewPurchaseInvoicePage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Loading invoice form...</div>}>
      <NewPurchaseInvoiceForm />
    </Suspense>
  );
}
