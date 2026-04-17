import { useState, useMemo, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Search, ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight,
  ChevronsLeft, ChevronsRight, Filter, X, Calendar, Inbox, Download, Check
} from "lucide-react";

// ============================================================
// Types
// ============================================================

export type SortDirection = "asc" | "desc" | null;

export interface SortState {
  key: string;
  direction: SortDirection;
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: "select" | "multi-select" | "date-range" | "range";
  options?: FilterOption[];
  min?: number;
  max?: number;
}

export interface ColumnDef<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  hidden?: boolean;
}

// ============================================================
// useDataGrid Hook — handles search, filter, sort, pagination
// ============================================================

interface UseDataGridOptions<T> {
  data: T[];
  searchKeys?: string[];
  defaultSort?: SortState;
  defaultLimit?: number;
}

export function useDataGrid<T extends Record<string, any>>({
  data,
  searchKeys = [],
  defaultSort,
  defaultLimit = 25,
}: UseDataGridOptions<T>) {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState>(defaultSort || { key: "", direction: null });
  const [filters, setFilters] = useState<Record<string, string | string[]>>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(defaultLimit);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

  // Search
  const searched = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((item) =>
      searchKeys.some((key) => {
        const val = item[key];
        return val && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  // Filter
  const filtered = useMemo(() => {
    let result = searched;
    for (const [key, value] of Object.entries(filters)) {
      if (!value || (Array.isArray(value) && value.length === 0)) continue;
      result = result.filter((item) => {
        const itemVal = String(item[key] || "");
        if (Array.isArray(value)) {
          return value.includes(itemVal);
        }
        return itemVal === value;
      });
    }
    return result;
  }, [searched, filters]);

  // Sort
  const sorted = useMemo(() => {
    if (!sort.key || !sort.direction) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sort.key];
      const bVal = b[sort.key];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const aNum = Number(aVal);
      const bNum = Number(bVal);
      if (!isNaN(aNum) && !isNaN(bNum)) {
        return sort.direction === "asc" ? aNum - bNum : bNum - aNum;
      }
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      if (aStr < bStr) return sort.direction === "asc" ? -1 : 1;
      if (aStr > bStr) return sort.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sort]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / limit);
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return sorted.slice(start, start + limit);
  }, [sorted, page, limit]);

  // Reset page when filters/search change
  const setSearchWithReset = useCallback((val: string) => {
    setSearch(val);
    setPage(1);
    setSelectedRows(new Set());
  }, []);

  const setFilterWithReset = useCallback((key: string, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
    setSelectedRows(new Set());
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSearch("");
    setPage(1);
    setSelectedRows(new Set());
  }, []);

  const toggleSort = useCallback((key: string) => {
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: "asc" };
      if (prev.direction === "asc") return { key, direction: "desc" };
      return { key: "", direction: null };
    });
  }, []);

  const setLimitWithReset = useCallback((val: number) => {
    setLimit(val);
    setPage(1);
    setSelectedRows(new Set());
  }, []);

  // Row selection
  const toggleRow = useCallback((index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const toggleAllRows = useCallback(() => {
    setSelectedRows((prev) => {
      if (prev.size === paginated.length) return new Set();
      return new Set(paginated.map((_, i) => i));
    });
  }, [paginated]);

  const activeFilterCount = Object.values(filters).filter(
    (v) => v && (Array.isArray(v) ? v.length > 0 : v !== "")
  ).length + (search ? 1 : 0);

  return {
    // State
    search, sort, filters, page, limit, selectedRows,
    // Computed
    totalFiltered: sorted.length,
    totalPages,
    paginated,
    activeFilterCount,
    allSelected: selectedRows.size === paginated.length && paginated.length > 0,
    // Actions
    setSearch: setSearchWithReset,
    setFilter: setFilterWithReset,
    clearFilters,
    toggleSort,
    setPage,
    setLimit: setLimitWithReset,
    toggleRow,
    toggleAllRows,
  };
}

// ============================================================
// SearchBar Component
// ============================================================

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className,
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("search-bar", className)}>
      <Search size={16} className="text-slate-400 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="p-0.5 rounded hover:bg-slate-100 text-slate-400 shrink-0"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// FilterDropdown Component
// ============================================================

