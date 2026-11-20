"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  Filter,
  SortAsc,
  SortDesc,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Download,
  RefreshCw,
  Settings,
  Check,
  X,
} from "lucide-react";

interface Column<T> {
  key: keyof T | ((item: T) => any);
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (item: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  filters?: { label: string | ((item: T) => string); options: { value: string; label: string }[] }[];
  onFilterChange?: (key: string, value: string) => void;
  onSort?: (key: keyof T, direction: "asc" | "desc") => void;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  itemsPerPage?: number;
  totalItems?: number;
  onItemsPerPageChange?: (count: number) => void;
  loading?: boolean;
  emptyState?: {
    icon?: React.ReactNode;
    title: string;
    description?: string;
    action?: React.ReactNode;
  };
  rowClassName?: (item: T) => string;
  onRowClick?: (item: T) => void;
  showPagination?: boolean;
  showSearch?: boolean;
  showFilters?: boolean;
  showExport?: boolean;
  exportLabel?: string;
  onExport?: () => void;
}

export function DataTable<T>({
  data,
  columns,
  searchTerm,
  onSearchChange,
  filters,
  onFilterChange,
  onSort,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  itemsPerPage = 10,
  totalItems = 0,
  onItemsPerPageChange,
  loading = false,
  emptyState,
  rowClassName,
  onRowClick,
  showPagination = true,
  showSearch = true,
  showFilters = true,
  showExport = true,
  exportLabel = "Export",
  onExport,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{ key: keyof T | ((item: T) => any); direction: "asc" | "desc" } | null>(null);

  const handleSort = (key: keyof T) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  // Filter data if searchTerm or filters are provided
  const filteredData = useMemo(() => {
    let result = [...data];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((item) =>
        columns.some((col) => {
          const value = typeof col.key === "function" ? col.key(item) : (item[col.key] as string);
          return String(value).toLowerCase().includes(term);
        })
      );
    }

    // Apply filters
    if (filters && filters.length > 0) {
      filters.forEach((filter) => {
        const filterValue = localStorage.getItem(`filter_${filter.label}`);
        if (filterValue) {
          result = result.filter((item) => {
            const value = typeof filter.label === "function" ? filter.label(item) : (item[filter.label as keyof T] as string);
            return String(value).toLowerCase() === filterValue.toLowerCase();
          });
        }
      });
    }

    // Apply sorting
    if (sortConfig) {
      result.sort((a, b) => {
        const aValue = typeof sortConfig.key === "function" ? sortConfig.key(a) : (a[sortConfig.key] as string | number);
        const bValue = typeof sortConfig.key === "function" ? sortConfig.key(b) : (b[sortConfig.key] as string | number);

        if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, searchTerm, filters, sortConfig, columns]);

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(start, start + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCount = parseInt(e.target.value);
    onItemsPerPageChange?.(newCount);
    // Reset to page 1 when changing items per page
    onPageChange?.(1);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-slate-500">Loading data...</p>
      </div>
    );
  }

  if (paginatedData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        {emptyState?.icon || <Search className="w-12 h-12 text-slate-300 mb-4" />}
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          {emptyState?.title || "No records found"}
        </h3>
        {emptyState?.description && (
          <p className="text-sm text-slate-500 mb-4 max-w-sm text-center">
            {emptyState.description}
          </p>
        )}
        {emptyState?.action}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Toolbar */}
      {(showSearch || showFilters || showExport) && (
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search */}
            {showSearch && searchTerm !== undefined && onSearchChange && (
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search..."
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-shadow"
                />
              </div>
            )}

            {/* Filters */}
            {showFilters && filters && filters.length > 0 && (
              <div className="flex items-center gap-2">
                {filters.map((filter) => (
                  <div key={typeof filter.label === "function" ? filter.label.toString() : filter.label} className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                    <select
                      value={localStorage.getItem(`filter_${filter.label}`) || ""}
                      onChange={(e) => {
                        const key = typeof filter.label === "function" ? "filter" : filter.label;
                        localStorage.setItem(`filter_${key}`, e.target.value);
                        onFilterChange?.(key, e.target.value);
                        onPageChange?.(1);
                      }}
                      className="pl-9 pr-8 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 cursor-pointer"
                    >
                      <option value="">All</option>
                      {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            {/* Export */}
            {showExport && onExport && (
              <button
                onClick={onExport}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>{exportLabel}</span>
              </button>
            )}

            {/* Refresh */}
            {onSearchChange && (
              <button
                onClick={() => {
                  if (onSearchChange) onSearchChange("");
                  if (filters) {
                    filters.forEach((f) => localStorage.removeItem(`filter_${f.label}`));
                    if (onFilterChange) {
                      filters.forEach((f) => {
                      const key = typeof f.label === "function" ? "filter" : f.label;
                      onFilterChange(key, "");
                    });
                    }
                  }
                  onPageChange?.(1);
                }}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                title="Reset filters"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wide">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-3 ${col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""}`}
                  style={{ width: col.width }}
                >
                  <button
                    onClick={() => typeof col.key === "string" && handleSort(col.key)}
                    className="flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {col.header}
                    {sortConfig?.key === col.key && (
                      sortConfig.direction === "asc" ? (
                        <SortAsc className="w-3.5 h-3.5" />
                      ) : (
                        <SortDesc className="w-3.5 h-3.5" />
                      )
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {paginatedData.map((item, rowIndex) => (
              <tr
                key={rowIndex}
                className={`group hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-colors ${
                  onRowClick ? "cursor-pointer" : ""
                } ${rowClassName ? rowClassName(item) : ""}`}
                onClick={() => onRowClick?.(item)}
              >
                {columns.map((col, colIdx) => (
                  <td
                    key={colIdx}
                    className={`px-6 py-3 ${
                      col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : ""
                    }`}
                  >
                    {typeof col.key === "function"
                      ? col.render?.(item)
                      : col.render?.(item) || String(item[col.key] as string)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {showPagination && totalPages > 1 && (
        <div className="px-4 py-3 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="hidden sm:inline">Showing</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
            </span>
            <span className="text-slate-500">to</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>
            <span className="text-slate-500">of</span>
            <span className="font-semibold text-slate-900 dark:text-white">{totalItems}</span>
            <span className="hidden sm:inline">entries</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Items per page */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-500">Show:</span>
              <select
                value={itemsPerPage}
                onChange={handleItemsPerPageChange}
                className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Pagination controls */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => onPageChange?.(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange?.(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-colors ${
                      currentPage === pageNum
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              <button
                onClick={() => onPageChange?.(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 dark:text-slate-300 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
