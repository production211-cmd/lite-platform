import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import {
  Eye, ClipboardList, ShoppingCart, Download, Trash2, Tag,
} from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, BulkActionsBar, ActiveFilters, ExportButton,
  DateRangeFilter,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

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

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "vendorName",
    label: "Vendor",
    type: "multi-select",
    options: [],
  },
  {
    key: "amountRange",
    label: "Amount",
    type: "select",
    options: [
      { value: "0-50", label: "Under $50" },
      { value: "50-100", label: "$50 – $100" },
      { value: "100-500", label: "$100 – $500" },
      { value: "500-1000", label: "$500 – $1,000" },
      { value: "1000+", label: "$1,000+" },
    ],
  },
  {
    key: "paymentStatus",
    label: "Payment",
    type: "select",
    options: [
      { value: "authorized", label: "Authorized" },
      { value: "captured", label: "Captured" },
      { value: "refunded", label: "Refunded" },
    ],
  },
];

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");

  useEffect(() => {
    api.getOrders().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.orders || [];
      setOrders(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Normalize orders
  const normalized = useMemo(() =>
    orders.map((o) => ({
      ...o,
      vendorName: o.vendorOrders?.[0]?.vendor?.name || "Unknown",
      vendorCount: o.vendorOrders?.length || 0,
      amount: o.totalAmount || 0,
      date: o.createdAt || o.placedAt || "",
    })),
  [orders]);

  // Tab filter
  const tabFiltered = useMemo(() => {
    let result = normalized;
    if (activeTab !== "all") result = result.filter((o) => o.status === activeTab);
    // Date range filter
    if (dateStart) result = result.filter((o) => o.date >= dateStart);
    if (dateEnd) result = result.filter((o) => o.date <= dateEnd + "T23:59:59");
    return result;
  }, [normalized, activeTab, dateStart, dateEnd]);

  // Dynamic filter options
  const dynamicFilterConfigs = useMemo(() => {
    const vendors = [...new Set(normalized.map((o) => o.vendorName).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v, count: normalized.filter((o) => o.vendorName === v).length })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: tabFiltered,
    searchKeys: ["orderNumber", "customerName", "vendorName"],
    defaultSort: { key: "date", direction: "desc" },
    defaultLimit: 25,
  });

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalized.length };
    TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = normalized.filter((o) => o.status === t.key).length;
    });
    return counts;
  }, [normalized]);

  const stats = useMemo(() => ({
    total: normalized.length,
    pending: normalized.filter((o) => o.status === "PLACED").length,
    processing: normalized.filter((o) => ["PROCESSING", "VENDOR_ACCEPT"].includes(o.status)).length,
    shipped: normalized.filter((o) => o.status === "SHIPPED").length,
    delivered: normalized.filter((o) => o.status === "DELIVERED").length,
  }), [normalized]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "PLACED") return "status-pending";
    if (s === "PROCESSING" || s === "VENDOR_ACCEPT") return "status-processing";
    if (s === "DELIVERED") return "status-delivered";
    if (s === "SHIPPED" || s === "IN_TRANSIT") return "status-shipped";
    if (s === "CANCELLED") return "status-cancelled";
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
      key: "orderNumber",
      label: "Order",
      sortable: true,
      render: (o) => <span className="font-semibold font-body text-sm">{o.orderNumber}</span>,
    },
    {
      key: "date",
      label: "Date",
      sortable: true,
      render: (o) => <span className="text-sm font-body text-gray-600">{formatDate(o.date)}</span>,
    },
    {
      key: "customerName",
      label: "Customer",
      sortable: true,
      render: (o) => (
        <div>
          <div className="text-sm font-body">{o.customerName}</div>
          <div className="text-xs text-gray-400">{o.shippingCity || "New York"}, {o.shippingState || "NY"}</div>
        </div>
      ),
    },
    {
      key: "vendorName",
      label: "Vendors",
      sortable: true,
      render: (o) => (
        <div>
          <div className="flex flex-wrap gap-1">
            {o.vendorOrders?.slice(0, 2).map((vo: any, i: number) => (
              <span key={i} className="vendor-pill" style={{ backgroundColor: getVendorColor(vo.vendor?.name || "Unknown") }}>
                {vo.vendor?.name || "Vendor"}
              </span>
            ))}
            {o.vendorCount > 2 && <span className="text-xs text-gray-400 font-body">+{o.vendorCount - 2}</span>}
          </div>
          <span className="text-[11px] text-gray-400 font-body">{o.vendorCount} item{o.vendorCount !== 1 ? "s" : ""}</span>
        </div>
      ),
    },
    {
      key: "amount",
      label: "Total",
      sortable: true,
      align: "right",
      render: (o) => <span className="font-semibold font-body text-sm">{formatCurrency(o.amount)}</span>,
    },
    {
      key: "paymentStatus",
      label: "Payment",
      render: (o) => <span className="status-badge status-authorized">{o.paymentStatus || "authorized"}</span>,
    },
    {
      key: "shipmentStatus",
      label: "Shipment",
      render: (o) => (
        <span className="text-sm font-body text-gray-500">
          {o.status === "SHIPPED" || o.status === "DELIVERED" || o.status === "IN_TRANSIT" ? "Shipped" : "Not Shipped"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (o) => (
        <Link href={`/orders/${o.id}`}>
          <button className="btn-view"><Eye size={12} /> View</button>
        </Link>
      ),
    },
  ];

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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>All Orders</h1>
          <p>View and manage all marketplace orders</p>
        </div>
        <ExportButton onClick={() => alert("Export feature coming soon")} label="Export CSV" />
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

      {/* Search + Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={grid.search}
          onChange={grid.setSearch}
          placeholder="Search by order #, customer name... (comma-separated for multi)"
          className="flex-1 min-w-[300px]"
        />
        <button className="px-4 py-2 text-xs font-semibold border border-gray-200 rounded-lg bg-white hover:bg-gray-50 font-body transition-colors flex items-center gap-1.5">
          <ClipboardList size={14} />
          Paste list
        </button>
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
          label="Order date"
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
        onRemoveFilter={(key) => grid.setFilter(key, key === "vendorName" ? [] : "")}
        onClearSearch={() => grid.setSearch("")}
        onClearAll={grid.clearFilters}
      />

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); grid.setSearch(""); }}
            className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={grid.selectedRows.size}
        totalCount={grid.paginated.length}
        onSelectAll={grid.toggleAllRows}
        onDeselectAll={() => grid.toggleAllRows()}
        actions={[
          { label: "Tag", icon: Tag, onClick: () => alert("Tag feature coming soon") },
          { label: "Export Selected", icon: Download, onClick: () => alert("Export feature coming soon") },
          { label: "Cancel", icon: Trash2, onClick: () => alert("Cancel feature coming soon"), variant: "danger" },
        ]}
      />

      {/* Data Grid */}
      <DataGrid
        columns={columns}
        data={grid.paginated}
        sort={grid.sort}
        onSort={grid.toggleSort}
        selectable
        selectedRows={grid.selectedRows}
        onToggleRow={grid.toggleRow}
        onToggleAll={grid.toggleAllRows}
        allSelected={grid.allSelected}
        emptyMessage="No orders found"
        emptyIcon={ShoppingCart}
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
