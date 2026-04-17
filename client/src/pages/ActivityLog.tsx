/**
 * ActivityLog — Notifications & Audit Trail
 * ============================================
 * Design: List-first layout with filterable activity feed.
 * Shows operational events: syncs, disputes, payouts, queue actions,
 * vendor changes, order state transitions, and system alerts.
 * Serves as the visible audit/activity surface Perplexity required.
 */

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  Activity, Bell, Filter, Search, Clock, CheckCircle,
  AlertTriangle, XCircle, RefreshCw, ShoppingBag, Truck,
  CreditCard, Users, Database, Package, Shield, ArrowRight,
  ChevronRight, Eye, Settings,
} from "lucide-react";

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

// Mock activity data
const MOCK_ACTIVITIES: ActivityEntry[] = [
  { id: "a1", timestamp: "2026-04-17T07:45:00Z", type: "sync", severity: "success", title: "Shopify sync completed", description: "Full catalog sync completed. 847 products synced, 3 conflicts resolved automatically.", actor: "System", entityType: "sync", entityId: "sync-42", entityLabel: "Catalog Sync #42" },
  { id: "a2", timestamp: "2026-04-17T07:30:00Z", type: "order", severity: "info", title: "New order received", description: "Order LT-2026-0089 placed by customer. 3 items, total $2,340.00. Auto-assigned to Julian Fashion.", actor: "System", entityType: "order", entityId: "ord-89", entityLabel: "LT-2026-0089" },
  { id: "a3", timestamp: "2026-04-17T07:15:00Z", type: "shipment", severity: "warning", title: "Customs hold detected", description: "Shipment FX-9284756103 held at JFK customs. Missing commercial invoice for luxury goods.", actor: "FedEx Tracking", entityType: "shipment", entityId: "shp-42", entityLabel: "FX-9284756103" },
  { id: "a4", timestamp: "2026-04-17T06:50:00Z", type: "finance", severity: "success", title: "Settlement batch completed", description: "Weekly settlement processed. 12 vendors paid, total £45,230.00. 2 deductions applied.", actor: "Settlement Worker", entityType: "finance", entityId: "stl-18", entityLabel: "Settlement #18" },
  { id: "a5", timestamp: "2026-04-17T06:30:00Z", type: "vendor", severity: "info", title: "Vendor onboarding progressed", description: "Maison Valentino completed compliance step. 3 of 5 documents uploaded, pending review.", actor: "vendor@valentino.com", entityType: "vendor", entityId: "v-12", entityLabel: "Maison Valentino" },
  { id: "a6", timestamp: "2026-04-17T06:00:00Z", type: "product", severity: "info", title: "Product approved", description: "Cashmere Double-Breasted Coat by Brunello Cucinelli approved and queued for Shopify push.", actor: "ops@lordandtaylor.com", entityType: "product", entityId: "p-234", entityLabel: "BC-COAT-FW26" },
  { id: "a7", timestamp: "2026-04-17T05:45:00Z", type: "security", severity: "warning", title: "Failed login attempt", description: "3 failed login attempts from IP 203.0.113.42. Account not locked (threshold: 5).", actor: "Security Monitor" },
  { id: "a8", timestamp: "2026-04-17T05:30:00Z", type: "sync", severity: "error", title: "Shopify webhook failed", description: "Order webhook delivery failed for order #1089. Retry scheduled in 5 minutes.", actor: "Webhook Handler", entityType: "sync", entityId: "wh-1089", entityLabel: "Webhook #1089" },
  { id: "a9", timestamp: "2026-04-17T05:00:00Z", type: "order", severity: "info", title: "Order shipped", description: "Order LT-2026-0085 shipped via DHL Express. Tracking: DHL-4829571036. ETA: Apr 20.", actor: "System", entityType: "order", entityId: "ord-85", entityLabel: "LT-2026-0085" },
  { id: "a10", timestamp: "2026-04-17T04:30:00Z", type: "system", severity: "info", title: "Queue backfill completed", description: "Catalog enrichment queue backfill completed. 23 products re-processed successfully.", actor: "ops@lordandtaylor.com" },
  { id: "a11", timestamp: "2026-04-16T22:00:00Z", type: "finance", severity: "info", title: "Deduction created", description: "Return deduction of $4,950.00 created for vendor Julian Fashion. Linked to RET-2026-0018.", actor: "System", entityType: "finance", entityId: "ded-45", entityLabel: "Deduction #45" },
  { id: "a12", timestamp: "2026-04-16T20:00:00Z", type: "vendor", severity: "success", title: "Vendor activated", description: "Gucci Italia S.p.A. onboarding complete. Vendor activated with FULL portal access.", actor: "ops@lordandtaylor.com", entityType: "vendor", entityId: "v-11", entityLabel: "Gucci Italia" },
];

export default function ActivityLog() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);

  const filteredActivities = useMemo(() => {
    return MOCK_ACTIVITIES.filter((a) => {
      if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.description.toLowerCase().includes(search.toLowerCase())) return false;
      if (typeFilter && a.type !== typeFilter) return false;
      if (severityFilter && a.severity !== severityFilter) return false;
      return true;
    });
  }, [search, typeFilter, severityFilter]);

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    MOCK_ACTIVITIES.forEach((a) => {
      counts[a.type] = (counts[a.type] || 0) + 1;
    });
    return counts;
  }, []);

  const unreadCount = MOCK_ACTIVITIES.filter((a) => a.severity === "warning" || a.severity === "error").length;

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

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold font-heading">Activity Log</h1>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600">
                {unreadCount} alerts
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">Operational events, sync status, and audit trail</p>
        </div>
        <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
          <RefreshCw size={12} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
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
        <div className="flex items-center gap-1">
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
              className={cn(
                "w-2.5 h-2.5 rounded-full border-2 transition-all",
                severityFilter === sev ? "scale-150" : "",
                sev === "error" ? "bg-red-500 border-red-500" :
                sev === "warning" ? "bg-amber-500 border-amber-500" :
                sev === "success" ? "bg-green-500 border-green-500" :
                "bg-blue-400 border-blue-400"
              )}
              title={sev}
            />
          ))}
        </div>
      </div>

      {/* Activity Feed */}
      <div className="space-y-2">
        {filteredActivities.length > 0 ? (
          filteredActivities.map((entry) => {
            const Icon = TYPE_ICONS[entry.type] || Activity;
            const link = getEntityLink(entry);
            return (
              <div
                key={entry.id}
                className={cn(
                  "bg-white rounded-lg border border-gray-200 border-l-4 p-4 hover:shadow-sm transition-shadow",
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
          <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
            <Activity size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-gray-400 font-body">No matching activity found</p>
          </div>
        )}
      </div>
    </div>
  );
}
