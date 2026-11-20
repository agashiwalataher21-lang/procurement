"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingCart,
  CreditCard,
  Truck,
  FileText,
  FolderOpen,
  BarChart3,
  ShieldCheck,
  Settings,
  Wrench,
  Sparkles,
  Wallet,
  BookOpen,
  MoreVertical,
  Landmark,
  DollarSign,
  HandCoins,
  FileSpreadsheet,
  Coins,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/context/SidebarContext";

// Navigation groups for organized sidebar
const primaryNavigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Suppliers", href: "/suppliers", icon: Users },
  { name: "Products", href: "/products", icon: Package },
  { name: "Purchase Orders", href: "/purchase-orders", icon: ShoppingCart },
  { name: "Payments", href: "/payments", icon: CreditCard },
];

const salesNavigation = [
  { name: "Sales Invoices", href: "/sales-invoices", icon: DollarSign },
  { name: "Sales Receipts", href: "/sales-receipts", icon: HandCoins },
  { name: "Excel Sync (Zoho)", href: "/excel-sync", icon: FileSpreadsheet },
];

const receivingNavigation = [
  { name: "Goods Received", href: "/grn", icon: Truck },
  { name: "Purchase Invoices", href: "/invoices", icon: FileText },
];

const accountingNavigation = [
  { name: "Accounts", href: "/accounts", icon: Wallet },
  { name: "Banking", href: "/banking", icon: Landmark },
  { name: "Ledgers", href: "/accounts/ledgers", icon: BookOpen },
  { name: "Currency Rates", href: "/currencies", icon: Coins },
];

const documentsNavigation = [
  { name: "Documents", href: "/documents", icon: FolderOpen },
];

const reportsNavigation = [
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Reports", href: "/ai-reports", icon: Sparkles },
];

const systemNavigation = [
  { name: "Users & Permissions", href: "/users", icon: ShieldCheck },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { collapsed, setCollapsed } = useSidebar();
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    primary: true,
    sales: true,
    receiving: true,
    accounting: true,
    documents: true,
    reports: true,
    system: true,
  });

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if any route in a section is active
  const isSectionActive = (items: typeof primaryNavigation) => {
    return items.some((item) => {
      if (pathname === item.href) return true;
      if (item.href !== "/" && pathname?.startsWith(item.href)) return true;
      return false;
    });
  };

  return (
    <aside
      className={cn(
        "relative h-full flex flex-col bg-[#1E3A8A] text-slate-200 transition-[width] duration-300 ease-in-out shadow-2xl z-40 shrink-0",
        collapsed ? "w-20" : "w-64"
      )}
    >
      {/* Brand Header */}
      <div className="flex items-center h-16 px-4 border-b border-blue-900/50 bg-[#1A2D6F] shrink-0">
        <div className="flex items-center gap-3 overflow-hidden flex-1">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-lg flex-shrink-0">
            <Wrench className="w-5 h-5 text-blue-200" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-white text-sm tracking-wide leading-tight">
                BAIT AL HADAF
              </span>
              <span className="text-[10px] font-medium tracking-wider uppercase text-blue-200">
                Procurement ERP
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Scroll Area */}
      <div className="flex-1 overflow-y-auto py-4 scrollbar-thin scrollbar-thumb-blue-800/50 scrollbar-track-transparent">
        {/* Primary Navigation */}
        <div className="px-3">
          {!collapsed && (
            <div className="mb-3 px-3 pb-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70">
                Main
              </span>
            </div>
          )}
          {primaryNavigation.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname?.startsWith(item.href));

            return (
              <Link
                key={item.name}
                href={item.href}
                title={collapsed ? item.name : undefined}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group relative",
                  isActive
                    ? "bg-blue-600 text-white shadow-md font-semibold"
                    : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                )}
              >
                <Icon
                  className={cn(
                    "w-5 h-5 flex-shrink-0 transition-colors",
                    isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                  )}
                />
                {!collapsed && (
                  <>
                    <span className="truncate flex-1">{item.name}</span>
                    {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                  </>
                )}
                {collapsed && <span className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 whitespace-nowrap rounded-md bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg ring-1 ring-white/10 transition-opacity duration-150 group-hover:opacity-100">{item.name}</span>}
              </Link>
            );
          })}
        </div>

        {/* Sales Section */}
        <div className="mt-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection("sales")}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70 flex-1">
                Sales
              </span>
              <MoreVertical className="w-3 h-3 text-blue-400/50" />
            </button>
          )}
          {expandedSections.sales && (
            <div className="px-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {salesNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Receiving Section */}
        <div className="mt-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection("receiving")}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70 flex-1">
                Receiving
              </span>
              <MoreVertical className="w-3 h-3 text-blue-400/50" />
            </button>
          )}
          {expandedSections.receiving && (
            <div className="px-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {receivingNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Accounting Section */}
        <div className="mt-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection("accounting")}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70 flex-1">
                Accounting
              </span>
              <MoreVertical className="w-3 h-3 text-blue-400/50" />
            </button>
          )}
          {expandedSections.accounting && (
            <div className="px-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {accountingNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Documents Section */}
        <div className="mt-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection("documents")}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70 flex-1">
                Documents
              </span>
              <MoreVertical className="w-3 h-3 text-blue-400/50" />
            </button>
          )}
          {expandedSections.documents && (
            <div className="px-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {documentsNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Reports Section */}
        <div className="mt-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection("reports")}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70 flex-1">
                Reports
              </span>
              <MoreVertical className="w-3 h-3 text-blue-400/50" />
            </button>
          )}
          {expandedSections.reports && (
            <div className="px-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {reportsNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* System Section */}
        <div className="mt-2">
          {!collapsed && (
            <button
              onClick={() => toggleSection("system")}
              className="w-full flex items-center gap-3 px-3 py-2 mb-2 text-left"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-300/70 flex-1">
                System
              </span>
              <MoreVertical className="w-3 h-3 text-blue-400/50" />
            </button>
          )}
          {expandedSections.system && (
            <div className="px-3 space-y-1 animate-in fade-in slide-in-from-top-1 duration-200">
              {systemNavigation.map((item) => {
                const Icon = item.icon;
                const isActive =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    title={collapsed ? item.name : undefined}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all group relative",
                      isActive
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-300 hover:bg-blue-900/40 hover:text-white"
                    )}
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 flex-shrink-0 transition-colors",
                        isActive ? "text-blue-100" : "text-slate-400 group-hover:text-blue-300"
                      )}
                    />
                    {!collapsed && (
                      <>
                        <span className="truncate flex-1">{item.name}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-blue-100 ml-auto" />}
                      </>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Footer / Status */}
      <div className="p-3 border-t border-blue-900/50 bg-[#1A2D6F]">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-blue-900/30">
            <div className="flex items-center justify-center w-6 h-6 rounded bg-blue-600">
              <span className="text-xs font-bold text-white">AE</span>
            </div>
            <div className="flex flex-col truncate">
              <span className="text-[10px] font-semibold text-white">
                Dubai, UAE
              </span>
              <span className="text-[9px] text-blue-200/70">AED Currency</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-2 text-slate-400 hover:text-white hover:bg-blue-900/30 rounded-lg transition-colors group"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          )}
        </button>
      </div>
    </aside>
  );
}
