"use client";

import React, { useState } from "react";
import { Save, DollarSign, Building, ShieldCheck, Mail, User, Printer } from "lucide-react";
import { toast } from "sonner";

interface CompanySettings {
  companyName: string;
  trn: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  vatRate: number;
  defaultPaymentTerms: string;
  currencySymbol: string;
  fiscalYearStart: string;
  theme: "light" | "dark" | "system";
}

const defaultSettings: CompanySettings = {
  companyName: "BAIT AL HADAF GENERAL TRADING L.L.C.",
  trn: "100458928300003",
  email: "procurement@baitalhadaf.ae",
  phone: "+971 4 123 4567",
  address: "Dubai Logistics City, UAE",
  currency: "AED",
  vatRate: 5,
  defaultPaymentTerms: "Net 30",
  currencySymbol: "د.إ",
  fiscalYearStart: "01-01",
  theme: "light",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<CompanySettings>(defaultSettings);
  const [saving, setSaving] = useState(false);

  const handleChange = (field: keyof CompanySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    // Simulate API save
    setTimeout(() => {
      setSaving(false);
      toast.success("Company settings saved successfully!");
    }, 800);
  };

  const paymentTermsOptions = ["Immediate", "Net 7", "Net 15", "Net 30", "Net 60", "Letter of Credit"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Company Settings</h1>
          <p className="text-sm text-slate-500">
            Configure business profile, financial defaults, and system preferences
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - General Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Company Profile */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Building className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Company Profile</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => handleChange("companyName", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  TRN (Tax Registration Number)
                </label>
                <input
                  type="text"
                  value={settings.trn}
                  onChange={(e) => handleChange("trn", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Registered Address
                </label>
                <input
                  type="text"
                  value={settings.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Financial Settings */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <DollarSign className="w-5 h-5 text-slate-400" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Financial Configuration</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Default Currency
                </label>
                <select
                  value={settings.currency}
                  onChange={(e) => handleChange("currency", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                >
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="USD">USD (US Dollar)</option>
                  <option value="EUR">EUR (Euro)</option>
                  <option value="GBP">GBP (British Pound)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={settings.currencySymbol}
                  onChange={(e) => handleChange("currencySymbol", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Standard VAT Rate (%)
                </label>
                <input
                  type="number"
                  value={settings.vatRate}
                  onChange={(e) => handleChange("vatRate", parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Default Payment Terms
                </label>
                <select
                  value={settings.defaultPaymentTerms}
                  onChange={(e) => handleChange("defaultPaymentTerms", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                >
                  {paymentTermsOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Fiscal Year Start
                </label>
                <input
                  type="month"
                  value={settings.fiscalYearStart}
                  onChange={(e) => handleChange("fiscalYearStart", e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Theme Preference
                </label>
                <select
                  value={settings.theme}
                  onChange={(e) => handleChange("theme", e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold"
                >
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                  <option value="system">System Default</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              System Status
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30">
                <span className="text-sm text-slate-600 dark:text-slate-300">Database</span>
                <span className="px-2 py-1 rounded bg-emerald-100 text-emerald-700 text-xs font-bold">
                  Connected
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30">
                <span className="text-sm text-slate-600 dark:text-slate-300">Active Suppliers</span>
                <span className="font-bold text-blue-700 dark:text-blue-400">8</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-purple-50 dark:bg-purple-950/30">
                <span className="text-sm text-slate-600 dark:text-slate-300">Products</span>
                <span className="font-bold text-purple-700 dark:text-purple-400">247</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30">
                <span className="text-sm text-slate-600 dark:text-slate-300">Pending POs</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">3</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Export Data
            </h3>
            <div className="space-y-2">
              <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors">
                Export All Products to Excel
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors">
                Export PO History Report
              </button>
              <button className="w-full text-left px-4 py-2.5 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors">
                Export GRN Summary
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
