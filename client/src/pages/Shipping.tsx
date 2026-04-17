import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { Link } from "wouter";
import {
  Eye, Truck, Package, Clock, CheckCircle, AlertTriangle,
} from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters, ExportButton, DateRangeFilter,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "LABEL_CREATED", label: "Label Created" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "DELIVERED", label: "Delivered" },
  { key: "EXCEPTION", label: "Exception" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "carrier",
    label: "Carrier",
    type: "multi-select",
    options: [
      { value: "FEDEX", label: "FedEx" },
      { value: "DHL", label: "DHL" },
      { value: "UPS", label: "UPS" },
      { value: "USPS", label: "USPS" },
    ],
  },
  {
    key: "shippingModel",
    label: "Model",
    type: "select",
    options: [],
  },
  {
    key: "leg",
    label: "Leg",
    type: "select",
    options: [],
  },
  {
    key: "costRange",
    label: "Cost",
    type: "select",
    options: [
      { value: "0-10", label: "Under $10" },
      { value: "10-25", label: "$10 – $25" },
      { value: "25-50", label: "$25 – $50" },
      { value: "50+", label: "$50+" },
    ],
  },
];

export default function Shipping() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    api.getShipments().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.shipments || [];
      setShipments(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Normalize
  const normalized = useMemo(() =>
    shipments.map((s) => ({
      ...s,
      vendorName: s.vendor?.name || "Unknown",
      orderNumber: s.vendorOrder?.order?.orderNumber || "—",
      cost: s.shippingCost || 0,
      date: s.createdAt || "",
    })),
  [shipments]);

  // Tab + date filter
  const tabFiltered = useMemo(() => {
    let result = normalized;
    if (activeTab !== "all") result = result.filter((s) => s.status === activeTab);
    if (dateStart) result = result.filter((s) => s.date >= dateStart);
    if (dateEnd) result = result.filter((s) => s.date <= dateEnd + "T23:59:59");
    return result;
  }, [normalized, activeTab, dateStart, dateEnd]);

  // Dynamic filter options
  const dynamicFilterConfigs = useMemo(() => {
    const models = [...new Set(normalized.map((s) => s.shippingModel).filter(Boolean))];
    const legs = [...new Set(normalized.map((s) => s.leg).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "shippingModel") return { ...f, options: models.map((m) => ({ value: m, label: m })) };
      if (f.key === "leg") return { ...f, options: legs.map((l) => ({ value: l, label: l })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: tabFiltered,
    searchKeys: ["trackingNumber", "vendorName", "orderNumber", "carrier"],
    defaultSort: { key: "date", direction: "desc" },
    defaultLimit: 25,
  });

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalized.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = normalized.filter((s) => s.status === t.key).length;
    });
    return counts;
  }, [normalized]);

  const stats = useMemo(() => ({
    total: normalized.length,
    labelCreated: normalized.filter((s) => s.status === "LABEL_CREATED").length,
    inTransit: normalized.filter((s) => s.status === "IN_TRANSIT").length,
    delivered: normalized.filter((s) => s.status === "DELIVERED").length,
    exceptions: normalized.filter((s) => s.status === "EXCEPTION").length,
  }), [normalized]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "LABEL_CREATED") return "status-info";
    if (s === "PICKED_UP" || s === "IN_TRANSIT") return "status-processing";
    if (s === "DELIVERED") return "status-delivered";
    if (s === "EXCEPTION") return "status-danger";
    return "status-neutral";
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " " +
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "trackingNumber",
      label: "Tracking #",
      sortable: true,
      render: (s) => <span className="font-mono text-xs font-semibold">{s.trackingNumber}</span>,
    },
    {
      key: "orderNumber",
      label: "Order",
      sortable: true,
      render: (s) => <span className="text-sm font-body">{s.orderNumber}</span>,
    },
    {
      key: "vendorName",
      label: "Vendor",
      sortable: true,
      render: (s) => <span className="text-sm font-body">{s.vendorName}</span>,
    },
    {
      key: "carrier",
      label: "Carrier",
      sortable: true,
      render: (s) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded font-body ${
          s.carrier === "FEDEX" ? "bg-purple-50 text-purple-700" :
          s.carrier === "DHL" ? "bg-yellow-50 text-yellow-700" :
          s.carrier === "UPS" ? "bg-amber-50 text-amber-700" :
          "bg-gray-50 text-gray-700"
        }`}>
          {s.carrier}
        </span>
      ),
    },
    {
      key: "shippingModel",
      label: "Model",
      sortable: true,
      render: (s) => <span className="text-xs font-body">{s.shippingModel || "—"}</span>,
    },
    {
      key: "leg",
      label: "Leg",
      sortable: true,
      render: (s) => <span className="text-xs font-body">{s.leg || "—"}</span>,
    },
    {
      key: "cost",
      label: "Cost",
      sortable: true,
      align: "right",
      render: (s) => <span className="text-xs font-semibold font-body">{formatCurrency(s.cost)}</span>,
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (s) => (
        <span className={`status-badge ${statusColor(s.status)}`}>
          {s.status?.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
        </span>
      ),
    },
    {
      key: "date",
      label: "Created",
      sortable: true,
      render: (s) => <span className="text-xs text-gray-500 font-body">{formatDate(s.date)}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (s) => (
        <Link href={`/shipping/${s.id}`} className="btn-view">
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
          <p className="text-sm text-gray-500 mt-4 font-body">Loading shipments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Shipping View</h1>
          <p>Track and manage all marketplace shipments</p>
        </div>
        <ExportButton onClick={() => alert("Export feature coming soon")} label="Export CSV" />
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-5 gap-3">
        <div className="kpi-card kpi-blue card-hover">
          <div className="flex items-center gap-2 mb-1"><Truck size={16} className="text-blue-500" /></div>
          <p className="text-2xl font-bold font-body">{stats.total}</p>
          <p className="text-xs text-gray-500 font-body">Total Shipments</p>
        </div>
        <div className="kpi-card kpi-purple card-hover">
          <div className="flex items-center gap-2 mb-1"><Package size={16} className="text-purple-500" /></div>
          <p className="text-2xl font-bold font-body">{stats.labelCreated}</p>
          <p className="text-xs text-gray-500 font-body">Label Created</p>
        </div>
        <div className="kpi-card kpi-orange card-hover">
          <div className="flex items-center gap-2 mb-1"><Clock size={16} className="text-orange-500" /></div>
          <p className="text-2xl font-bold font-body">{stats.inTransit}</p>
          <p className="text-xs text-gray-500 font-body">In Transit</p>
        </div>
        <div className="kpi-card kpi-green card-hover">
          <div className="flex items-center gap-2 mb-1"><CheckCircle size={16} className="text-green-500" /></div>
          <p className="text-2xl font-bold font-body">{stats.delivered}</p>
          <p className="text-xs text-gray-500 font-body">Delivered</p>
        </div>
        <div className="kpi-card kpi-pink card-hover">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle size={16} className="text-red-500" /></div>
          <p className="text-2xl font-bold font-body">{stats.exceptions}</p>
          <p className="text-xs text-gray-500 font-body">Exceptions</p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={grid.search}
          onChange={grid.setSearch}
          placeholder="Search by tracking #, vendor, order #, carrier..."
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
          label="Ship date"
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
        onRemoveFilter={(key) => grid.setFilter(key, key === "carrier" ? [] : "")}
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
        emptyMessage="No shipments found"
        emptyIcon={Truck}
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
