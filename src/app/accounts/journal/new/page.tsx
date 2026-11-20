"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { toast } from "sonner";

interface Account {
  id: string;
  code: string;
  name: string;
  type: string;
}

interface JournalLineForm {
  accountId: string;
  debit: string;
  credit: string;
}

export default function NewJournalEntryPage() {
  const router = useRouter();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<JournalLineForm[]>([
    { accountId: "", debit: "", credit: "" },
    { accountId: "", debit: "", credit: "" },
  ]);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      const res = await fetch("/api/accounts/chart-of-accounts");
      const data = await res.json();
      setAccounts(data.accounts || []);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load chart of accounts");
    } finally {
      setLoading(false);
    }
  };

  const handleLineChange = (index: number, field: keyof JournalLineForm, value: string) => {
    const updated = [...lines];
    updated[index] = { ...updated[index], [field]: value };
    setLines(updated);
  };

  const addLine = () => {
    setLines([...lines, { accountId: "", debit: "", credit: "" }]);
  };

  const removeLine = (index: number) => {
    if (lines.length <= 2) {
      toast.error("A journal entry requires at least two lines");
      return;
    }
    setLines(lines.filter((_, i) => i !== index));
  };

  const totalDebit = lines.reduce((s, l) => s + (parseFloat(l.debit) || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + (parseFloat(l.credit) || 0), 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01 && totalDebit > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    if (!isBalanced) {
      toast.error("Total Debit must equal Total Credit and be greater than 0");
      return;
    }
    for (let i = 0; i < lines.length; i++) {
      if (!lines[i].accountId) {
        toast.error(`Please select an account for line ${i + 1}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const payload = {
        date,
        description,
        sourceType: "MANUAL",
        lines: lines.map((l) => ({
          accountId: l.accountId,
          debit: Math.round((parseFloat(l.debit) || 0) * 100), // convert to fils
          credit: Math.round((parseFloat(l.credit) || 0) * 100), // convert to fils
        })),
      };

      const res = await fetch("/api/accounts/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create journal entry");

      toast.success(`Journal entry ${data.journal.journalNumber} created!`);
      router.push("/accounts/journal");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-16 text-center text-slate-500">Loading form...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/accounts"
          className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 hover:text-slate-900 transition-colors shadow-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Record Journal Entry</h1>
          <p className="text-sm text-slate-500">
            Manual double-entry adjustment voucher in base currency (AED)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Entry Date *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Description / Memo *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Month-end depreciation adjustment"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>
        </div>

        {/* Lines Grid */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white">Journal Lines (AED)</h3>
            <button
              type="button"
              onClick={addLine}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40"
            >
              <Plus className="w-3.5 h-3.5" /> Add Line
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3 text-left">Account</th>
                  <th className="px-4 py-3 text-right w-40">Debit (AED)</th>
                  <th className="px-4 py-3 text-right w-40">Credit (AED)</th>
                  <th className="px-4 py-3 w-12 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="px-4 py-3">
                      <select
                        required
                        value={line.accountId}
                        onChange={(e) => handleLineChange(idx, "accountId", e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="">Select Account...</option>
                        {accounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.code} - {acc.name} ({acc.type})
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={line.debit}
                        disabled={Boolean(line.credit && parseFloat(line.credit) > 0)}
                        onChange={(e) => handleLineChange(idx, "debit", e.target.value)}
                        className="w-full px-3 py-2 text-right font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={line.credit}
                        disabled={Boolean(line.debit && parseFloat(line.debit) > 0)}
                        onChange={(e) => handleLineChange(idx, "credit", e.target.value)}
                        className="w-full px-3 py-2 text-right font-mono font-bold bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-40"
                      />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeLine(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/20"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-800/60 font-bold border-t border-slate-200 dark:border-slate-700">
                <tr>
                  <td className="px-4 py-3 text-slate-700 dark:text-slate-300">Total</td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalDebit, "AED")}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-slate-900 dark:text-white">
                    {formatCurrency(totalCredit, "AED")}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold">
              {isBalanced ? (
                <span className="inline-flex items-center gap-1.5 text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" /> Balanced (AED {totalDebit.toFixed(2)})
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-rose-600">
                  <AlertCircle className="w-4 h-4" /> Difference: AED {Math.abs(totalDebit - totalCredit).toFixed(2)}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <Link
                href="/accounts"
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting || !isBalanced}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {submitting ? "Posting..." : "Post Journal Entry"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
