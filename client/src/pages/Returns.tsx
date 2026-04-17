import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import {
  Eye, RotateCcw, Clock, Package, CheckCircle, DollarSign,
} from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters, ExportButton, DateRangeFilter,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "INITIATED", label: "Initiated" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "RECEIVED_WAREHOUSE", label: "Received" },
  { key: "INSPECTING", label: "Inspecting" },
  { key: "APPROVED", label: "Approved" },
  { key: "REFUNDED", label: "Refunded" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "vendorName",
    label: "Vendor",
    type: "multi-select",
    options: [],
  },
  {
    key: "reason",
    label: "Reason",
    type: "multi-select",
    options: [],
  },
  {
    key: "refundRange",
    label: "Refund Amount",
    type: "select",
    options: [
      { value: "0-25", label: "Under $25" },
      { value: "25-50", label: "$25 – $50" },
      { value: "50-100", label: "$50 – $100" },
      { value: "100+", label: "$100+" },
    ],
  },
];

export default function Returns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    api.getReturns().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.returns || [];
      setReturns(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Normalize
  const normalized = useMemo(() =>
    returns.map((r) => ({
      ...r,
      vendorName: r.vendor?.name || "Unknown",
      orderNumber: r.vendorOrder?.order?.orderNumber || "—",
      refund: r.refundAmount || 0,
      date: r.initiatedAt || r.createdAt || "",
    })),
  [returns]);

  // Tab + date filter
  const tabFiltered = useMemo(() => {
    let result = normalized;
    if (activeTab !== "all") result = result.filter((r) => r.status === activeTab);
    if (dateStart) result = result.filter((r) => r.date >= dateStart);
    if (dateEnd) result = result.filter((r) => r.date <= dateEnd + "T23:59:59");
    return result;
  }, [normalized, activeTab, dateStart, dateEnd]);

  // Dynamic filter options
  const dynamicFilterConfigs = useMemo(() => {
    const vendors = [...new Set(normalized.map((r) => r.vendorName).filter(Boolean))];
    const reasons = [...new Set(normalized.map((r) => r.reason).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v, count: normalized.filter((r) => r.vendorName === v).length })) };
      if (f.key === "reason") return { ...f, options: reasons.map((r) => ({ value: r, label: r, count: normalized.filter((ret) => ret.reason === r).length })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: tabFiltered,
    searchKeys: ["orderNumber", "vendorName", "reason"],
    defaultSort: { key: "date", direction: "desc" },
    defaultLimit: 25,
  });

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalized.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = normalized.filter((r) => r.status === t.key).length;
    });
    return counts;
  }, [normalized]);

  const stats = useMemo(() => ({
    total: normalized.length,
    initiated: normalized.filter((r) => r.status === "INITIATED").length,
    inTransit: normalized.filter((r) => r.status === "IN_TRANSIT").length,
    inspecting: normalized.filter((r) => r.status === "INSPECTING").length,
    totalRefunds: normalized.reduce((sum, r) => sum + r.refund, 0),
  }), [normalized]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "INITIATED") return "status-pending";
    if (s === "IN_TRANSIT") return "status-processing";
    if (s === "RECEIVED_WAREHOUSE" || s === "INSPECTING") return "status-info";
    if (s === "APPROVED" || s === "REFUNDED") return "status-delivered";
    return "status-neutral";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "orderNumber",
      label: "Order",
      sortable: true,
      render: (r) => <span className="text-sm font-semibold font-body">{r.orderNumber}</span>,
    },
    {
      key: "vendorName",
      label: "Vendor",
      sortable: true,
      render: (r) => <span className="text-sm font-body">{r.vendorName}</span>,
    },
    {
      key: "reason",
      label: "Reason",
      sortable: true,
      render: (r) => <span className="text-sm font-body">{r.reason || "—"}</span>,
    },
    {
      key: "refund",
      label: "Refund Amount",
      sortable: true,
      align: "right",
      render: (r) => <span className="text-sm font-semibold font-body">{r.refund ? formatCurrency(r.refund) : "—"}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (r) => (
        <span className={`status-badge ${statusColor(r.status)}`}>
          {r.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
        </span>
      ),
    },
    {
      key: "date",
      label: "Initiated",
      sortable: true,
      render: (r) => <span className="text-xs text-gray-500 font-body">{formatDate(r.date)}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (r) => (
        <Link href={`/orders/returns/${r.id}`} className="btn-view">
          <Eye size={12} /> View
        </Link>
      ),
    },
  ];

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
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Returns</h1>
          <p>Manage product returns and refund processing</p>
        </div>
        <ExportButton onClick={() => alert("Export feature coming soon")} label="Export CSV" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="kpi-card kpi-purple card-hover">
          <RotateCcw size={16} className="text-purple-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.total}</p>
          <p className="text-xs text-gray-500 font-body">Total Returns</p>
        </div>
        <div className="kpi-card kpi-orange card-hover">
          <Clock size={16} className="text-orange-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.initiated}</p>
          <p className="text-xs text-gray-500 font-body">Initiated</p>
        </div>
        <div className="kpi-card kpi-blue card-hover">
          <Package size={16} className="text-blue-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.inTransit}</p>
          <p className="text-xs text-gray-500 font-body">In Transit</p>
        </div>
        <div className="kpi-card kpi-green card-hover">
          <CheckCircle size={16} className="text-green-500 mb-1" />
          <p className="text-2xl font-bold font-body">{stats.inspecting}</p>
          <p className="text-xs text-gray-500 font-body">Inspecting</p>
        </div>
        <div className="kpi-card kpi-pink card-hover">
          <DollarSign size={16} className="text-emerald-500 mb-1" />
          <p className="text-2xl font-bold font-body">{formatCurrency(stats.totalRefunds)}</p>
          <p className="text-xs text-gray-500 font-body">Total Refunds</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={grid.search}
          onChange={grid.setSearch}
          placeholder="Search by order #, vendor, reason..."
          className="flex-1 min-w-[280px]"
        />
        {dynamicFilterConfigs.map((fc) => (
          <FilterDropdown
            key={fc.key}
            label={fc.label}
            options={fc.options || []}
            value={grid.filters[fc.key] || (fc.type === "multi-select" ? [] : "")}
            onChange={(val) => grid.setFilter(fc.key, val)}
            multi={fc.type === "multi-select"}
          />
        ))}
      </div>

      {/* Date Range */}
      <div className="flex items-center gap-3 flex-wrap">
        <DateRangeFilter
          label="Return date"
          startDate={dateStart}
          endDate={dateEnd}
          onStartChange={setDateStart}
          onEndChange={setDateEnd}
          onClear={() => { setDateStart(""); setDateEnd(""); }}
        />
      </div>

      {/* Active Filters */}
      <ActiveFilters
        filters={grid.filters}
        filterConfigs={dynamicFilterConfigs}
        search={grid.search}
        onRemoveFilter={(key) => grid.setFilter(key, key === "vendorName" || key === "reason" ? [] : "")}
        onClearSearch={() => grid.setSearch("")}
        onClearAll={grid.clearFilters}
      />

      {/* Tab Bar */}
      <div className="tab-bar">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); grid.setSearch(""); }}
            className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={grid.paginated}
        sort={grid.sort}
        onSort={grid.toggleSort}
        emptyMessage="No returns found"
        emptyIcon={RotateCcw}
      />

      {/* Pagination */}
      <PaginationBar
        page={grid.page}
        totalPages={grid.totalPages}
        totalItems={grid.totalFiltered}
        limit={grid.limit}
        onPageChange={grid.setPage}
        onLimitChange={grid.setLimit}
      />
    </div>
  );
}
