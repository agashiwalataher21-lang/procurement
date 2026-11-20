"use client";

import React, { useState, useEffect } from "react";
import {
  Sparkles,
  BarChart3,
  PieChart,
  TrendingUp,
  FileText,
  Calendar,
  Truck,
  Building,
  DollarSign,
  Package,
  Clock,
  Download,
  RefreshCw,
  Zap,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  BookOpen
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { toast } from "sonner";

interface ReportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  category: "financial" | "inventory" | "operational" | "supplier";
  estimatedTime: string;
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: "sales-summary",
    title: "Sales & Revenue Summary",
    description: "Comprehensive sales performance analysis with revenue breakdowns and trends",
    icon: BarChart3,
    category: "financial",
    estimatedTime: "30 seconds"
  },
  {
    id: "inventory-valuation",
    title: "Inventory Valuation Report",
    description: "Current stock values, slow-moving items, and overstock analysis",
    icon: Package,
    category: "inventory",
    estimatedTime: "45 seconds"
  },
  {
    id: "accounts-payable",
    title: "Accounts Payable Aging",
    description: "Outstanding payments to suppliers with aging brackets and due dates",
    icon: DollarSign,
    category: "financial",
    estimatedTime: "25 seconds"
  },
  {
    id: "supplier-performance",
    title: "Supplier Performance Analysis",
    description: "Delivery times, order accuracy, and supplier rating evaluation",
    icon: Building,
    category: "supplier",
    estimatedTime: "1 minute"
  },
  {
    id: "purchase-trends",
    title: "Purchase Order Trends",
    description: "PO volume analysis, lead times, and procurement efficiency metrics",
    icon: TrendingUp,
    category: "operational",
    estimatedTime: "40 seconds"
  },
  {
    id: "stock-levels",
    title: "Stock Level Analysis",
    description: "Current stock positions, reorder points, and stockout predictions",
    icon: AlertCircle,
    category: "inventory",
    estimatedTime: "35 seconds"
  },
  {
    id: "payment-summary",
    title: "Payment History & Status",
    description: "Complete payment tracking with transaction details and statuses",
    icon: RefreshCw,
    category: "financial",
    estimatedTime: "20 seconds"
  },
  {
    id: "custom-analysis",
    title: "Custom AI Analysis",
    description: "Ask the AI any question about your business data",
    icon: MessageSquare,
    category: "operational",
    estimatedTime: "1-2 minutes"
  }
];

export default function AIReportsPage() {
  const [activeReport, setActiveReport] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: 'user' | 'ai', message: string}[]>([]);
  const [generatedReports, setGeneratedReports] = useState<any[]>([]);

  const handleGenerateReport = async (reportId: string) => {
    setActiveReport(reportId);
    setIsGenerating(true);
    setReportData(null);

    toast.info("AI is analyzing your data... Please wait.");

    try {
      const res = await fetch('/api/ai-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: reportId }),
      });

      if (!res.ok) throw new Error('Failed to generate report');

      const data = await res.json();
      setReportData(data.report);
      setGeneratedReports(prev => [data.report, ...prev]);
      setIsGenerating(false);
      toast.success("AI report generated successfully!");
    } catch (error) {
      console.error('Report generation error:', error);
      setIsGenerating(false);
      toast.error("Failed to generate report. Please try again.");
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = { role: 'user' as const, message: chatInput };
    setChatHistory(prev => [...prev, userMsg]);
    const input = chatInput;
    setChatInput("");

    try {
      const res = await fetch('/api/ai-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportType: 'custom-analysis', query: input }),
      });

      if (!res.ok) throw new Error('Failed to get AI response');

      const data = await res.json();
      setChatHistory(prev => [...prev, {
        role: 'ai' as const,
        message: data.report.summary
      }]);
    } catch (error) {
      setChatHistory(prev => [...prev, {
        role: 'ai' as const,
        message: `I apologize, but I encountered an error processing your request. Could you please try again?`
      }]);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-purple-600" />
            AI Reports & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Fast, intelligent business insights powered by AI
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Analysis
          </span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          onClick={() => handleGenerateReport("custom-analysis")}
          className="col-span-1 md:col-span-2 lg:col-span-4 p-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-700 text-white cursor-pointer hover:shadow-lg hover:shadow-purple-500/20 transition-all"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold mb-1">Ask AI Anything</h3>
              <p className="text-purple-100 text-sm max-w-lg">
                Get instant answers about your business data. No report selection needed.
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-lg">
              <MessageSquare className="w-6 h-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Report Selection Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            Available AI Reports
          </h2>
          <span className="text-xs text-slate-500">
            {REPORT_OPTIONS.length} report types available
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_OPTIONS.map((report) => {
            const Icon = report.icon;
            return (
              <div
                key={report.id}
                onClick={() => handleGenerateReport(report.id)}
                className="group p-5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-600 dark:hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/10 transition-all cursor-pointer bg-slate-50 dark:bg-slate-800/50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${
                    report.category === 'financial' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                    report.category === 'inventory' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' :
                    report.category === 'supplier' ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30' :
                    'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                    {report.estimatedTime}
                  </span>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white mb-1 group-hover:text-blue-600 transition-colors">
                  {report.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                  {report.description}
                </p>
                <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
                  Generate Report <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Generated Reports Section */}
      {generatedReports.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Recent AI Reports
            </h3>
            <button
              onClick={() => setGeneratedReports([])}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              Clear History
            </button>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {generatedReports.map((report, idx) => (
              <div key={idx} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white">{report.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Generated: {formatDate(report.generatedAt)}</p>
                  </div>
                  <button
                    onClick={() => setReportData(report)}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    View Report
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Chat Interface */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900">
          <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-purple-600" />
            AI Chat Assistant
          </h3>
        </div>
        <div className="p-6">
          <div className="h-64 overflow-y-auto mb-4 space-y-3">
            {chatHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400 text-center">
                <Sparkles className="w-8 h-8 mb-2 opacity-50" />
                <p className="text-sm">Ask AI anything about your business data</p>
              </div>
            ) : (
              chatHistory.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                  }`}>
                    {msg.message}
                  </div>
                </div>
              ))
            )}
            {isGenerating && (
              <div className="flex justify-start">
                <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-2xl rounded-bl-none">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>
          <form onSubmit={handleChatSubmit} className="flex gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about sales, inventory, or any business metric..."
              className="flex-1 px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="submit"
              disabled={!chatInput.trim() || isGenerating}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Ask AI
            </button>
          </form>
        </div>
      </div>

      {/* Active Report Display */}
      {reportData && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-zoho overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{reportData.title}</h2>
              <p className="text-xs text-slate-500 mt-1">Generated by AI on {formatDate(reportData.generatedAt)}</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5" />
                Export PDF
              </button>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
              <h4 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                AI Summary
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                {reportData.summary}
              </p>
            </div>

            {reportData.keyInsights && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Key Insights
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportData.keyInsights.map((insight, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-slate-700 dark:text-slate-300">{insight}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reportData.data && (
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-3">
                  Detailed Data
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase">
                      <tr>
                        {Object.keys(reportData.data).map((key) => (
                          <th key={key} className="px-4 py-2">{key.replace(/_/g, " ")}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {Object.entries(reportData.data).map(([key, value], idx) => (
                          <td key={idx} className="px-4 py-2 text-slate-700 dark:text-slate-300">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
