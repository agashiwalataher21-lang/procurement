"use client";

import Link from "next/link";
import { Search, ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <Search className="w-12 h-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-6xl font-bold text-slate-900 dark:text-white mb-4">404</h1>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Page Not Found</h2>
          <p className="text-slate-600 dark:text-slate-400">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-800 shadow-sm">
          <h3 className="font-semibold text-slate-900 dark:text-white mb-4">Popular Pages</h3>
          <div className="space-y-3">
            <Link
              href="/"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <Home className="w-4 h-4" />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/purchase-orders"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <span className="w-4 h-4 flex items-center justify-center font-bold text-sm">PO</span>
              <span>Purchase Orders</span>
            </Link>
            <Link
              href="/grn"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <span className="w-4 h-4 flex items-center justify-center font-bold text-sm">GRN</span>
              <span>Goods Received</span>
            </Link>
            <Link
              href="/invoices"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <span className="w-4 h-4 flex items-center justify-center font-bold text-sm">INV</span>
              <span>Purchase Invoices</span>
            </Link>
            <Link
              href="/payments"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <span className="w-4 h-4 flex items-center justify-center font-bold text-sm">PAY</span>
              <span>Payments</span>
            </Link>
            <Link
              href="/banking"
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300"
            >
              <span className="w-4 h-4 flex items-center justify-center font-bold text-sm">BNK</span>
              <span>Banking</span>
            </Link>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
