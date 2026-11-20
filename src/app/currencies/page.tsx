"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Coins,
  Plus,
  RefreshCw,
  Search,
  Check,
  Edit2,
  DollarSign,
  ArrowRightLeft,
  ShieldCheck,
  TrendingUp,
  X,
  Building,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/utils";

interface CurrencyItem {
  id: string;
  code: string;
  name: string;
  symbol: string;
  rateToAED: number;
  unitsPerAED: number;
  isBase: boolean;
  status: string;
  updatedAt: string;
}

export default function CurrenciesPage() {
  const [currencies, setCurrencies] = useState<CurrencyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUnitsPerAED, setEditUnitsPerAED] = useState<string>("");
  const [editRateToAED, setEditRateToAED] = useState<string>("");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Quick calculator state
  const [calcBaseAmount, setCalcBaseAmount] = useState<string>("1");
  const [calcTargetCode, setCalcTargetCode] = useState<string>("INR");

  // Add new currency modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newName, setNewName] = useState("");
  const [newSymbol, setNewSymbol] = useState("");
  const [newUnitsPerAED, setNewUnitsPerAED] = useState("");
  const [newRateToAED, setNewRateToAED] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/currencies");
      const data = await res.json();
      setCurrencies(data.currencies || []);
    } catch (e: any) {
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (c: CurrencyItem) => {
    setEditingId(c.id);
    setEditUnitsPerAED(c.unitsPerAED.toString());
    setEditRateToAED(c.rateToAED.toString());
  };

  const handleEditUnitsChange = (val: string) => {
    setEditUnitsPerAED(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setEditRateToAED((1 / num).toFixed(6));
    }
  };

  const handleEditRateChange = (val: string) => {
    setEditRateToAED(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      setEditUnitsPerAED((1 / num).toFixed(4));
    }
  };

  const handleSaveRate = async (id: string) => {
    const units = parseFloat(editUnitsPerAED);
    if (isNaN(units) || units <= 0) {
      toast.error("Please enter a valid rate greater than 0");
      return;
    }

    setSavingId(id);
    try {
      const res = await fetch(`/api/currencies/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitsPerAED: units }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update exchange rate");

      toast.success(`Exchange rate for ${data.currency.code} updated: 1 AED = ${data.currency.unitsPerAED} ${data.currency.code}`);
      setEditingId(null);
      fetchCurrencies();
    } catch (e: any) {
      toast.error(e.message || "Failed to save rate");
    } finally {
      setSavingId(null);
    }
  };

  const handleAddCurrency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim()) {
      toast.error("Currency Code and Name are required");
      return;
    }

    const units = parseFloat(newUnitsPerAED);
    if (isNaN(units) || units <= 0) {
      toast.error("Please provide a valid exchange rate (e.g. 26 for INR)");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/currencies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          name: newName.trim(),
          symbol: newSymbol.trim() || newCode.trim().toUpperCase(),
          unitsPerAED: units,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create currency");

      toast.success(`Currency ${data.currency.code} added successfully!`);
      setShowAddModal(false);
      setNewCode("");
      setNewName("");
      setNewSymbol("");
      setNewUnitsPerAED("");
      setNewRateToAED("");
      fetchCurrencies();
    } catch (e: any) {
      toast.error(e.message || "Failed to add currency");
    } finally {
      setCreating(false);
    }
  };

  const filteredCurrencies = useMemo(() => {
    return currencies.filter(
      (c) =>
        c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [currencies, searchQuery]);

  // Live calculator calculation
  const targetCurrency = currencies.find((c) => c.code === calcTargetCode);
  const calcResultForeign = targetCurrency
    ? (parseFloat(calcBaseAmount) || 0) * targetCurrency.unitsPerAED
    : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Coins className="w-6 h-6 text-amber-500" />
            Currency & Exchange Rate Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Configure settlement currencies, lock exchange rates (e.g. <span className="font-bold text-slate-700 dark:text-slate-300">1 AED = 26 INR</span>), and maintain central reporting standards
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchCurrencies}
            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            title="Refresh rates"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            Add Currency
          </button>
        </div>
      </div>

      {/* Live Interactive Currency Converter Card */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-blue-800/40 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">Live Exchange Rate Simulator</h3>
          </div>
          <span className="text-xs bg-blue-800/60 text-blue-200 px-3 py-1 rounded-full font-semibold border border-blue-700">
            Base Reporting Currency: AED (UAE Dirham)
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center pt-2">
          {/* Base AED */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10">
            <label className="text-xs text-blue-200 font-semibold block mb-1">AED Amount</label>
            <div className="flex items-center gap-2">
              <span className="font-bold text-amber-400 font-mono text-base">AED</span>
              <input
                type="number"
                min="0"
                step="any"
                value={calcBaseAmount}
                onChange={(e) => setCalcBaseAmount(e.target.value)}
                className="w-full bg-transparent text-xl font-bold font-mono focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-center text-slate-300">
            <span className="text-sm font-semibold bg-white/10 px-3 py-1 rounded-full border border-white/10">
              at current system rate
            </span>
          </div>

          {/* Target Foreign */}
          <div className="bg-white/10 rounded-xl p-3 border border-white/10 flex items-center justify-between">
            <div>
              <label className="text-xs text-blue-200 font-semibold block mb-1">
                Converted Equivalent
              </label>
              <div className="text-2xl font-black font-mono text-emerald-400">
                {targetCurrency?.symbol} {calcResultForeign.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <select
              value={calcTargetCode}
              onChange={(e) => setCalcTargetCode(e.target.value)}
              className="bg-slate-800 text-white font-bold text-sm px-3 py-1.5 rounded-lg border border-slate-700 focus:outline-none"
            >
              {currencies.filter((c) => !c.isBase).map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        {targetCurrency && (
          <p className="text-xs text-blue-200/80 pt-1">
            Current Rate: <span className="font-bold text-white font-mono">1 AED = {targetCurrency.unitsPerAED} {targetCurrency.code}</span> (or 1 {targetCurrency.code} = {targetCurrency.rateToAED} AED)
          </p>
        )}
      </div>

      {/* Currencies Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search currency code or name (e.g. INR, Rupee, USD)..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredCurrencies.length} currencies
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Currency</th>
                <th className="px-6 py-3.5">Symbol</th>
                <th className="px-6 py-3.5">1 AED Equals (e.g. 26 INR)</th>
                <th className="px-6 py-3.5">1 Foreign Unit in AED</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredCurrencies.map((c) => {
                const isEditing = editingId === c.id;

                return (
                  <tr
                    key={c.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${
                      c.isBase ? "bg-amber-50/40 dark:bg-amber-950/20" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-sm text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                          {c.code}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white text-sm">{c.name}</p>
                          {c.isBase && (
                            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
                              ★ Base Reporting Currency
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 font-mono font-bold text-base text-slate-700 dark:text-slate-300">
                      {c.symbol || c.code}
                    </td>

                    {/* Rate: 1 AED = X Foreign Currency */}
                    <td className="px-6 py-4 font-mono">
                      {c.isBase ? (
                        <span className="text-slate-500 font-bold">1.0000 (Base)</span>
                      ) : isEditing ? (
                        <div className="flex items-center gap-1.5 max-w-[160px]">
                          <span className="text-xs text-slate-400">1 AED =</span>
                          <input
                            type="number"
                            step="any"
                            min="0.0001"
                            value={editUnitsPerAED}
                            onChange={(e) => handleEditUnitsChange(e.target.value)}
                            className="w-24 px-2 py-1 bg-white dark:bg-slate-900 border-2 border-blue-500 rounded font-bold text-sm text-blue-600 focus:outline-none"
                            placeholder="e.g. 26"
                          />
                          <span className="text-xs font-bold text-slate-500">{c.code}</span>
                        </div>
                      ) : (
                        <span className="font-bold text-slate-900 dark:text-white">
                          1 AED = <span className="text-blue-600 dark:text-blue-400">{c.unitsPerAED}</span> {c.code}
                        </span>
                      )}
                    </td>

                    {/* Rate: 1 Foreign Unit = X AED */}
                    <td className="px-6 py-4 font-mono text-xs text-slate-600 dark:text-slate-400">
                      {c.isBase ? (
                        <span className="text-slate-500 font-bold">1.0000 AED</span>
                      ) : isEditing ? (
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>1 {c.code} =</span>
                          <span className="font-bold text-emerald-600">{editRateToAED}</span>
                          <span>AED</span>
                        </div>
                      ) : (
                        <span>
                          1 {c.code} = <strong className="text-emerald-600">{c.rateToAED}</strong> AED
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          c.status === "ACTIVE"
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800"
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {c.isBase ? (
                        <span className="text-xs text-slate-400 italic">Locked</span>
                      ) : isEditing ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            disabled={savingId === c.id}
                            onClick={() => handleSaveRate(c.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                          >
                            <Save className="w-3.5 h-3.5" />
                            {savingId === c.id ? "Saving..." : "Save Rate"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEditing(c)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg text-xs font-bold transition-all border border-blue-200 dark:border-blue-800"
                        >
                          <Edit2 className="w-3 h-3" />
                          Edit Rate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Currency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                Add New Currency
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCurrency} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Currency Code (ISO) *
                </label>
                <input
                  type="text"
                  maxLength={5}
                  required
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  placeholder="e.g. INR, USD, MYR, VND"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold uppercase focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Currency Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Indian Rupee / US Dollar"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={newSymbol}
                    onChange={(e) => setNewSymbol(e.target.value)}
                    placeholder="e.g. ₹, $, ¥"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    1 AED Equals *
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.000001"
                    required
                    value={newUnitsPerAED}
                    onChange={(e) => {
                      setNewUnitsPerAED(e.target.value);
                      const num = parseFloat(e.target.value);
                      if (!isNaN(num) && num > 0) {
                        setNewRateToAED((1 / num).toFixed(6));
                      }
                    }}
                    placeholder="e.g. 26"
                    className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-mono font-bold text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              {newUnitsPerAED && parseFloat(newUnitsPerAED) > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 font-mono">
                  1 AED = {newUnitsPerAED} {newCode || "CURR"} (1 {newCode || "CURR"} = {newRateToAED} AED)
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 rounded-lg text-sm font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all"
                >
                  {creating ? "Adding..." : "Add Currency"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
