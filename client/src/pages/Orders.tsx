import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Search, Eye, ChevronLeft, ChevronRight, ClipboardList } from "lucide-react";

const VENDOR_COLORS: Record<string, string> = {};
const COLOR_PALETTE = [
  "#0d9488", "#7c3aed", "#db2777", "#ea580c", "#2563eb",
  "#059669", "#d97706", "#4f46e5", "#be123c", "#0891b2",
  "#7c2d12", "#6d28d9",
];
let colorIdx = 0;
function getVendorColor(name: string) {
  if (!VENDOR_COLORS[name]) {
    VENDOR_COLORS[name] = COLOR_PALETTE[colorIdx % COLOR_PALETTE.length];
    colorIdx++;
  }
  return VENDOR_COLORS[name];
}

const TABS = [
  { key: "all", label: "All" },
  { key: "PLACED", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    api.getOrders().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.orders || [];
      setOrders(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = orders;
    if (activeTab !== "all") {
      result = result.filter((o) => o.status === activeTab);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        o.customerName?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, activeTab, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    TABS.forEach((t) => {
      if (t.key !== "all") {
        counts[t.key] = orders.filter((o) => o.status === t.key).length;
      }
    });
    return counts;
  }, [orders]);

  const stats = useMemo(() => ({
    total: orders.length,
    pending: orders.filter((o) => o.status === "PLACED").length,
    processing: orders.filter((o) => ["PROCESSING", "VENDOR_ACCEPT"].includes(o.status)).length,
    shipped: orders.filter((o) => o.status === "SHIPPED").length,
    delivered: orders.filter((o) => o.status === "DELIVERED").length,
  }), [orders]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PLACED") return "status-pending";
    if (s === "PROCESSING" || s === "VENDOR_ACCEPT") return "status-processing";
    if (s === "DELIVERED") return "status-delivered";
    if (s === "SHIPPED" || s === "IN_TRANSIT") return "status-shipped";
    if (s === "CANCELLED") return "status-cancelled";
    return "status-neutral";
  };

  const statusLabel = (status: string) => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Page Header */}
      <div className="page-header">
        <h1>All Orders</h1>
        <p>View and manage all marketplace orders</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: "Total", value: stats.total },
          { label: "Pending", value: stats.pending },
          { label: "Processing", value: stats.processing },
          { label: "Shipped", value: stats.shipped },
          { label: "Delivered", value: stats.delivered },
        ].map((s) => (
          <div key={s.label} className="quick-stat card-hover">
            <p className="stat-number">{s.value.toLocaleString()}</p>
            <p className="stat-label">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search + Paste List + Vendor Filter */}
      <div className="flex items-center gap-3">
        <div className="search-bar flex-1">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder='Search by order #, customer name... (use commas for multi-search: 8388, 8476,'
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <button className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 font-body transition-colors flex items-center gap-1.5">
          <ClipboardList size={14} />
          Paste list
        </button>
        <select className="filter-select">
          <option>All Vendors</option>
        </select>
      </div>

      {/* Tab Bar */}
      <div className="flex items-center justify-between">
        <div className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setPage(1); }}
              className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
            >
              {tab.label} ({tabCounts[tab.key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Results count + Pagination info */}
      <div className="flex items-center justify-between text-xs text-gray-500 font-body">
        <span>Showing {Math.min(((page - 1) * perPage) + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length.toLocaleString()} orders</span>
        <span>Page {page} of {Math.max(totalPages, 1)}</span>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-soft">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8"><input type="checkbox" className="rounded" /></th>
                <th>Order</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Vendors</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Shipment</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((order: any) => (
                <tr key={order.id}>
                  <td><input type="checkbox" className="rounded" /></td>
                  <td className="font-semibold font-body text-sm">{order.orderNumber}</td>
                  <td className="text-sm font-body text-gray-600">{formatDate(order.createdAt || order.placedAt)}</td>
                  <td className="font-body text-sm">
                    <div>{order.customerName}</div>
                    <div className="text-xs text-gray-400">{order.shippingCity || "New York"}, {order.shippingState || "NY"}</div>
                  </td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {order.vendorOrders?.slice(0, 2).map((vo: any, i: number) => (
                        <span
                          key={i}
                          className="vendor-pill"
                          style={{ backgroundColor: getVendorColor(vo.vendor?.name || "Unknown") }}
                        >
                          {vo.vendor?.name || "Vendor"}
                        </span>
                      ))}
                      {(order.vendorOrders?.length || 0) > 2 && (
                        <span className="text-xs text-gray-400 font-body">+{order.vendorOrders.length - 2}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-gray-400 font-body">{order.vendorOrders?.length || 0} item{(order.vendorOrders?.length || 0) !== 1 ? "s" : ""}</span>
                  </td>
                  <td className="font-semibold font-body text-sm">{formatCurrency(order.totalAmount)}</td>
                  <td>
                    <span className="status-badge status-authorized">authorized</span>
                  </td>
                  <td className="text-sm font-body text-gray-500">
                    {order.status === "SHIPPED" || order.status === "DELIVERED" || order.status === "IN_TRANSIT" ? "Shipped" : "Not Shipped"}
                  </td>
                  <td>
                    <Link href={`/orders/${order.id}`}>
                      <button className="btn-view">
                        <Eye size={12} />
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-gray-400 font-body">No orders found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p > totalPages || p < 1) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold font-body transition-colors ${
                  p === page ? "bg-gray-900 text-white" : "border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