export function FilterDropdown({
  label,
  options,
  value,
  onChange,
  multi = false,
}: {
  label: string;
  options: FilterOption[];
  value: string | string[];
  onChange: (val: string | string[]) => void;
  multi?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selectedValues = Array.isArray(value) ? value : value ? [value] : [];
  const hasValue = selectedValues.length > 0;

  if (!multi) {
    return (
      <select
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "filter-select",
          hasValue && "border-[var(--brand-blue)] text-[var(--brand-blue)] font-semibold"
        )}
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}{opt.count !== undefined ? ` (${opt.count})` : ""}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "filter-select flex items-center gap-1.5",
          hasValue && "border-[var(--brand-blue)] text-[var(--brand-blue)] font-semibold"
        )}
      >
        <Filter size={14} />
        {label}
        {hasValue && (
          <span className="ml-1 px-1.5 py-0.5 bg-[var(--brand-blue)] text-white text-[10px] rounded-full font-bold">
            {selectedValues.length}
          </span>
        )}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-elevated z-40 min-w-[200px] py-1 animate-scale-in">
            {options.map((opt) => {
              const isSelected = selectedValues.includes(opt.value);
              return (
                <button
                  key={opt.value}
                  onClick={() => {
                    if (isSelected) {
                      onChange(selectedValues.filter((v) => v !== opt.value));
                    } else {
                      onChange([...selectedValues, opt.value]);
                    }
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                      isSelected
                        ? "bg-[var(--brand-blue)] border-[var(--brand-blue)]"
                        : "border-slate-300"
                    )}
                  >
                    {isSelected && <Check size={10} className="text-white" />}
                  </span>
                  <span className="flex-1">{opt.label}</span>
                  {opt.count !== undefined && (
                    <span className="text-xs text-slate-400">{opt.count}</span>
                  )}
                </button>
              );
            })}
            {hasValue && (
              <div className="border-t border-[var(--border)] mt-1 pt-1">
                <button
                  onClick={() => {
                    onChange([]);
                    setOpen(false);
                  }}
                  className="w-full px-3 py-2 text-sm text-red-500 hover:bg-red-50 text-left"
                >
                  Clear selection
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// DateRangeFilter Component
// ============================================================

export function DateRangeFilter({
  label = "Date range",
  startDate,
  endDate,
  onStartChange,
  onEndChange,
  onClear,
}: {
  label?: string;
  startDate: string;
  endDate: string;
  onStartChange: (val: string) => void;
  onEndChange: (val: string) => void;
  onClear: () => void;
}) {
  const hasValue = startDate || endDate;
  return (
    <div className="flex items-center gap-1.5">
      <Calendar size={14} className="text-slate-400 shrink-0" />
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className={cn(
          "filter-select text-xs w-[130px]",
          hasValue && "border-[var(--brand-blue)]"
        )}
        aria-label={`${label} start`}
      />
      <span className="text-xs text-slate-400">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className={cn(
          "filter-select text-xs w-[130px]",
          hasValue && "border-[var(--brand-blue)]"
        )}
        aria-label={`${label} end`}
      />
      {hasValue && (
        <button
          onClick={onClear}
          className="p-1 rounded hover:bg-slate-100 text-slate-400"
          aria-label="Clear date range"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

// ============================================================
// ActiveFilters Chip Bar
// ============================================================

export function ActiveFilters({
  filters,
  filterConfigs,
  search,
  onRemoveFilter,
  onClearSearch,
  onClearAll,
}: {
  filters: Record<string, string | string[]>;
  filterConfigs: FilterConfig[];
  search: string;
  onRemoveFilter: (key: string) => void;
  onClearSearch: () => void;
  onClearAll: () => void;
}) {
  const chips: { key: string; label: string }[] = [];

  if (search) {
    chips.push({ key: "__search", label: `Search: "${search}"` });
  }

  for (const [key, value] of Object.entries(filters)) {
    if (!value || (Array.isArray(value) && value.length === 0)) continue;
    const config = filterConfigs.find((f) => f.key === key);
    const label = config?.label || key;
    if (Array.isArray(value)) {
      const labels = value.map((v) => {
        const opt = config?.options?.find((o) => o.value === v);
        return opt?.label || v;
      });
      chips.push({ key, label: `${label}: ${labels.join(", ")}` });
    } else {
      const opt = config?.options?.find((o) => o.value === value);
      chips.push({ key, label: `${label}: ${opt?.label || value}` });
    }
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap animate-fade-in">
      <span className="text-xs text-slate-500 font-medium">Active filters:</span>
      {chips.map((chip) => (
        <span
          key={chip.key}
          className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs rounded-full font-medium"
        >
          {chip.label}
          <button
            onClick={() =>
              chip.key === "__search" ? onClearSearch() : onRemoveFilter(chip.key)
            }
            className="p-0.5 rounded-full hover:bg-blue-100"
            aria-label={`Remove filter: ${chip.label}`}
          >
            <X size={10} />
          </button>
        </span>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs text-red-500 hover:text-red-700 font-medium ml-1"
      >
        Clear all
      </button>
    </div>
  );
}

// ============================================================
// SortableHeader Component
// ============================================================

export function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align,
}: {
  label: string;
  sortKey: string;
  currentSort: SortState;
  onSort: (key: string) => void;
  align?: "left" | "center" | "right";
}) {
  const isActive = currentSort.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={cn(
        "cursor-pointer select-none group",
        align === "right" && "text-right",
        align === "center" && "text-center"
      )}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className={cn("transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-50")}>
          {isActive && currentSort.direction === "asc" ? (
            <ChevronUp size={14} />
          ) : isActive && currentSort.direction === "desc" ? (
            <ChevronDown size={14} />
          ) : (
            <ChevronsUpDown size={14} />
          )}
        </span>
      </span>
    </th>
  );
}

// ============================================================
// Enhanced Pagination Component
// ============================================================

export function PaginationBar({
  page,
  totalPages,
  totalItems,
  limit,
  onPageChange,
  onLimitChange,
  showLimitSelector = true,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  showLimitSelector?: boolean;
}) {
  if (totalItems === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalItems);

  // Smart page numbers with ellipsis
  const getPageNumbers = (): (number | "...")[] => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | "...")[] = [];
    pages.push(1);
    if (page > 3) pages.push("...");
    const rangeStart = Math.max(2, page - 1);
    const rangeEnd = Math.min(totalPages - 1, page + 1);
    for (let i = rangeStart; i <= rangeEnd; i++) pages.push(i);
    if (page < totalPages - 2) pages.push("...");
    pages.push(totalPages);
    return pages;
  };

  return (
    <div className="flex items-center justify-between mt-4 px-1 gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        <p className="text-xs text-slate-500">
          Showing <span className="font-semibold text-slate-700">{start}–{end}</span> of{" "}
          <span className="font-semibold text-slate-700">{totalItems.toLocaleString()}</span>
        </p>
        {showLimitSelector && onLimitChange && (
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="filter-select text-xs py-1"
            aria-label="Rows per page"
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>{n} / page</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md border border-[var(--border)] disabled:opacity-30 hover:bg-slate-50"
          aria-label="First page"
        >
          <ChevronsLeft size={14} />
        </button>
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-md border border-[var(--border)] disabled:opacity-30 hover:bg-slate-50"
          aria-label="Previous page"
        >
          <ChevronLeft size={14} />
        </button>
        {getPageNumbers().map((p, i) =>
          p === "..." ? (
            <span key={`ellipsis-${i}`} className="w-8 text-center text-xs text-slate-400">
              ...
            </span>
          ) : (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "w-8 h-8 text-xs rounded-md font-medium",
                p === page
                  ? "bg-[var(--brand-blue)] text-white shadow-sm"
                  : "border border-[var(--border)] hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          )
        )}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md border border-[var(--border)] disabled:opacity-30 hover:bg-slate-50"
          aria-label="Next page"
        >
          <ChevronRight size={14} />
        </button>
        <button
          onClick={() => onPageChange(totalPages)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-md border border-[var(--border)] disabled:opacity-30 hover:bg-slate-50"
          aria-label="Last page"
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}

// ============================================================
// BulkActionsBar Component
// ============================================================

export function BulkActionsBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  actions,
}: {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  actions: { label: string; icon?: React.ElementType; onClick: () => void; variant?: "default" | "danger" }[];
}) {
  if (selectedCount === 0) return null;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 bg-blue-50 border border-blue-200 rounded-lg animate-fade-in">
      <span className="text-sm font-medium text-blue-700">
        {selectedCount} of {totalCount} selected
      </span>
      <button
        onClick={selectedCount === totalCount ? onDeselectAll : onSelectAll}
        className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
      >
        {selectedCount === totalCount ? "Deselect all" : "Select all"}
      </button>
      <div className="h-4 w-px bg-blue-200" />
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.label}
            onClick={action.onClick}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md",
              action.variant === "danger"
                ? "bg-red-100 text-red-700 hover:bg-red-200"
                : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
            )}
          >
            {Icon && <Icon size={14} />}
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// Export Button
// ============================================================

export function ExportButton({
  onClick,
  label = "Export",
}: {
  onClick: () => void;
  label?: string;
}) {
  return (
    <button onClick={onClick} className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3">
      <Download size={14} />
      {label}
    </button>
  );
}

// ============================================================
// ColumnVisibilityToggle
// ============================================================

export function ColumnVisibilityToggle<T>({
  columns,
  visibleKeys,
  onChange,
}: {
  columns: ColumnDef<T>[];
  visibleKeys: Set<string>;
  onChange: (keys: Set<string>) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3"
      >
        Columns
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-1 bg-white border border-[var(--border)] rounded-lg shadow-elevated z-40 min-w-[180px] py-1 animate-scale-in">
            {columns.map((col) => (
              <button
                key={col.key}
                onClick={() => {
                  const next = new Set(visibleKeys);
                  if (next.has(col.key)) {
                    if (next.size > 2) next.delete(col.key); // keep at least 2 columns
                  } else {
                    next.add(col.key);
                  }
                  onChange(next);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-slate-50 text-left"
              >
                <span
                  className={cn(
                    "w-4 h-4 rounded border flex items-center justify-center shrink-0",
                    visibleKeys.has(col.key)
                      ? "bg-[var(--brand-blue)] border-[var(--brand-blue)]"
                      : "border-slate-300"
                  )}
                >
                  {visibleKeys.has(col.key) && <Check size={10} className="text-white" />}
                </span>
                <span>{col.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// Full DataGrid Component (combines everything)
// ============================================================

interface DataGridProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  sort: SortState;
  onSort: (key: string) => void;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  emptyIcon?: React.ElementType;
  rowClassName?: (item: T) => string;
  selectable?: boolean;
  selectedRows?: Set<number>;
  onToggleRow?: (index: number) => void;
  onToggleAll?: () => void;
  allSelected?: boolean;
}

export function DataGrid<T extends Record<string, any>>({
  columns,
  data,
  sort,
  onSort,
  onRowClick,
  isLoading,
  emptyMessage = "No results found",
  emptyIcon: EmptyIcon = Inbox,
  rowClassName,
  selectable = false,
  selectedRows,
  onToggleRow,
  onToggleAll,
  allSelected,
}: DataGridProps<T>) {
  const visibleColumns = columns.filter((c) => !c.hidden);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden shadow-soft">
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-slate-200 border-t-[var(--brand-blue)] rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-3">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden shadow-soft">
        <div className="p-12 text-center">
          <EmptyIcon size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm font-medium text-slate-600">{emptyMessage}</p>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden shadow-soft">
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-slate-50/80">
              {selectable && (
                <th style={{ width: "40px" }} className="text-center">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={onToggleAll}
                    className="w-4 h-4 rounded border-slate-300 accent-[var(--brand-blue)] cursor-pointer"
                    aria-label="Select all rows"
                  />
                </th>
              )}
              {visibleColumns.map((col) =>
                col.sortable ? (
                  <SortableHeader
                    key={col.key}
                    label={col.label}
                    sortKey={col.key}
                    currentSort={sort}
                    onSort={onSort}
                    align={col.align}
                  />
                ) : (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {col.label}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  onRowClick && "cursor-pointer",
                  selectable && selectedRows?.has(i) && "bg-blue-50/50",
                  rowClassName?.(item)
                )}
              >
                {selectable && (
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedRows?.has(i) || false}
                      onChange={() => onToggleRow?.(i)}
                      className="w-4 h-4 rounded border-slate-300 accent-[var(--brand-blue)] cursor-pointer"
                      aria-label={`Select row ${i + 1}`}
                    />
                  </td>
                )}
                {visibleColumns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(
                      col.align === "right" && "text-right",
                      col.align === "center" && "text-center"
                    )}
                  >
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
