"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Plus,
  User,
  Shield,
  FileSpreadsheet,
  ShoppingCart,
  Truck,
  CreditCard,
  PackagePlus,
  Users,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  X,
  FileText,
  Box,
  Download,
  MoreHorizontal,
} from "lucide-react";
import { useRole } from "@/context/RoleContext";
import { USER_ROLES, formatDate } from "@/lib/utils";
import { toast } from "sonner";

export default function Header() {
  const router = useRouter();
  const { role, userName, setRole } = useRole();
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ type: string; title: string; url: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Notifications state (mock)
  const notifications = [
    { id: 1, title: "PO Approval Required", time: "10m ago", type: "warning", read: false },
    { id: 2, title: "Delivery Overdue", time: "1h ago", type: "danger", read: false },
    { id: 3, title: "Payment Received", time: "3h ago", type: "success", read: true },
  ];

  // Focus search on slash key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSearching(false);
    }
  };

  const formatAED = (amount: number) => {
    return new Intl.NumberFormat("en-AE", {
      style: "currency",
      currency: "AED",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <header className="h-16 w-full shrink-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shadow-sm">
      {/* Company Logo & Brand */}
      <div className="flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center shadow-md shrink-0">
            <span className="font-bold text-lg">B</span>
          </div>
          <div className="hidden md:block shrink-0">
            <div className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Bait Al Hadaf
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">
              General Trading L.L.C.
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-64 md:w-96 ml-4 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search... (Press /)"
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
          />
          {searchQuery.trim().length >= 2 && (
            <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
              {isSearching ? (
                <div className="p-4 text-center text-sm text-slate-500">Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      router.push(item.url);
                      setSearchQuery("");
                      setSearchResults([]);
                    }}
                    className="px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 cursor-pointer border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between text-sm"
                  >
                    <span className="font-medium text-slate-800 dark:text-slate-200">{item.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-semibold uppercase">
                      {item.type}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">No results found</div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Create Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowQuickCreate(!showQuickCreate);
              setShowNotifications(false);
              setShowRoleMenu(false);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg text-sm font-semibold shadow-sm transition-all hover:shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Quick Create</span>
            <ChevronDown className="w-3.5 h-3.5 ml-1" />
          </button>

          {showQuickCreate && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Create New
              </div>
              <button
                onClick={() => {
                  router.push("/purchase-orders/new");
                  setShowQuickCreate(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <ShoppingCart className="w-4 h-4 text-blue-600 flex-shrink-0" />
                <span className="flex-1">Purchase Order</span>
              </button>
              <button
                onClick={() => {
                  router.push("/grn/new");
                  setShowQuickCreate(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="flex-1">Goods Received Note</span>
              </button>
              <button
                onClick={() => {
                  router.push("/payments/new");
                  setShowQuickCreate(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <CreditCard className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span className="flex-1">Record Payment</span>
              </button>
              <button
                onClick={() => {
                  router.push("/invoices/scan");
                  setShowQuickCreate(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200 border-t border-slate-100 dark:border-slate-700 mt-0.5"
              >
                <Sparkles className="w-4 h-4 text-purple-600 flex-shrink-0" />
                <span className="flex-1">AI Scan Invoice</span>
              </button>
              <div className="border-t border-slate-100 dark:border-slate-700 my-0.5" />
              <button
                onClick={() => {
                  router.push("/suppliers/new");
                  setShowQuickCreate(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="flex-1">Add Supplier</span>
              </button>
              <button
                onClick={() => {
                  router.push("/products/new");
                  setShowQuickCreate(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-slate-700 flex items-center gap-3 text-sm text-slate-700 dark:text-slate-200"
              >
                <PackagePlus className="w-4 h-4 text-indigo-500 flex-shrink-0" />
                <span className="flex-1">Add Product</span>
              </button>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowQuickCreate(false);
              setShowRoleMenu(false);
            }}
            className="relative p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                <span className="font-bold text-sm text-slate-800 dark:text-slate-100">Notifications</span>
                <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold cursor-pointer hover:underline">
                  Mark all as read
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">No new notifications</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className="px-4 py-3 hover:bg-blue-50 dark:hover:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700/50 cursor-pointer flex gap-3 items-start"
                    >
                      <div className="mt-0.5">
                        {n.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
                        {n.type === "danger" && <AlertTriangle className="w-5 h-5 text-rose-500" />}
                        {n.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{n.title}</p>
                        <span className="text-xs text-slate-400">{n.time}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile & Settings */}
        <div className="relative">
          <button
            onClick={() => {
              setShowRoleMenu(!showRoleMenu);
              setShowQuickCreate(false);
              setShowNotifications(false);
            }}
            className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold text-sm shadow-sm">
              {userName.charAt(0)}
            </div>
            <div className="text-left hidden lg:block">
              <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 leading-tight">
                {userName}
              </div>
              <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase">
                {role.replace("_", " ")}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
          </button>

          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-2xl py-1.5 z-50">
              {/* User Header */}
              <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 rounded-t-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    {userName.charAt(0)}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white">{userName}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">BAIT AL HADAF</div>
                  </div>
                </div>
              </div>

              {/* Active Role */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                  Active Role
                </p>
                <div className="flex items-center justify-between px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-900/30">
                  <span className="text-sm font-semibold text-blue-700 dark:text-blue-400 uppercase">
                    {role.replace("_", " ")}
                  </span>
                  <Shield className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                </div>
              </div>

              {/* Role Switcher */}
              <div className="py-1">
                <p className="px-4 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Switch Role
                </p>
                {Object.values(USER_ROLES).map((r) => (
                  <button
                    key={r}
                    onClick={() => {
                      setRole(r);
                      setShowRoleMenu(false);
                      toast.success(`Switched to ${r.replace("_", " ")}`);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-blue-50 dark:hover:bg-slate-700 ${
                      role === r
                        ? "bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 font-semibold"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    <span className="flex-1">{r.replace("_", " ")}</span>
                    {role === r && <CheckCircle2 className="w-4 h-4 text-blue-600" />}
                  </button>
                ))}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 py-1">
                <button
                  onClick={() => {
                    setShowRoleMenu(false);
                    router.push("/settings");
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-3"
                >
                  <Shield className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
