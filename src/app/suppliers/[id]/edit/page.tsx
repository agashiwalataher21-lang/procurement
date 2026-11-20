"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Building,
  Info,
  AlertCircle,
  CreditCard,
  Plus,
  Check,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { COUNTRIES, GLOBAL_CURRENCIES, getCountryRule } from "@/lib/countryRules";

export default function EditSupplierPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showCustomCurrency, setShowCustomCurrency] = useState(false);
  const [customCurrencyCode, setCustomCurrencyCode] = useState("");
  const [currenciesList, setCurrenciesList] = useState(GLOBAL_CURRENCIES);

  const [formData, setFormData] = useState({
    supplierId: "",
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
    status: "ACTIVE",
  });

  const activeRule = useMemo(() => {
    return getCountryRule(formData.country);
  }, [formData.country]);

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
      const s = json.supplier;

      // Check if custom currency is needed
      let curr = s.currency || "AED";
      if (!GLOBAL_CURRENCIES.some((c) => c.code === curr)) {
        setCurrenciesList((prev) => [
          { code: curr, name: `Custom (${curr})`, symbol: curr },
          ...prev,
        ]);
      }

      setFormData({
        supplierId: s.supplierId || "",
        name: s.name || "",
        contactPerson: s.contactPerson || "",
        phone: s.phone || "",
        email: s.email || "",
        address: s.address || "",
        country: s.country || "United Arab Emirates",
        trn: s.trn || "",
        secondaryTaxId: "",
        currency: curr,
        paymentTerms: s.paymentTerms || "30 Days",
        bankDetails: s.bankDetails || "",
        notes: s.notes || "",
        status: s.status || "ACTIVE",
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to fetch supplier details");
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (countryName: string) => {
    const rule = getCountryRule(countryName);
    setFormData((prev) => ({
      ...prev,
      country: rule.name,
      currency: rule.defaultCurrency,
    }));
    toast.info(`Updated financial rules for ${rule.flag} ${rule.name}`);
  };

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
    toast.success(`Currency ${code} selected!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Supplier name is required");
      return;
    }

    setSubmitting(true);
    try {
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
        notes: formData.notes.trim() || null,
        status: formData.status,
      };

      const res = await fetch(`/api/suppliers/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Failed to update supplier");

      toast.success("Supplier updated successfully! Updated details reflected across all modules.");
      router.push(`/suppliers/${params.id}`);
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-sm text-slate-500">Loading supplier...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/suppliers/${params.id}`}
            className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded">
                {formData.supplierId}
              </span>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Edit Supplier</h1>
            </div>
            <p className="text-sm text-slate-500">Update supplier details, tax jurisdiction, and settlement currency</p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-6">
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Country / Jurisdiction *
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
                Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
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
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* DYNAMIC FINANCIAL & BILLING DETAILS */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-6 space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Financial, Tax & Billing Rules ({activeRule.flag} {activeRule.name})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {activeRule.taxLabel}
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
                      placeholder="e.g. MYR, IDR, VND"
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
              </div>

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
                  <option value="Letter of Credit (LC)">Letter of Credit (LC)</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {activeRule.bankIdentifierLabel}
                </label>
                <textarea
                  rows={2}
                  value={formData.bankDetails}
                  onChange={(e) => setFormData({ ...formData, bankDetails: e.target.value })}
                  placeholder={activeRule.bankIdentifierPlaceholder}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Notes & Compliance Guidelines
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3">
          <Link
            href={`/suppliers/${params.id}`}
            className="px-5 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-sm font-semibold transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-semibold shadow-md transition-all"
          >
            <Save className="w-4 h-4" />
            {submitting ? "Updating..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
