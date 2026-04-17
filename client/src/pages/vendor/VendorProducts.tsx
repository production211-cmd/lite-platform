import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { Package, Search, Grid3X3, List } from "lucide-react";

export default function VendorProducts() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    if (!vendorId) return;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (search) params.search = search;
        const data = await api.getVendorProducts(vendorId!, params);
        setProducts(data.products || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [vendorId, page, search]);

  return (
    <div>
      <TopBar title="My Products" subtitle={`${total} products`} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-auto">
            <button onClick={() => setView("grid")} className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-slate-500")}>
              <Grid3X3 size={16} />
            </button>
            <button onClick={() => setView("list")} className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-slate-500")}>
              <List size={16} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="aspect-square bg-slate-100 relative">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={40} className="text-slate-300" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <StatusBadge status={p.status} size="xs" />
                  </div>
                </div>
                <div className="p-4">
                  <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                  <p className="text-[11px] text-slate-500 mt-1">{p.category} • {p.brand}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-bold">{formatCurrency(p.retailPrice || 0)}</span>
                    <span className="text-[10px] text-slate-400">{p.variants?.length || 0} variants</span>
                  </div>
                  {/* Enrichment bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          (p.enrichmentScore || 0) > 0.7 ? "bg-emerald-500" :
                          (p.enrichmentScore || 0) > 0.4 ? "bg-amber-500" : "bg-red-500"
                        )}
                        style={{ width: `${(p.enrichmentScore || 0) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500">{((p.enrichmentScore || 0) * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Variants</th>
                  <th>Enrichment</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {p.images?.[0]?.url ? (
                            <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package size={16} className="text-slate-300" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium truncate max-w-[200px]">{p.title}</p>
                          <p className="text-[10px] text-slate-500">{p.brand}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs">{p.category}</td>
                    <td className="text-xs font-medium">{formatCurrency(p.retailPrice || 0)}</td>
                    <td className="text-xs text-center">{p.variants?.length || 0}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full",
                              (p.enrichmentScore || 0) > 0.7 ? "bg-emerald-500" : "bg-amber-500"
                            )}
                            style={{ width: `${(p.enrichmentScore || 0) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px]">{((p.enrichmentScore || 0) * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td><StatusBadge status={p.status} size="xs" /></td>
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
