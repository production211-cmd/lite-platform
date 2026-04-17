import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Search, Eye, Truck, Package, Clock, CheckCircle, AlertTriangle } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "LABEL_CREATED", label: "Label Created" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "EXCEPTION", label: "Exception" },
];

export default function Shipping() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [carrierFilter, setCarrierFilter] = useState("");

  useEffect(() => {
    api.getShipments().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.shipments || [];
      setShipments(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = shipments;
    if (activeTab !== "all") {
      result = result.filter((s) => s.status === activeTab);
    }
    if (carrierFilter) {
      result = result.filter((s) => s.carrier === carrierFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((s) =>
        s.trackingNumber?.toLowerCase().includes(q) ||
        s.vendor?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [shipments, activeTab, carrierFilter, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: shipments.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") {
        counts[t.key] = shipments.filter((s) => s.status === t.key).length;
      }
    });
    return counts;
  }, [shipments]);

  const stats = useMemo(() => ({
    total: shipments.length,
    labelCreated: shipments.filter((s) => s.status === "LABEL_CREATED").length,
    inTransit: shipments.filter((s) => s.status === "IN_TRANSIT").length,
    delivered: shipments.filter((s) => s.status === "DELIVERED").length,
    exceptions: shipments.filter((s) => s.status === "EXCEPTION").length,
  }), [shipments]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "LABEL_CREATED") return "status-info";
    if (s === "PICKED_UP" || s === "IN_TRANSIT") return "status-processing";
    if (s === "DELIVERED") return "status-delivered";
    if (s === "EXCEPTION") return "status-danger";
    return "status-neutral";
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
          <p className="text-sm text-gray-500 mt-4 font-body">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Shipping View</h1>
        <p>Track and manage all marketplace shipments</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="kpi-card kpi-blue">
          <div className="flex items-center gap-2 mb-1">
            <Truck size={16} className="text-blue-500" />
          </div>
          <p className="text-2xl font-bold font-body">{stats.total}</p>
          <p className="text-xs text-gray-500 font-body">Total Shipments</p>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="flex items-center gap-2 mb-1">
            <Package size={16} className="text-purple-500" />
          </div>
          <p className="text-2xl font-bold font-body">{stats.labelCreated}</p>
          <p className="text-xs text-gray-500 font-body">Label Created</p>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="flex items-center gap-2 mb-1">
            <Clock size={16} className="text-orange-500" />
          </div>
          <p className="text-2xl font-bold font-body">{stats.inTransit}</p>
          <p className="text-xs text-gray-500 font-body">In Transit</p>
        </div>
        <div className="kpi-card kpi-green">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle size={16} className="text-green-500" />
          </div>
          <p className="text-2xl font-bold font-body">{stats.delivered}</p>
          <p className="text-xs text-gray-500 font-body">Delivered</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle size={16} className="text-red-500" />
          </div>
          <p className="text-2xl font-bold font-body">{stats.exceptions}</p>
          <p className="text-xs text-gray-500 font-body">Exceptions</p>
        </div>
      </div>

      {/* Search + Carrier Filter */}
      <div className="flex items-center gap-3">
        <div className="search-bar flex-1">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search by tracking #, vendor name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          value={carrierFilter}
          onChange={(e) => setCarrierFilter(e.target.value)}
          className="filter-select"
        >
          <option value="">All Carriers</option>
          <option value="FEDEX">FedEx</option>
          <option value="DHL">DHL</option>
          <option value="UPS">UPS</option>
        </select>
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

      {/* Shipments Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tracking #</th>
                <th>Order</th>
                <th>Vendor</th>
                <th>Carrier</th>
                <th>Model</th>
                <th>Leg</th>
                <th>Cost</th>
                <th>Status</th>
                <th>Created</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s: any) => (
                <tr key={s.id}>
                  <td className="font-mono text-xs font-semibold font-body">{s.trackingNumber}</td>
                  <td className="text-sm font-body">{s.vendorOrder?.order?.orderNumber || "—"}</td>
                  <td className="text-sm font-body">{s.vendor?.name || "—"}</td>
                  <td>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-body ${
                      s.carrier === "FEDEX" ? "bg-purple-50 text-purple-700" :
                      s.carrier === "DHL" ? "bg-yellow-50 text-yellow-700" :
                      "bg-amber-50 text-amber-700"
                    }`}>
                      {s.carrier}
                    </span>
                  </td>
                  <td className="text-xs font-body">{s.shippingModel || "—"}</td>
                  <td className="text-xs font-body">{s.leg || "—"}</td>
                  <td className="text-xs font-semibold font-body">{formatCurrency(s.shippingCost || 0)}</td>
                  <td>
                    <span className={`status-badge ${statusColor(s.status)}`}>
                      {s.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                    </span>
                  </td>
                  <td className="text-xs text-gray-500 font-body">{formatDate(s.createdAt)}</td>
                  <td>
                    <button className="btn-view">
                      <Eye size={12} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-gray-400 font-body">No shipments found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
