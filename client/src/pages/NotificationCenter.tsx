/**
 * NotificationCenter — Full Notification History
 * ================================================
 * Complete notification management with type filters,
 * priority filters, bulk actions, and search.
 */
import { useState, useMemo } from "react";
import { useNotifications, type Notification, type NotificationType, type NotificationPriority } from "@/contexts/NotificationContext";
import { PaginationBar } from "@/components/DataGrid";
import { Link } from "wouter";
import {
  Bell, Check, CheckCheck, Trash2, Search, Filter,
  ShoppingCart, Truck, RotateCcw, Users, Package,
  DollarSign, Settings, AlertTriangle, Clock, X,
  ChevronRight, Archive,
} from "lucide-react";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  order: ShoppingCart, shipment: Truck, return: RotateCcw, vendor: Users,
  product: Package, finance: DollarSign, system: Settings, alert: AlertTriangle,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  order: "bg-blue-50 text-blue-600", shipment: "bg-indigo-50 text-indigo-600",
  return: "bg-orange-50 text-orange-600", vendor: "bg-purple-50 text-purple-600",
  product: "bg-teal-50 text-teal-600", finance: "bg-green-50 text-green-600",
  system: "bg-gray-100 text-gray-600", alert: "bg-red-50 text-red-600",
};

const PRIORITY_COLORS: Record<NotificationPriority, string> = {
  critical: "bg-red-100 text-red-700",
  high: "bg-amber-100 text-amber-700",
  medium: "bg-blue-100 text-blue-700",
  low: "bg-gray-100 text-gray-600",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationCenter() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification, clearAll } = useNotifications();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<NotificationType | "all">("all");
  const [priorityFilter, setPriorityFilter] = useState<NotificationPriority | "all">("all");
  const [readFilter, setReadFilter] = useState<"all" | "unread" | "read">("all");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [statusMessage, setStatusMessage] = useState("");
  const perPage = 15;

  const filtered = useMemo(() => {
    let result = [...notifications];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((n) => n.title.toLowerCase().includes(q) || n.message.toLowerCase().includes(q));
    }
    if (typeFilter !== "all") result = result.filter((n) => n.type === typeFilter);
    if (priorityFilter !== "all") result = result.filter((n) => n.priority === priorityFilter);
    if (readFilter === "unread") result = result.filter((n) => !n.read);
    if (readFilter === "read") result = result.filter((n) => n.read);
    return result;
  }, [notifications, search, typeFilter, priorityFilter, readFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === paginated.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginated.map((n) => n.id)));
    }
  };

  const bulkMarkRead = () => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => markAsRead(id));
    setSelectedIds(new Set());
    setStatusMessage(`${count} notification${count > 1 ? "s" : ""} marked as read`);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const bulkDismiss = () => {
    const count = selectedIds.size;
    selectedIds.forEach((id) => dismissNotification(id));
    setSelectedIds(new Set());
    setStatusMessage(`${count} notification${count > 1 ? "s" : ""} dismissed`);
    setTimeout(() => setStatusMessage(""), 3000);
  };

  const types: NotificationType[] = ["order", "shipment", "return", "vendor", "product", "finance", "system", "alert"];

  return (
    <div className="page-enter p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl tracking-wide text-gray-900">Notification Center</h1>
          <p className="text-sm text-gray-500 mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? "s" : ""}` : "All caught up"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <CheckCheck size={16} />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-4 mb-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search notifications..."
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value as NotificationType | "all"); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="all">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
            ))}
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => { setPriorityFilter(e.target.value as NotificationPriority | "all"); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="all">All Priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Read Filter */}
          <select
            value={readFilter}
            onChange={(e) => { setReadFilter(e.target.value as "all" | "unread" | "read"); setPage(1); }}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="all">All</option>
            <option value="unread">Unread</option>
            <option value="read">Read</option>
          </select>
        </div>
      </div>

      {/* Screen reader announcement for bulk actions */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{statusMessage}</div>

      {/* Bulk Actions */}
      {selectedIds.size > 0 && (
        <div className="bg-gray-900 text-white rounded-lg px-4 py-2.5 mb-4 flex items-center justify-between">
          <span className="text-sm">{selectedIds.size} selected on this page</span>
          <div className="flex items-center gap-2">
            <button onClick={bulkMarkRead} className="flex items-center gap-1 px-3 py-1.5 bg-white/10 rounded-lg text-xs hover:bg-white/20 transition-colors">
              <Check size={12} /> Mark Read
            </button>
            <button onClick={bulkDismiss} className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
              <Trash2 size={12} /> Dismiss
            </button>
            <button onClick={() => setSelectedIds(new Set())} className="p-1.5 hover:bg-white/10 rounded-lg transition-colors">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Notification List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
        {/* Select All Header */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-gray-50">
          <input
            type="checkbox"
            checked={paginated.length > 0 && selectedIds.size === paginated.length}
            onChange={selectAll}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            aria-label="Select all notifications on this page"
          />
          <span className="text-xs text-gray-500">{filtered.length} notification{filtered.length !== 1 ? "s" : ""}</span>
        </div>

        {paginated.length === 0 ? (
          <div className="py-16 text-center">
            <Bell size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No notifications match your filters</p>
          </div>
        ) : (
          paginated.map((n) => {
            const Icon = TYPE_ICONS[n.type];
            return (
              <div
                key={n.id}
                className={`flex items-start gap-3 px-4 py-3.5 border-b border-gray-50 hover:bg-gray-50 transition-colors group ${
                  !n.read ? "bg-blue-50/20" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.has(n.id)}
                  onChange={() => toggleSelect(n.id)}
                  className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900 mt-1"
                  aria-label={`Select notification: ${n.title}`}
                />

                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type]}`}>
                  <Icon size={16} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className={`text-sm ${!n.read ? "font-semibold text-gray-900" : "text-gray-700"}`}>{n.title}</p>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRIORITY_COLORS[n.priority]}`}>
                      {n.priority}
                    </span>
                    {!n.read && <span className="w-2 h-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{n.message}</p>
                  <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                      <Clock size={10} />{timeAgo(n.timestamp)}
                    </span>
                    {n.actionUrl && n.actionLabel && (
                      <Link href={n.actionUrl} className="text-[11px] text-blue-600 font-medium hover:text-blue-700 flex items-center gap-0.5">
                        {n.actionLabel} <ChevronRight size={10} />
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => markAsRead(n.id)}
                      className="p-1.5 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      aria-label="Mark as read"
                    >
                      <Check size={14} />
                    </button>
                  )}
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="p-1.5 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                    aria-label="Dismiss"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            );
          })
        )}

        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              limit={perPage}
              totalItems={filtered.length}
              onPageChange={setPage}
              onLimitChange={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
