import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { CheckCircle, XCircle, Package } from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar, ActiveFilters,
  type FilterConfig,
} from "@/components/DataGrid";

const FILTER_CONFIGS: FilterConfig[] = [
  { key: "vendorName", label: "Vendor", type: "multi-select", options: [] },
  { key: "category", label: "Category", type: "multi-select", options: [] },
  {
    key: "enrichment",
    label: "Enrichment",
    type: "select",
    options: [
      { value: "high", label: "High (>70%)" },
      { value: "medium", label: "Medium (40–70%)" },
      { value: "low", label: "Low (<40%)" },
    ],
  },
];

export default function PendingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingProducts({ page: "1", limit: "500" });
      setProducts(data.products || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try { await api.approveProduct(id); load(); } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await api.rejectProduct(id); load(); } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const normalized = useMemo(() =>
    products.map((p) => ({
      ...p,
      vendorName: p.vendor?.name || p.vendor?.companyName || "Unknown",
      price: p.salesPrice || p.retailPrice || 0,
      enrichment: (p.enrichmentScore || 0) / 100, // DB stores 0-100, UI expects 0-1
      date: p.createdAt || "",
    })),
  [products]);

  const dynamicFilterConfigs = useMemo(() => {
    const vendors = [...new Set(normalized.map((p) => p.vendorName).filter(Boolean))];
    const categories = [...new Set(normalized.map((p) => p.category).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v })) };
      if (f.key === "category") return { ...f, options: categories.map((c) => ({ value: c, label: c })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: normalized,
    searchKeys: ["title", "vendorName", "category"],
    defaultSort: { key: "date", direction: "desc" },
    defaultLimit: 20,
  });

  return (
    <div>
      <TopBar title="Pending Review" subtitle={`${normalized.length} products awaiting approval`} />
      <div className="p-6 space-y-5 page-enter">
        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={grid.search} onChange={grid.setSearch} placeholder="Search by title, vendor, category..." className="flex-1 min-w-[250px]" />
          {dynamicFilterConfigs.map((fc) => (
            <FilterDropdown key={fc.key} label={fc.label} options={fc.options || []} value={grid.filters[fc.key] || (fc.type === "multi-select" ? [] : "")} onChange={(val) => grid.setFilter(fc.key, val)} multi={fc.type === "multi-select"} />
          ))}
        </div>

        <ActiveFilters filters={grid.filters} filterConfigs={dynamicFilterConfigs} search={grid.search} onRemoveFilter={(key) => grid.setFilter(key, key === "vendorName" || key === "category" ? [] : "")} onClearSearch={() => grid.setSearch("")} onClearAll={grid.clearFilters} />

        {/* Product Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : grid.paginated.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--border)] p-16 text-center shadow-soft">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Queue Clear</h3>
            <p className="text-sm text-slate-500 mt-1">No products pending review right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {grid.paginated.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-center gap-4 shadow-soft card-hover">
                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Package size={24} className="text-slate-300" /></div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-slate-500">{p.vendorName}</span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500">{p.category}</span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] font-medium">{formatCurrency(p.price)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">Enrichment:</span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", p.enrichment > 0.7 ? "bg-emerald-500" : p.enrichment > 0.4 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${p.enrichment * 100}%` }} />
                    </div>
                    <span className="text-[10px] text-slate-500">{(p.enrichment * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-slate-400">Submitted</p>
                  <p className="text-xs text-slate-600">{timeAgo(p.date)}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => handleApprove(p.id)} disabled={actionLoading === p.id} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
                    <CheckCircle size={12} /> Approve
                  </button>
                  <button onClick={() => handleReject(p.id)} disabled={actionLoading === p.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[11px] font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <PaginationBar page={grid.page} totalPages={grid.totalPages} totalItems={grid.totalFiltered} limit={grid.limit} onPageChange={grid.setPage} onLimitChange={grid.setLimit} />
      </div>
    </div>
  );
}
