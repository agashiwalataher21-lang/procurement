import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | null | undefined, currency = "AED"): string {
  if (amount === null || amount === undefined || isNaN(amount)) return `${currency} 0.00`;
  return `${currency} ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatFils(fils: number | null | undefined, currency = "AED"): string {
  if (fils === null || fils === undefined || isNaN(fils)) return `${currency} 0.00`;
  const aed = Number(fils) / 100;
  return `${currency} ${aed.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return "-";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getDaysDifference(targetDate: string | Date, baseDate: string | Date = new Date()): number {
  const d1 = new Date(targetDate);
  const d2 = new Date(baseDate);
  const diffTime = d2.getTime() - d1.getTime();
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export const USER_ROLES = {
  ADMIN: "ADMIN",
  PURCHASE_MANAGER: "PURCHASE_MANAGER",
  ACCOUNTANT: "ACCOUNTANT",
  STAFF: "STAFF",
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

/** Safe JSON parse for fetch responses — handles empty body without throwing 'Unexpected end of JSON input'. */
 export async function safeJson<T = any>(res: Response): Promise<T> {
   const text = await res.text();
   if (!text || !text.trim()) return {} as T;
   try {
     return JSON.parse(text) as T;
   } catch (e) {
     throw new Error('Invalid server response (' + res.status + '): ' + text.slice(0, 200));
   }
 }

 export function ensureOk(res: Response, data: any, fallback = "Request failed") {
   if (!res.ok) throw new Error(data?.error || data?.message || fallback);
 }

export const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  // PO Statuses
  DRAFT: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-700 dark:text-slate-300", border: "border-slate-300" },
  PENDING_APPROVAL: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300" },
  APPROVED: { bg: "bg-blue-50 dark:bg-blue-950/40", text: "text-blue-700 dark:text-blue-400", border: "border-blue-300" },
  PARTIALLY_RECEIVED: { bg: "bg-purple-50 dark:bg-purple-950/40", text: "text-purple-700 dark:text-purple-400", border: "border-purple-300" },
  FULLY_RECEIVED: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-300" },
  PARTIALLY_INVOICED: { bg: "bg-indigo-50 dark:bg-indigo-950/40", text: "text-indigo-700 dark:text-indigo-400", border: "border-indigo-300" },
  FULLY_INVOICED: { bg: "bg-teal-50 dark:bg-teal-950/40", text: "text-teal-700 dark:text-teal-400", border: "border-teal-300" },
  CLOSED: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300" },
  CANCELLED: { bg: "bg-rose-50 dark:bg-rose-950/40", text: "text-rose-700 dark:text-rose-400", border: "border-rose-300" },
  DELAYED: { bg: "bg-red-50 dark:bg-red-950/40", text: "text-red-700 dark:text-red-400", border: "border-red-300" },

  // General Statuses
  ACTIVE: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-300" },
  INACTIVE: { bg: "bg-slate-100 dark:bg-slate-800", text: "text-slate-600 dark:text-slate-400", border: "border-slate-300" },
  CONFIRMED: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-300" },
  PAID: { bg: "bg-emerald-50 dark:bg-emerald-950/40", text: "text-emerald-700 dark:text-emerald-400", border: "border-emerald-300" },
  PARTIALLY_PAID: { bg: "bg-amber-50 dark:bg-amber-950/40", text: "text-amber-700 dark:text-amber-400", border: "border-amber-300" },
};
