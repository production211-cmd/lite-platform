import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Eye, Wallet, Clock, CheckCircle, ArrowUpRight, DollarSign } from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters, ExportButton,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "PENDING", label: "Pending" },
  { key: "PROCESSING", label: "Processing" },
  { key: "COMPLETED", label: "Completed" },
  { key: "FAILED", label: "Failed" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "vendorName",
    label: "Vendor",
    type: "multi-select",
    options: [],
  },
  {
    key: "currency",
    label: "Currency",
    type: "multi-select",
    options: [],
  },
  {
    key: "netRange",
    label: "Net Amount",
    type: "select",
    options: [
      { value: "0-100", label: "Under $100" },
      { value: "100-500", label: "$100 – $500" },
      { value: "500-1000", label: "$500 – $1,000" },
      { value: "1000+", label: "$1,000+" },
    ],
  },
];

export default function Payouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    api.getPayouts().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.payouts || [];
      setPayouts(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const normalized = useMemo(() =>
    payouts.map((p) => {
      // Payout model has a single 'amount' field (the net payout amount)
      // PayoutItems may provide line-item breakdown
      const itemsTotal = (p.items || []).reduce((s: number, i: any) => s + (i.amount || 0), 0);
      const net = p.amount || 0;
      return {
        ...p,
        vendorName: p.vendor?.name || "Unknown",
        gross: net, // amount IS the net payout
        commission: 0, // not tracked at payout level
        deductions: 0, // not tracked at payout level
        net,
        date: p.createdAt || "",
        cycle: p.payoutCycle || "—",
      };
    }),
  [payouts]);

  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return normalized;
    return normalized.filter((p) => p.status === activeTab);
  }, [normalized, activeTab]);

  const dynamicFilterConfigs = useMemo(() => {
    const vendors = [...new Set(normalized.map((p) => p.vendorName).filter(Boolean))];
    const currencies = [...new Set(normalized.map((p) => p.currency).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v })) };
      if (f.key === "currency") return { ...f, options: currencies.map((c) => ({ value: c, label: c })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: tabFiltered,
    searchKeys: ["vendorName", "currency"],
    defaultSort: { key: "date", direction: "desc" },
    defaultLimit: 25,
  });

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalized.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = normalized.filter((p) => p.status === t.key).length;
    });
    return counts;
  }, [normalized]);

  const stats = useMemo(() => ({
    totalDisbursed: normalized.filter((p) => p.status === "COMPLETED").reduce((s, p) => s + p.net, 0),
    pending: normalized.filter((p) => p.status === "PENDING").length,
    processing: normalized.filter((p) => p.status === "PROCESSING").length,
    completed: normalized.filter((p) => p.status === "COMPLETED").length,
  }), [normalized]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PENDING") return "status-pending";
    if (s === "PROCESSING") return "status-processing";
    if (s === "COMPLETED") return "status-delivered";
    if (s === "FAILED") return "status-danger";
    return "status-neutral";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const columns: ColumnDef<any>[] = [
    { key: "vendorName", label: "Vendor", sortable: true, render: (p) => <span className="text-sm font-semibold font-body">{p.vendorName}</span> },
    { key: "periodStart", label: "Period", sortable: true, render: (p) => <span className="text-xs text-gray-500 font-body">{p.periodStart ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : "—"}</span> },
    { key: "net", label: "Amount", sortable: true, align: "right", render: (p) => <span className="text-sm font-bold font-body">{formatCurrency(p.net, p.currency)}</span> },
    { key: "cycle", label: "Cycle", sortable: true, render: (p) => <span className="text-xs font-body">{p.cycle?.replace("_", " ")}</span> },
    { key: "currency", label: "Currency", render: (p) => <span className="text-xs font-body">{p.currency}</span> },
    { key: "status", label: "Status", sortable: true, render: (p) => <span className={`status-badge ${statusColor(p.status)}`}>{p.status}</span> },
    { key: "date", label: "Created", sortable: true, render: (p) => <span className="text-xs text-gray-500 font-body">{formatDate(p.date)}</span> },
    { key: "actions", label: "", width: "80px", render: () => <button className="btn-view"><Eye size={12} /> View</button> },
  ];

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
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Payouts</h1>
          <p>Manage vendor payout disbursements</p>
        </div>
        <ExportButton onClick={() => alert("Export feature coming soon")} label="Export CSV" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="kpi-card kpi-green card-hover">
          <DollarSign size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{formatCurrency(stats.totalDisbursed)}</p>
          <p className="text-xs text-gray-500 font-body">Total Disbursed</p>
        </div>
        <div className="kpi-card kpi-orange card-hover">
          <Clock size={16} className="text-orange-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.pending}</p>
          <p className="text-xs text-gray-500 font-body">Pending</p>
        </div>
        <div className="kpi-card kpi-blue card-hover">
          <ArrowUpRight size={16} className="text-blue-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.processing}</p>
          <p className="text-xs text-gray-500 font-body">Processing</p>
        </div>
        <div className="kpi-card kpi-green card-hover">
          <CheckCircle size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.completed}</p>
          <p className="text-xs text-gray-500 font-body">Completed</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar value={grid.search} onChange={grid.setSearch} placeholder="Search by vendor name..." className="flex-1 min-w-[280px]" />
        {dynamicFilterConfigs.map((fc) => (
          <FilterDropdown key={fc.key} label={fc.label} options={fc.options || []} value={grid.filters[fc.key] || (fc.type === "multi-select" ? [] : "")} onChange={(val) => grid.setFilter(fc.key, val)} multi={fc.type === "multi-select"} />
        ))}
      </div>

      <ActiveFilters filters={grid.filters} filterConfigs={dynamicFilterConfigs} search={grid.search} onRemoveFilter={(key) => grid.setFilter(key, key === "vendorName" || key === "currency" ? [] : "")} onClearSearch={() => grid.setSearch("")} onClearAll={() => { grid.clearFilters(); setActiveTab("all"); }} />

      <div className="tab-bar">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); grid.setSearch(""); }} className={`tab-item ${activeTab === tab.key ? "active" : ""}`}>
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      <DataGrid columns={columns} data={grid.paginated} sort={grid.sort} onSort={grid.toggleSort} emptyMessage="No payouts found" emptyIcon={Wallet} />

      <PaginationBar page={grid.page} totalPages={grid.totalPages} totalItems={grid.totalFiltered} limit={grid.limit} onPageChange={grid.setPage} onLimitChange={grid.setLimit} />
    </div>
  );
}
