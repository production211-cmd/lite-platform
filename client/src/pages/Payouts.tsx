import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Search, Eye, Wallet, Clock, CheckCircle, ArrowUpRight, DollarSign } from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "FAILED", label: "Failed" },
];

export default function Payouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    api.getPayouts().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.payouts || [];
      setPayouts(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = payouts;
    if (activeTab !== "all") result = result.filter((p) => p.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.vendor?.name?.toLowerCase().includes(q));
    }
    return result;
  }, [payouts, activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: payouts.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = payouts.filter((p) => p.status === t.key).length;
    });
    return counts;
  }, [payouts]);

  const stats = useMemo(() => ({
    totalDisbursed: payouts.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + (p.netAmount || 0), 0),
    pending: payouts.filter((p) => p.status === "PENDING").length,
    processing: payouts.filter((p) => p.status === "PROCESSING").length,
    completed: payouts.filter((p) => p.status === "COMPLETED").length,
  }), [payouts]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PENDING") return "status-pending";
    if (s === "PROCESSING") return "status-processing";
    if (s === "COMPLETED") return "status-delivered";
    if (s === "FAILED") return "status-danger";
    return "status-neutral";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      <div className="page-header">
        <h1>Payouts</h1>
        <p>Manage vendor payout disbursements</p>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="kpi-card kpi-green">
          <DollarSign size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{formatCurrency(stats.totalDisbursed)}</p>
          <p className="text-xs text-gray-500 font-body">Total Disbursed</p>
        </div>
        <div className="kpi-card kpi-orange">
          <Clock size={16} className="text-orange-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.pending}</p>
          <p className="text-xs text-gray-500 font-body">Pending</p>
        </div>
        <div className="kpi-card kpi-blue">
          <ArrowUpRight size={16} className="text-blue-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.processing}</p>
          <p className="text-xs text-gray-500 font-body">Processing</p>
        </div>
        <div className="kpi-card kpi-green">
          <CheckCircle size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.completed}</p>
          <p className="text-xs text-gray-500 font-body">Completed</p>
        </div>
      </div>

      <div className="search-bar">
        <Search size={16} className="text-gray-400 flex-shrink-0" />
        <input type="text" placeholder="Search by vendor name..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="tab-bar">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`tab-item ${activeTab === tab.key ? "active" : ""}`}>
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-soft">
        <table className="data-table">
          <thead>
            <tr>
              <th>Vendor</th>
              <th>Period</th>
              <th>Gross</th>
              <th>Commission</th>
              <th>Deductions</th>
              <th>Net Amount</th>
              <th>Currency</th>
              <th>Status</th>
              <th>Created</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p: any) => (
              <tr key={p.id}>
                <td className="text-sm font-semibold font-body">{p.vendor?.name || "—"}</td>
                <td className="text-xs text-gray-500 font-body">
                  {p.periodStart ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : "—"}
                </td>
                <td className="text-sm font-body">{formatCurrency(p.grossAmount || 0, p.currency)}</td>
                <td className="text-sm text-red-600 font-body">-{formatCurrency(p.commissionAmount || 0, p.currency)}</td>
                <td className="text-sm text-red-600 font-body">-{formatCurrency(p.deductionAmount || 0, p.currency)}</td>
                <td className="text-sm font-bold font-body">{formatCurrency(p.netAmount || 0, p.currency)}</td>
                <td className="text-xs font-body">{p.currency}</td>
                <td><span className={`status-badge ${statusColor(p.status)}`}>{p.status}</span></td>
                <td className="text-xs text-gray-500 font-body">{formatDate(p.createdAt)}</td>
                <td>
                  <button className="btn-view"><Eye size={12} /> View</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={10} className="text-center py-12 text-gray-400 font-body">No payouts found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
