import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  Eye, Grid3X3, List, Plus, Package, Image as ImageIcon, Star,
  Download, Trash2, CheckCircle, Archive,
} from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, BulkActionsBar, ActiveFilters, ExportButton,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const STATUS_TABS = [
  { key: "all", label: "All Products" },
  { key: "ACTIVE", label: "Active" },
  { key: "PENDING_REVIEW", label: "Pending Review" },
  { key: "DRAFT", label: "Draft" },
  { key: "ARCHIVED", label: "Archived" },
];

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "category",
    label: "Category",
    type: "multi-select",
    options: [],
  },
  {
    key: "vendorName",
    label: "Vendor",
    type: "multi-select",
    options: [],
  },
  {
    key: "priceRange",
    label: "Price Range",
    type: "select",
    options: [
      { value: "0-50", label: "Under $50" },
      { value: "50-100", label: "$50 – $100" },
      { value: "100-250", label: "$100 – $250" },
      { value: "250-500", label: "$250 – $500" },
      { value: "500+", label: "$500+" },
    ],
  },
  {
    key: "enrichmentRange",
    label: "Enrichment",
    type: "select",
    options: [
      { value: "high", label: "High (70%+)" },
      { value: "medium", label: "Medium (40–69%)" },
      { value: "low", label: "Low (<40%)" },
    ],
  },
];

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    api.getProducts().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.products || [];
      setProducts(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  // Normalize products with flattened fields for filtering/sorting
  const normalized = useMemo(() =>
    products.map((p) => ({
      ...p,
      vendorName: p.vendor?.name || "Unknown",
      price: p.retailPrice || p.salesPrice || 0,
      enrichment: p.enrichmentScore || 0,
    })),
  [products]);

  // Tab-filtered base
  const tabFiltered = useMemo(() => {
    if (activeTab === "all") return normalized;
    return normalized.filter((p) => p.status === activeTab);
  }, [normalized, activeTab]);

  // Dynamic filter options from data
  const dynamicFilterConfigs = useMemo(() => {
    const categories = [...new Set(normalized.map((p) => p.category).filter(Boolean))];
    const vendors = [...new Set(normalized.map((p) => p.vendorName).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "category") return { ...f, options: categories.map((c) => ({ value: c, label: c, count: normalized.filter((p) => p.category === c).length })) };
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v, count: normalized.filter((p) => p.vendorName === v).length })) };
      return f;
    });
  }, [normalized]);

  // Custom filter logic for price range and enrichment
  const applyCustomFilters = (data: any[], filters: Record<string, string | string[]>) => {
    let result = data;
    const priceRange = filters.priceRange;
    if (priceRange && typeof priceRange === "string") {
      if (priceRange === "500+") result = result.filter((p) => p.price >= 500);
      else {
        const [min, max] = priceRange.split("-").map(Number);
        result = result.filter((p) => p.price >= min && p.price < max);
      }
    }
    const enrichmentRange = filters.enrichmentRange;
    if (enrichmentRange && typeof enrichmentRange === "string") {
      if (enrichmentRange === "high") result = result.filter((p) => p.enrichment >= 70);
      else if (enrichmentRange === "medium") result = result.filter((p) => p.enrichment >= 40 && p.enrichment < 70);
      else if (enrichmentRange === "low") result = result.filter((p) => p.enrichment < 40);
    }
    return result;
  };

  const grid = useDataGrid({
    data: tabFiltered,
    searchKeys: ["title", "sku", "vendorSku", "vendorName", "brand"],
    defaultSort: { key: "title", direction: "asc" },
    defaultLimit: 25,
  });

  // Apply custom filters on top of DataGrid's standard filters
  const customFiltered = useMemo(() =>
    applyCustomFilters(grid.paginated, grid.filters),
  [grid.paginated, grid.filters]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: normalized.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = normalized.filter((p) => p.status === t.key).length;
    });
    return counts;
  }, [normalized]);

  const stats = useMemo(() => ({
    total: normalized.length,
    active: normalized.filter((p) => p.status === "ACTIVE").length,
    pending: normalized.filter((p) => p.status === "PENDING_REVIEW").length,
    avgPrice: normalized.length > 0 ? normalized.reduce((s, p) => s + p.price, 0) / normalized.length : 0,
  }), [normalized]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED" || s === "PUSHED") return "status-delivered";
    if (s === "PENDING_REVIEW" || s === "NEEDS_REVIEW") return "status-pending";
    if (s === "DRAFT" || s === "QUALIFIED") return "status-neutral";
    if (s === "ARCHIVED" || s === "REJECTED") return "status-danger";
    return "status-neutral";
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "title",
      label: "Product",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
            {p.images?.[0]?.url || p.imageUrl ? (
              <img src={p.images?.[0]?.url || p.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon size={16} className="text-gray-300" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold font-body truncate max-w-[200px]">{p.title}</p>
            <p className="text-[10px] text-gray-400 font-body">{p.brand || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "sku",
      label: "SKU",
      sortable: true,
      render: (p) => <span className="font-mono text-xs">{p.sku || p.vendorSku || "—"}</span>,
    },
    {
      key: "vendorName",
      label: "Vendor",
      sortable: true,
      render: (p) => <span className="text-sm font-body">{p.vendorName}</span>,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (p) => (
        <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs text-gray-600">{p.category || "—"}</span>
      ),
    },
    {
      key: "price",
      label: "Price",
      sortable: true,
      align: "right",
      render: (p) => <span className="text-sm font-semibold font-body">{formatCurrency(p.price)}</span>,
    },
    {
      key: "enrichment",
      label: "Enrichment",
      sortable: true,
      render: (p) => (
        <div className="flex items-center gap-1.5">
          <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full", p.enrichment >= 70 ? "bg-green-500" : p.enrichment >= 40 ? "bg-amber-500" : "bg-red-500")}
              style={{ width: `${p.enrichment}%` }}
            />
          </div>
          <span className="text-[10px] font-semibold text-gray-600">{p.enrichment}%</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (p) => <span className={`status-badge ${statusColor(p.status)}`}>{p.status?.replace(/_/g, " ")}</span>,
    },
    {
      key: "actions",
      label: "",
      width: "80px",
      render: (p) => (
        <Link href={`/products/${p.id}`} className="btn-view">
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
          <p className="text-sm text-gray-500 mt-4 font-body">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Products</h1>
          <p>Manage marketplace product catalog</p>
        </div>
        <div className="flex items-center gap-2">
          <ExportButton onClick={() => alert("Export feature coming soon")} label="Export CSV" />
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors font-body">
            <Plus size={16} />
            Add Product
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="quick-stat card-hover animate-fade-in stagger-1">
          <p className="stat-number">{stats.total}</p>
          <p className="stat-label">Total Products</p>
        </div>
        <div className="quick-stat card-hover animate-fade-in stagger-2">
          <p className="stat-number">{stats.active}</p>
          <p className="stat-label">Active</p>
        </div>
        <div className="quick-stat card-hover animate-fade-in stagger-3">
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">Pending Review</p>
        </div>
        <div className="quick-stat card-hover animate-fade-in stagger-4">
          <p className="stat-number">{formatCurrency(stats.avgPrice)}</p>
          <p className="stat-label">Avg. Price</p>
        </div>
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchBar
          value={grid.search}
          onChange={grid.setSearch}
          placeholder="Search by title, SKU, vendor, brand..."
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
          <button onClick={() => setView("grid")} className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-gray-500")}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-gray-500")}>
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Active Filters Chips */}
      <ActiveFilters
        filters={grid.filters}
        filterConfigs={dynamicFilterConfigs}
        search={grid.search}
        onRemoveFilter={(key) => grid.setFilter(key, key === "category" || key === "vendorName" ? [] : "")}
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

      {/* Bulk Actions */}
      <BulkActionsBar
        selectedCount={grid.selectedRows.size}
        totalCount={grid.paginated.length}
        onSelectAll={grid.toggleAllRows}
        onDeselectAll={() => grid.toggleAllRows()}
        actions={[
          { label: "Approve", icon: CheckCircle, onClick: () => alert("Approve feature coming soon") },
          { label: "Archive", icon: Archive, onClick: () => alert("Archive feature coming soon") },
          { label: "Delete", icon: Trash2, onClick: () => alert("Delete feature coming soon"), variant: "danger" },
        ]}
      />

      {/* Data Grid or Card Grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {grid.paginated.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden card-hover cursor-pointer">
                <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center">
                  {product.images?.[0]?.url || product.imageUrl ? (
                    <img src={product.images?.[0]?.url || product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <ImageIcon size={32} className="text-gray-300" />
                  )}
                  {product.enrichment != null && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Star size={10} className="text-amber-500" />
                      <span className="text-[10px] font-bold">{product.enrichment}%</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-gray-500 font-body mb-0.5">{product.vendorName}</p>
                  <h3 className="text-sm font-semibold font-body truncate">{product.title}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold font-body">{formatCurrency(product.price)}</p>
                    <span className={`status-badge ${statusColor(product.status)}`}>{product.status?.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 font-mono mt-1">SKU: {product.sku || product.vendorSku || "—"}</p>
                </div>
              </div>
            </Link>
          ))}
          {grid.paginated.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400 font-body">
              <Package size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-sm font-medium text-slate-600">No products found</p>
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
          selectable
          selectedRows={grid.selectedRows}
          onToggleRow={grid.toggleRow}
          onToggleAll={grid.toggleAllRows}
          allSelected={grid.allSelected}
          emptyMessage="No products found"
          emptyIcon={Package}
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
