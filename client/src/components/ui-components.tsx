import { cn, getStatusColor, getStatusLabel, formatCurrency, formatNumber } from "@/lib/utils";
import { ArrowUp, ArrowDown, Minus, Inbox } from "lucide-react";

// ============================================================
// Status Badge
// ============================================================
export function StatusBadge({ status, size = "sm" }: { status: string; size?: "xs" | "sm" | "md" }) {
  const colorClass = getStatusColor(status);
  const sizeClass = size === "xs" ? "text-[10px] px-1.5 py-0.5" : size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-2.5 py-1";

  return (
    <span className={cn("inline-flex items-center font-medium rounded-full whitespace-nowrap", colorClass, sizeClass)}>
      {getStatusLabel(status)}
    </span>
  );
}

// ============================================================
// KPI Card
// ============================================================
interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ElementType;
  iconColor?: string;
  format?: "number" | "currency" | "percent" | "raw";
  currency?: string;
}

export function KPICard({
  title, value, change, changeLabel, icon: Icon, iconColor = "text-slate-500",
  format = "raw", currency = "USD",
}: KPICardProps) {
  const displayValue = format === "currency"
    ? formatCurrency(typeof value === "number" ? value : parseFloat(String(value)), currency)
    : format === "number"
    ? formatNumber(typeof value === "number" ? value : parseInt(String(value)))
    : format === "percent"
    ? `${value}%`
    : value;

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">{title}</p>
        {Icon && (
          <div className={cn("p-2 rounded-lg bg-slate-50", iconColor)}>
            <Icon size={16} />
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-[var(--foreground)]">{displayValue}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1 mt-2">
          {change > 0 ? (
            <ArrowUp size={14} className="text-emerald-500" />
          ) : change < 0 ? (
            <ArrowDown size={14} className="text-red-500" />
          ) : (
            <Minus size={14} className="text-slate-400" />
          )}
          <span className={cn("text-xs font-medium", change > 0 ? "text-emerald-600" : change < 0 ? "text-red-600" : "text-slate-500")}>
            {Math.abs(change)}%
          </span>
          {changeLabel && <span className="text-xs text-slate-400">{changeLabel}</span>}
        </div>
      )}
    </div>
  );
}

// ============================================================
// Data Table
// ============================================================
interface Column<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns, data, onRowClick, isLoading, emptyMessage = "No data found",
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-12 text-center">
          <div className="inline-block w-8 h-8 border-2 border-slate-200 border-t-[var(--accent)] rounded-full animate-spin" />
          <p className="text-sm text-slate-500 mt-3">Loading...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
        <div className="p-12 text-center">
          <Inbox size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-sm text-slate-500">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr className="bg-slate-50/80">
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width }}
                  className={cn(col.align === "right" && "text-right", col.align === "center" && "text-center")}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, i) => (
              <tr
                key={i}
                onClick={() => onRowClick?.(item)}
                className={cn(onRowClick && "cursor-pointer")}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn(col.align === "right" && "text-right", col.align === "center" && "text-center")}
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

// ============================================================
// Pagination
// ============================================================
interface PaginationProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, total, limit, onPageChange }: PaginationProps) {
  const totalPages = Math.ceil(total / limit);
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between mt-4 px-1">
      <p className="text-xs text-slate-500">
        Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] disabled:opacity-50 hover:bg-slate-50"
        >
          Previous
        </button>
        {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
          const p = i + 1;
          return (
            <button
              key={p}
              onClick={() => onPageChange(p)}
              className={cn(
                "w-8 h-8 text-xs rounded-md",
                p === page
                  ? "bg-[var(--primary)] text-white"
                  : "border border-[var(--border)] hover:bg-slate-50"
              )}
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="px-3 py-1.5 text-xs rounded-md border border-[var(--border)] disabled:opacity-50 hover:bg-slate-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Empty State
// ============================================================
export function EmptyState({ icon: Icon = Inbox, title, message }: { icon?: React.ElementType; title: string; message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Icon size={48} className="text-slate-300 mb-4" />
      <h3 className="text-lg font-semibold text-slate-700">{title}</h3>
      {message && <p className="text-sm text-slate-500 mt-1 max-w-md">{message}</p>}
    </div>
  );
}

// ============================================================
// Section Header
// ============================================================
export function SectionHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-[var(--foreground)]">{title}</h2>
        {subtitle && <p className="text-sm text-[var(--muted-foreground)] mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
