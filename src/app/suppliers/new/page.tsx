"use client";

import React, { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Building,
  CreditCard,
  Plus,
  Check,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, GLOBAL_CURRENCIES, getCountryRule } from "@/lib/countryRules";

export default function NewSupplierPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [customCurrencyCode, setCustomCurrencyCode] = useState("");
  const [currenciesList, setCurrenciesList] = useState(GLOBAL_CURRENCIES);

  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    phone: "",
    email: "",
    address: "",
    country: "United Arab Emirates",
    trn: "",
    secondaryTaxId: "",
    currency: "AED",
    paymentTerms: "30 Days",
    bankDetails: "",
    notes: "",
  });

  // Current active country rules
  const activeRule = useMemo(() => {
    return getCountryRule(formData.country);
  }, [formData.country]);

  // Handle country switch: auto-adapt currency & financial rules
  const handleCountryChange = (countryName: string) => {
    const rule = getCountryRule(countryName);
    setFormData((prev) => ({
      ...prev,
      country: rule.name,
      // Automatically adapt currency to country standard if user hasn't chosen custom
      currency: rule.defaultCurrency,
      paymentTerms: rule.paymentTermsDefault || prev.paymentTerms,
    }));
    toast.info(`Updated financial rules for ${rule.flag} ${rule.name} (Tax: ${rule.taxLabel})`);
  };

  // Handle adding custom currency
  const handleAddCustomCurrency = () => {
    const code = customCurrencyCode.trim().toUpperCase();
    if (!code || code.length < 2 || code.length > 5) {
      toast.error("Please enter a valid 3-letter currency code (e.g. MYR, VND, IDR, QAR)");
      return;
    }

    if (!currenciesList.some((c) => c.code === code)) {
      setCurrenciesList((prev) => [
        { code, name: `Custom (${code})`, symbol: code },
        ...prev,
      ]);
    }

    setFormData((prev) => ({ ...prev, currency: code }));
    setCustomCurrencyCode("");
    setShowCustomCurrency(false);
    toast.success(`Currency ${code} added and selected!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSubmitting(true);
    try {
      // Pack secondary tax info into notes if present
      let combinedNotes = formData.notes.trim();
      if (formData.secondaryTaxId.trim() && activeRule.secondaryTaxLabel) {
        const secondaryTag = `[${activeRule.secondaryTaxLabel}: ${formData.secondaryTaxId.trim()}]`;
        if (!combinedNotes.includes(secondaryTag)) {
          combinedNotes = combinedNotes ? `${secondaryTag}\n${combinedNotes}` : secondaryTag;
        }
      }

      const payload = {
        name: formData.name.trim(),
        contactPerson: formData.contactPerson.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        address: formData.address.trim() || null,
        country: formData.country,
        trn: formData.trn.trim() || null,
        currency: formData.currency,
        paymentTerms: formData.paymentTerms,
        bankDetails: formData.bankDetails.trim() || null,
        notes: combinedNotes || null,
      };

      const res = await fetch("/api/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create supplier");
      }

      toast.success(`Supplier ${data.supplier.name} (${data.supplier.supplierId}) registered successfully!`);
      router.push("/suppliers");
    } catch (err: any) {
      toast.error(err.message || "An error occurred while registering supplier");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/suppliers"
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Add New Supplier
              <span className="text-sm font-normal px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                {activeRule.flag} {activeRule.name}
              </span>
            </h1>
            <p className="text-sm text-slate-500">
              Record a domestic or international vendor with localized tax, currency, and banking rules
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* General Information Card */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-4 h-4 text-blue-600" />
              General Vendor Information
            </h2>
            <span className="text-xs text-slate-400">* Required fields</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Supplier Legal Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Yamaha Motor Spare Parts Trading L.L.C. / Hero MotoCorp Ltd"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Country Dropdown List */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Country / Jurisdiction *</span>
                <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold lowercase">
                  (auto-adapts tax & currency)
                </span>
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleCountryChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {COUNTRIES.map((c) => (
                  <option key={c.code} value={c.name}>
                    {c.flag} {c.name} ({c.defaultCurrency})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Primary Contact Person
              </label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                placeholder="e.g. John Doe / Global Sales Lead"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Phone Number
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. +971 4 123 4567 / +91 22 1234 5678"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="e.g. billing@supplier-parts.com"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Registered Physical Address
              </label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="e.g. Industrial Area 3, Al Quoz / MIDC Industrial Estate, Mumbai"
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* DYNAMIC FINANCIAL & BILLING DETAILS (ACCORDING TO COUNTRY RULES) */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                Financial, Tax & Billing Rules ({activeRule.flag} {activeRule.name})
              </h2>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <ShieldCheck className="w-3.5 h-3.5" />
                Standard Tax Rate: {activeRule.taxRateStandard}%
              </span>
            </div>

            {/* Country Rule Information Badge */}
            <div className="p-3.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-300 flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Localized Statutory Rules Active:</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Tax field configured for <strong>{activeRule.taxLabel}</strong>. {activeRule.taxDescription}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dynamic Primary Tax Field (TRN in UAE, GSTIN in India, USCI in China, EIN in US) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{activeRule.taxLabel}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">Official Tax ID</span>
                </label>
                <input
                  type="text"
                  value={formData.trn}
                  onChange={(e) => setFormData({ ...formData, trn: e.target.value.toUpperCase() })}
                  placeholder={activeRule.taxPlaceholder}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">{activeRule.taxDescription}</p>
              </div>

              {/* Dynamic Secondary Registration Number (PAN in India, Commercial License in UAE, CR in KSA) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {activeRule.secondaryTaxLabel || "Commercial Registration / License No."}
                </label>
                <input
                  type="text"
                  value={formData.secondaryTaxId}
                  onChange={(e) => setFormData({ ...formData, secondaryTaxId: e.target.value.toUpperCase() })}
                  placeholder={activeRule.secondaryTaxPlaceholder || "Registration Number"}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {activeRule.secondaryTaxDescription || "Official local corporate registry reference"}
                </p>
              </div>

              {/* Currency Selection + Custom Currency Adding Option */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Settlement Currency *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCustomCurrency(!showCustomCurrency)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    {showCustomCurrency ? "Select Existing" : "+ Add Currency"}
                  </button>
                </div>

                {!showCustomCurrency ? (
                  <select
                    value={formData.currency}
                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {currenciesList.map((cur) => (
                      <option key={cur.code} value={cur.code}>
                        {cur.code} - {cur.name} ({cur.symbol})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={5}
                      value={customCurrencyCode}
                      onChange={(e) => setCustomCurrencyCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MYR, IDR, VND, QAR"
                      className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-blue-400 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomCurrency}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Save
                    </button>
                  </div>
                )}
                <p className="text-[11px] text-slate-500 mt-1">
                  Selected: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formData.currency}</span> (Standard for {activeRule.name})
                </p>
              </div>

              {/* Payment Terms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Payment Terms
                </label>
                <select
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Immediate / Cash">Immediate / Cash</option>
                  <option value="15 Days">Net 15 Days</option>
                  <option value="30 Days">Net 30 Days</option>
                  <option value="45 Days">Net 45 Days</option>
                  <option value="60 Days">Net 60 Days</option>
                  <option value="90 Days">Net 90 Days</option>
                  <option value="Advance Payment">100% Advance Payment</option>
                  <option value="50% Advance, 50% on Delivery">50% Advance / 50% On Delivery</option>
                  <option value="Letter of Credit (LC)">Letter of Credit (LC / Irrevocable)</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">Default terms for procurement contracts & invoices</p>
              </div>

              {/* Dynamic Banking Instructions */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>{activeRule.bankIdentifierLabel}</span>
                  <span className="text-[10px] text-slate-400">Domestic & International Wire Details</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.bankDetails}
                  onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                  placeholder={activeRule.bankIdentifierPlaceholder}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {/* Notes */}
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Special Procurement Notes & Compliance Guidelines
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="e.g. Authorized distributor for Yamaha OEM parts, lead time 14 days, shipments delivered via Jebel Ali Port"
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href="/suppliers"
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
          >
            <Building className="w-4 h-4" />
            {submitting ? "Registering Supplier..." : "Save Supplier"}
          </button>
        </div>
      </form>
    </div>
  );
}
