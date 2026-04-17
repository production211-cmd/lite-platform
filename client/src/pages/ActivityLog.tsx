/**
 * ActivityLog — Notifications & Audit Trail
 * ============================================
 * Design: List-first layout with filterable activity feed.
 * Shows operational events synthesized from real database records:
 * orders, shipments, payouts, returns, and product changes.
 */

import { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";
import { Link } from "wouter";
import {
  Activity, Bell, Search, Clock, CheckCircle,
  AlertTriangle, RefreshCw, ShoppingBag, Truck,
  CreditCard, Users, Database, Package, Shield, ArrowRight,
  Settings,
} from "lucide-react";
import { PaginationBar } from "@/components/DataGrid";

interface ActivityEntry {
  id: string;
  timestamp: string;
  type: "order" | "shipment" | "vendor" | "product" | "finance" | "sync" | "system" | "security";
  severity: "info" | "warning" | "error" | "success";
  title: string;
  description: string;
  actor: string;
  entityType?: string;
  entityId?: string;
  entityLabel?: string;
}

const TYPE_ICONS: Record<string, any> = {
  order: ShoppingBag,
  shipment: Truck,
  vendor: Users,
  product: Package,
  finance: CreditCard,
  sync: Database,
  system: Settings,
  security: Shield,
};

const TYPE_COLORS: Record<string, string> = {
  order: "bg-blue-50 text-blue-600",
  shipment: "bg-purple-50 text-purple-600",
  vendor: "bg-green-50 text-green-600",
  product: "bg-orange-50 text-orange-600",
  finance: "bg-emerald-50 text-emerald-600",
  sync: "bg-cyan-50 text-cyan-600",
  system: "bg-gray-100 text-gray-600",
  security: "bg-red-50 text-red-600",
};

const SEVERITY_STYLES: Record<string, string> = {
  info: "border-l-blue-400",
  warning: "border-l-amber-400",
  error: "border-l-red-400",
  success: "border-l-green-400",
};

export default function ActivityLog() {
  const [activities, setActivities] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadActivities = async () => {
    setLoading(true);
    try {
      const data = await api.getActivity({ limit: "100" });
      const list = data?.activities || [];
      setActivities(list);
    } catch (err) {
      console.error("Failed to load activities:", err);
      setActivities([]);
    }
    setLoading(false);
  };

  useEffect(() => { loadActivities(); }, []);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (severityFilter && a.severity !== severityFilter) return false;
      return true;
    });
  }, [activities, search, typeFilter, severityFilter]);

  const totalPages = Math.ceil(filteredActivities.length / limit);
  const paginated = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredActivities.slice(start, start + limit);
  }, [filteredActivities, page, limit]);

  // Reset page when filters change
  useMemo(() => { setPage(1); }, [search, typeFilter, severityFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    activities.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, [activities]);

  const unreadCount = activities.filter((a) => a.severity === "warning" || a.severity === "error").length;

  const formatTime = (ts: string) => {
    const date = new Date(ts);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const getEntityLink = (entry: ActivityEntry): string | null => {
    if (!entry.entityType || !entry.entityId) return null;
    const routes: Record<string, string> = {
      order: "/orders/",
      shipment: "/shipping/",
      vendor: "/vendors/",
      product: "/products/",
    };
    const base = routes[entry.entityType];
    return base ? `${base}${entry.entityId}` : null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-heading small-caps">Activity Log</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {unreadCount} alerts
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">Operational events, sync status, and audit trail</p>
        </div>
        <button onClick={loadActivities} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[250px] max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search activity..."
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
          />
        </div>

        {/* Type Filter Chips */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setTypeFilter(null)}
            className={cn(
              "px-2.5 py-1.5 rounded-full text-[10px] font-semibold font-body transition-colors",
              !typeFilter ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
            )}
          >
            All
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const Icon = TYPE_ICONS[type] || Activity;
            return (
              <button
                key={type}
                onClick={() => setTypeFilter(typeFilter === type ? null : type)}
                className={cn(
                  "px-2.5 py-1.5 rounded-full text-[10px] font-semibold font-body transition-colors flex items-center gap-1",
                  typeFilter === type ? "bg-gray-900 text-white" : "text-gray-500 hover:bg-gray-100"
                )}
              >
                <Icon size={10} />
                {type}
                <span className="text-[9px] opacity-60">{count}</span>
              </button>
            );
          })}
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1 ml-auto">
          {["error", "warning", "success", "info"].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? null : sev)}
              aria-label={`Filter by ${sev} severity`}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center transition-all",
                severityFilter === sev ? "ring-2 ring-offset-1 ring-gray-400" : "hover:bg-gray-50"
              )}
              title={sev}
            >
              <span className={cn(
                "w-2.5 h-2.5 rounded-full block",
                sev === "error" ? "bg-red-500" :
                sev === "warning" ? "bg-amber-500" :
                sev === "success" ? "bg-green-500" :
                "bg-blue-400"
              )} />
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 font-body">
        Showing {paginated.length} of {filteredActivities.length} events
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        {paginated.length > 0 ? (
          paginated.map((entry) => {
            const Icon = TYPE_ICONS[entry.type] || Activity;
            const link = getEntityLink(entry);
            return (
              <div
                key={entry.id}
                className={cn(
                  "bg-white rounded-lg border border-gray-200 shadow-soft border-l-4 p-4 hover:shadow-sm transition-shadow",
                  SEVERITY_STYLES[entry.severity]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", TYPE_COLORS[entry.type])}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold font-body">{entry.title}</h4>
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded",
                        entry.severity === "error" ? "bg-red-50 text-red-600" :
                        entry.severity === "warning" ? "bg-amber-50 text-amber-600" :
                        entry.severity === "success" ? "bg-green-50 text-green-600" :
                        "bg-blue-50 text-blue-500"
                      )}>
                        {entry.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-body leading-relaxed">{entry.description}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] text-gray-400 font-body flex items-center gap-1">
                        <Clock size={8} /> {formatTime(entry.timestamp)}
                      </span>
                      <span className="text-[10px] text-gray-400 font-body">{entry.actor}</span>
                      {entry.entityLabel && (
                        <span className="text-[10px] text-gray-400 font-body font-mono">{entry.entityLabel}</span>
                      )}
                    </div>
                  </div>
                  {link && (
                    <Link href={link} className="flex-shrink-0 p-2 hover:bg-gray-50 rounded-lg transition-colors">
                      <ArrowRight size={14} className="text-gray-400" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-12 text-center">
            <Activity size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No matching activity found</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      <PaginationBar
        page={page}
        totalPages={totalPages}
        totalItems={filteredActivities.length}
        limit={limit}
        onPageChange={setPage}
        onLimitChange={(newLimit) => { setLimit(newLimit); setPage(1); }}
      />
    </div>
  );
}
