import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Store, Grid3X3, List, MapPin, Eye, Plus,
} from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters, ExportButton,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const TABS = [
  { key: "all", label: "All Vendors" },
  { key: "MARKETPLACE", label: "Marketplace" },
  { key: "WHOLESALE", label: "Wholesale" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "location",
    label: "Location",
    type: "select",
    options: [
      { value: "DOMESTIC_US", label: "Domestic (US)" },
      { value: "INTERNATIONAL", label: "International" },
    ],
  },
  {
    key: "integrationType",
    label: "Integration",
    type: "multi-select",
    options: [],
  },
  {
    key: "commissionRange",
    label: "Commission",
    type: "select",
    options: [
      { value: "0-10", label: "0–10%" },
      { value: "10-20", label: "10–20%" },
      { value: "20-30", label: "20–30%" },
      { value: "30+", label: "30%+" },
    ],
  },
];

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    api.getVendors().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.vendors || [];
      setVendors(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Normalize
  const normalized = useMemo(() =>
    vendors.map((v) => ({
      ...v,
      productCount: v._count?.products || 0,
      orderCount: v._count?.vendorOrders || 0,
      commission: v.commissionRate || 0,
    })),
  [vendors]);

  // Tab filter
  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return normalized;
    if (activeTab === "MARKETPLACE" || activeTab === "WHOLESALE") return normalized.filter((v) => v.economicModel === activeTab);
    if (activeTab === "active") return normalized.filter((v) => v.isActive);
    if (activeTab === "inactive") return normalized.filter((v) => !v.isActive);
    return normalized;
  }, [normalized, activeTab]);

  // Dynamic filter options
  const dynamicFilterConfigs = useMemo(() => {
    const integrations = [...new Set(normalized.map((v) => v.integrationType).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "integrationType") return { ...f, options: integrations.map((i) => ({ value: i, label: i, count: normalized.filter((v) => v.integrationType === i).length })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: tabFiltered,
    searchKeys: ["name", "slug", "city", "country"],
    defaultSort: { key: "name", direction: "asc" },
    defaultLimit: 20,
  });

  const tabCounts = useMemo(() => ({
    all: normalized.length,
    MARKETPLACE: normalized.filter((v) => v.economicModel === "MARKETPLACE").length,
    WHOLESALE: normalized.filter((v) => v.economicModel === "WHOLESALE").length,
    active: normalized.filter((v) => v.isActive).length,
    inactive: normalized.filter((v) => !v.isActive).length,
  }), [normalized]);

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      label: "Vendor",
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {v.logoUrl ? (
              <img src={v.logoUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-400">{v.name?.[0]}</span>
            )}
          </div>
          <div>
            <p className="font-semibold text-sm font-body">{v.name}</p>
            <p className="text-[10px] text-gray-500 font-body">{v.slug}</p>
          </div>
        </div>
      ),
    },
    {
      key: "city",
      label: "Location",
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-1">
          <MapPin size={12} className="text-gray-400" />
          <span className="text-xs font-body">{v.city || v.country || "—"}</span>
        </div>
      ),
    },
    {
      key: "economicModel",
      label: "Model",
      sortable: true,
      render: (v) => (
        <span className={cn(
          "text-[10px] px-2 py-0.5 rounded-full font-semibold font-body",
          v.economicModel === "MARKETPLACE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
        )}>
          {v.economicModel}
        </span>
      ),
    },
    {
      key: "integrationType",
      label: "Integration",
      sortable: true,
      render: (v) => <span className="text-xs font-body">{v.integrationType || "—"}</span>,
    },
    {
      key: "commission",
      label: "Commission",
      sortable: true,
      align: "right",
      render: (v) => <span className="text-xs font-body">{v.commission ? `${v.commission}%` : "—"}</span>,
    },
    {
      key: "productCount",
      label: "Products",
      sortable: true,
      align: "right",
      render: (v) => <span className="text-xs font-semibold font-body">{v.productCount}</span>,
    },
    {
      key: "orderCount",
      label: "Orders",
      sortable: true,
      align: "right",
      render: (v) => <span className="text-xs font-semibold font-body">{v.orderCount}</span>,
    },
    {
      key: "isActive",
      label: "Status",
      sortable: true,
      render: (v) => (
        <span className={cn(
          "text-[10px] font-semibold px-2 py-0.5 rounded-full font-body",
          v.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
        )}>
          {v.isActive ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (v) => (
        <Link href={`/vendors/${v.id}`}>
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
          <p className="text-sm text-gray-500 mt-4 font-body">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Vendors</h1>
          <p>Manage marketplace vendor partnerships</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={() => alert("Export feature coming soon")} label="Export" />
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors font-body">
            <Plus size={16} />
            Add Vendor
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="quick-stat card-hover">
          <p className="stat-number">{normalized.length}</p>
          <p className="stat-label">Total Vendors</p>
        </div>
        <div className="quick-stat card-hover">
          <p className="stat-number">{normalized.filter((v) => v.location === "DOMESTIC_US").length}</p>
          <p className="stat-label">Domestic (US)</p>
        </div>
        <div className="quick-stat card-hover">
          <p className="stat-number">{normalized.filter((v) => v.location === "INTERNATIONAL").length}</p>
          <p className="stat-label">International</p>
        </div>
        <div className="quick-stat card-hover">
          <p className="stat-number">{tabCounts.MARKETPLACE} / {tabCounts.WHOLESALE}</p>
          <p className="stat-label">Marketplace / Wholesale</p>
        </div>
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={grid.search}
          onChange={grid.setSearch}
          placeholder="Search vendors by name, city, country..."
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
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 ml-auto">
          <button onClick={() => setView("grid")} aria-label="Grid view" aria-pressed={view === "grid"} className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-gray-500")}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView("list")} aria-label="List view" aria-pressed={view === "list"} className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-gray-500")}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Active Filters */}
      <ActiveFilters
        filters={grid.filters}
        filterConfigs={dynamicFilterConfigs}
        search={grid.search}
        onRemoveFilter={(key) => grid.setFilter(key, key === "integrationType" ? [] : "")}
        onClearSearch={() => grid.setSearch("")}
        onClearAll={() => { grid.clearFilters(); setActiveTab("all"); }}
      />

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); grid.setSearch(""); }}
            className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.label} ({tabCounts[tab.key as keyof typeof tabCounts] || 0})
          </button>
        ))}
      </div>

      {/* Grid or Table */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {grid.paginated.map((vendor) => (
            <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 p-5 card-hover cursor-pointer shadow-soft">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {vendor.logoUrl ? (
                      <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{vendor.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm font-body truncate">{vendor.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-gray-400" />
                      <span className="text-[11px] text-gray-500 font-body">
                        {vendor.city ? `${vendor.city}, ` : ""}{vendor.country || "—"}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full font-body",
                    vendor.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold font-body">{vendor.productCount}</p>
                    <p className="text-[10px] text-gray-500 font-body">Products</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold font-body">{vendor.orderCount}</p>
                    <p className="text-[10px] text-gray-500 font-body">Orders</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-semibold font-body",
                    vendor.economicModel === "MARKETPLACE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                  )}>
                    {vendor.economicModel}
                  </span>
                  <span className="text-gray-500 font-body">
                    {vendor.commission ? `${vendor.commission}% comm.` : "Wholesale"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          {grid.paginated.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 font-body">
              <Store size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No vendors found</p>
              <p className="text-xs text-slate-400 mt-1">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      ) : (
        <DataGrid
          columns={columns}
          data={grid.paginated}
          sort={grid.sort}
          onSort={grid.toggleSort}
          emptyMessage="No vendors found"
          emptyIcon={Store}
        />
      )}

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
