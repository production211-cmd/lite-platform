import { useEffect, useState, useMemo, useCallback } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { Eye, Wallet, Clock, CheckCircle, ArrowUpRight, DollarSign, X, Play } from "lucide-react";
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    api.getPayouts().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.payouts || [];
      setPayouts(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Bulk process settlements
  const handleBulkProcess = useCallback(async () => {
    if (selectedIds.size === 0) return;
    setBulkLoading(true);
    try {
      const result = await api.bulkProcessSettlements(Array.from(selectedIds));
      setStatusMessage(`${result.processed || selectedIds.size} settlement${selectedIds.size > 1 ? "s" : ""} moved to processing`);
      setSelectedIds(new Set());
      load();
    } catch (err) {
      console.error(err);
      setStatusMessage("Bulk process failed — please try again");
    }
    setBulkLoading(false);
    setTimeout(() => setStatusMessage(""), 4000);
  }, [selectedIds, load]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const normalized = useMemo(() =>
    payouts.map((p) => {
      const net = p.amount || 0;
      return {
        ...p,
        vendorName: p.vendor?.name || "Unknown",
        gross: net,
        commission: 0,
        deductions: 0,
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

  // Only PENDING settlements can be bulk-processed
  const pendingOnPage = useMemo(() =>
    tabFiltered.filter((p) => p.status === "PENDING"),
  [tabFiltered]);

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

  const selectAllPendingOnPage = () => {
    const pendingIds = grid.paginated.filter((p: any) => p.status === "PENDING").map((p: any) => p.id);
    if (pendingIds.length === 0) return;
    const allSelected = pendingIds.every((id: string) => selectedIds.has(id));
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "select", label: "", width: "40px",
      render: (p) => p.status === "PENDING" ? (
        <input
          type="checkbox"
          checked={selectedIds.has(p.id)}
          onChange={() => toggleSelect(p.id)}
          className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
          aria-label={`Select settlement for ${p.vendorName}`}
        />
      ) : <div className="w-4" />,
    },
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

      {/* Screen reader announcement for bulk actions */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">{statusMessage}</div>

      {/* Bulk Action Toolbar */}
      {selectedIds.size > 0 && (
        <div className="bg-gray-900 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2">
          <span className="text-sm font-medium">{selectedIds.size} settlement{selectedIds.size > 1 ? "s" : ""} selected</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkProcess}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Play size={14} /> Process All
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Clear selection"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Status toast */}
      {statusMessage && (
        <div className={cn(
          "rounded-lg px-4 py-2.5 text-sm font-medium flex items-center gap-2",
          statusMessage.includes("failed")
            ? "bg-red-50 border border-red-200 text-red-800"
            : "bg-emerald-50 border border-emerald-200 text-emerald-800"
        )}>
          <CheckCircle size={16} /> {statusMessage}
        </div>
      )}

      <div className="tab-bar">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); grid.setSearch(""); setSelectedIds(new Set()); }} className={`tab-item ${activeTab === tab.key ? "active" : ""}`}>
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* Select All Pending header — only show when on Pending tab or All tab with pending items */}
      {pendingOnPage.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200">
          <input
            type="checkbox"
            checked={pendingOnPage.length > 0 && pendingOnPage.every((p) => selectedIds.has(p.id))}
            onChange={selectAllPendingOnPage}
            className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
            aria-label="Select all pending settlements on this page"
          />
          <span className="text-xs text-gray-500">{pendingOnPage.length} pending settlement{pendingOnPage.length !== 1 ? "s" : ""} on this page</span>
        </div>
      )}

      <DataGrid columns={columns} data={grid.paginated} sort={grid.sort} onSort={grid.toggleSort} emptyMessage="No payouts found" emptyIcon={Wallet} />

      <PaginationBar page={grid.page} totalPages={grid.totalPages} totalItems={grid.totalFiltered} limit={grid.limit} onPageChange={grid.setPage} onLimitChange={grid.setLimit} />
    </div>
  );
}
