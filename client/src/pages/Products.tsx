import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge, Pagination } from "@/components/ui-components";
import {
  Package, Search, Filter, Grid3X3, List, Star, Eye,
  CheckCircle, Clock, AlertCircle, BarChart3,
} from "lucide-react";

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [view, setView] = useState<"grid" | "list">("list");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const [data, s] = await Promise.all([
          api.getProducts(params),
          api.getProductStats(),
        ]);
        setProducts(data.products);
        setTotal(data.total);
        setStats(s);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [page, search, statusFilter]);

  return (
    <div>
      <TopBar title="Products / Catalog" subtitle={`${total} products in catalog`} />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Products" value={stats?.total || 0} format="number" icon={Package} iconColor="text-indigo-600" />
          <KPICard title="Pending Review" value={stats?.pending || 0} format="number" icon={Clock} iconColor="text-amber-600" />
          <KPICard title="Approved" value={stats?.approved || 0} format="number" icon={CheckCircle} iconColor="text-emerald-600" />
          <KPICard title="Pushed to Store" value={stats?.pushed || 0} format="number" icon={Eye} iconColor="text-blue-600" />
          <KPICard title="Avg Enrichment" value={Math.round(stats?.avgEnrichmentScore || 0)} format="percent" icon={BarChart3} iconColor="text-violet-600" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products, SKU, brand..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING_REVIEW">Pending Review</option>
            <option value="APPROVED">Approved</option>
            <option value="QUALIFIED">Qualified</option>
            <option value="NEEDS_REVIEW">Needs Review</option>
            <option value="PUSHED">Pushed</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setView("grid")}
              className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-slate-500")}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-slate-500")}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Products */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-xl border border-[var(--border)] overflow-hidden card-hover cursor-pointer">
                <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                  {product.images?.[0]?.url ? (
                    <img src={product.images[0].url} alt={product.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={32} className="text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <StatusBadge status={product.status} size="xs" />
                  </div>
                  {product.enrichmentScore !== null && (
                    <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                      <Star size={10} className="text-amber-500" />
                      <span className="text-[10px] font-bold">{product.enrichmentScore}</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-slate-500 mb-0.5">{product.brand}</p>
                  <p className="text-xs font-medium truncate">{product.title}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-bold">{formatCurrency(product.salesPrice, product.currency)}</p>
                    <p className="text-[10px] text-slate-500">{product.vendor?.name}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Product</th>
                  <th>Brand</th>
                  <th>Vendor</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Enrichment</th>
                  <th>Status</th>
                  <th>Variants</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="cursor-pointer">
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {product.images?.[0]?.url ? (
                            <img src={product.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={14} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate max-w-[200px]">{product.title}</p>
                          <p className="text-[10px] text-slate-500">{product.vendorSku || "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs font-medium">{product.brand || "—"}</td>
                    <td className="text-xs">{product.vendor?.name}</td>
                    <td className="text-xs">{product.category || "—"}</td>
                    <td className="text-sm font-medium">{formatCurrency(product.salesPrice, product.currency)}</td>
                    <td>
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              (product.enrichmentScore || 0) >= 70 ? "bg-emerald-500" :
                              (product.enrichmentScore || 0) >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                            style={{ width: `${product.enrichmentScore || 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-600">{product.enrichmentScore || 0}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={product.status} size="xs" /></td>
                    <td className="text-xs text-center">{product.variants?.length || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
