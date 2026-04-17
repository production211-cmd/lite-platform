import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import { Search, Eye, RotateCcw, Clock, Package, CheckCircle, DollarSign } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "INITIATED", label: "Initiated" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "RECEIVED_WAREHOUSE", label: "Received" },
  { key: "INSPECTING", label: "Inspecting" },
  { key: "APPROVED", label: "Approved" },
  { key: "REFUNDED", label: "Refunded" },
];

export default function Returns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    api.getReturns().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.returns || [];
      setReturns(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = returns;
    if (activeTab !== "all") result = result.filter((r) => r.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) =>
        r.vendorOrder?.order?.orderNumber?.toLowerCase().includes(q) ||
        r.vendor?.name?.toLowerCase().includes(q) ||
        r.reason?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [returns, activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: returns.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = returns.filter((r) => r.status === t.key).length;
    });
    return counts;
  }, [returns]);

  const stats = useMemo(() => ({
    total: returns.length,
    initiated: returns.filter((r) => r.status === "INITIATED").length,
    inTransit: returns.filter((r) => r.status === "IN_TRANSIT").length,
    inspecting: returns.filter((r) => r.status === "INSPECTING").length,
    totalRefunds: returns.reduce((sum, r) => sum + (r.refundAmount || 0), 0),
  }), [returns]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "INITIATED") return "status-pending";
    if (s === "IN_TRANSIT") return "status-processing";
    if (s === "RECEIVED_WAREHOUSE" || s === "INSPECTING") return "status-info";
    if (s === "APPROVED" || s === "REFUNDED") return "status-delivered";
    return "status-neutral";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Returns</h1>
        <p>Manage product returns and refund processing</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="kpi-card kpi-purple">
          <RotateCcw size={16} className="text-purple-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.total}</p>
          <p className="text-xs text-gray-500 font-body">Total Returns</p>
        </div>
        <div className="kpi-card kpi-orange">
          <Clock size={16} className="text-orange-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.initiated}</p>
          <p className="text-xs text-gray-500 font-body">Initiated</p>
        </div>
        <div className="kpi-card kpi-blue">
          <Package size={16} className="text-blue-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.inTransit}</p>
          <p className="text-xs text-gray-500 font-body">In Transit</p>
        </div>
        <div className="kpi-card kpi-green">
          <CheckCircle size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.inspecting}</p>
          <p className="text-xs text-gray-500 font-body">Inspecting</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <DollarSign size={16} className="text-emerald-500 mb-1" />
          <p className="text-2xl font-bold font-body">{formatCurrency(stats.totalRefunds)}</p>
          <p className="text-xs text-gray-500 font-body">Total Refunds</p>
        </div>
      </div>

      {/* Search */}
      <div className="search-bar">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input
          type="text"
          placeholder="Search by order #, vendor, reason..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Vendor</th>
              <th>Reason</th>
              <th>Refund Amount</th>
              <th>Status</th>
              <th>Initiated</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r: any) => (
              <tr key={r.id}>
                <td className="text-sm font-semibold font-body">{r.vendorOrder?.order?.orderNumber || "—"}</td>
                <td className="text-sm font-body">{r.vendor?.name || "—"}</td>
                <td className="text-sm font-body">{r.reason || "—"}</td>
                <td className="text-sm font-semibold font-body">{r.refundAmount ? formatCurrency(r.refundAmount) : "—"}</td>
                <td>
                  <span className={`status-badge ${statusColor(r.status)}`}>
                    {r.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                  </span>
                </td>
                <td className="text-xs text-gray-500 font-body">{formatDate(r.initiatedAt || r.createdAt)}</td>
                <td>
                  <Link href={`/orders/returns/${r.id}`} className="btn-view">
                    <Eye size={12} />
                    View
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400 font-body">No returns found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
