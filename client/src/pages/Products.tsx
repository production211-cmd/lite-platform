import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { Link } from "wouter";
import {
  Search, Eye, Grid3X3, List, Plus, Package,
  ChevronLeft, ChevronRight, Image as ImageIcon, Star,
} from "lucide-react";

const STATUS_TABS = [
  { key: "all", label: "All Products" },
  { key: "ACTIVE", label: "Active" },
  { key: "PENDING_REVIEW", label: "Pending Review" },
  { key: "DRAFT", label: "Draft" },
  { key: "ARCHIVED", label: "Archived" },
];

export default function Products() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"grid" | "list">("list");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    api.getProducts().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.products || [];
      setProducts(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = products;
    if (activeTab !== "all") result = result.filter((p) => p.status === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.title?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.vendor?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [products, activeTab, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: products.length };
    STATUS_TABS.forEach((t) => {
      if (t.key !== "all") counts[t.key] = products.filter((p) => p.status === t.key).length;
    });
    return counts;
  }, [products]);

  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter((p) => p.status === "ACTIVE").length,
    pending: products.filter((p) => p.status === "PENDING_REVIEW").length,
    avgPrice: products.length > 0 ? products.reduce((s, p) => s + (p.retailPrice || p.salesPrice || 0), 0) / products.length : 0,
  }), [products]);

  const statusColor = (status: string) => {
    const s = status?.toUpperCase();
    if (s === "ACTIVE" || s === "APPROVED" || s === "PUSHED") return "status-delivered";
    if (s === "PENDING_REVIEW" || s === "NEEDS_REVIEW") return "status-pending";
    if (s === "DRAFT" || s === "QUALIFIED") return "status-neutral";
    if (s === "ARCHIVED" || s === "REJECTED") return "status-danger";
    return "status-neutral";
  };

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
    <div className="p-6 space-y-5 animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Products</h1>
          <p>Manage marketplace product catalog</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors font-body">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      <div className="grid grid-cols-4 gap-3">
        <div className="quick-stat">
          <p className="stat-number">{stats.total}</p>
          <p className="stat-label">Total Products</p>
        </div>
        <div className="quick-stat">
          <p className="stat-number">{stats.active}</p>
          <p className="stat-label">Active</p>
        </div>
        <div className="quick-stat">
          <p className="stat-number">{stats.pending}</p>
          <p className="stat-label">Pending Review</p>
        </div>
        <div className="quick-stat">
          <p className="stat-number">{formatCurrency(stats.avgPrice)}</p>
          <p className="stat-label">Avg. Price</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="search-bar flex-1">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input type="text" placeholder="Search by title, SKU, vendor..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button onClick={() => setView("grid")} className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-gray-500")}>
            <Grid3X3 size={16} />
          </button>
          <button onClick={() => setView("list")} className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-gray-500")}>
            <List size={16} />
          </button>
        </div>
      </div>

      <div className="tab-bar">
        {STATUS_TABS.map((tab) => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setPage(1); }} className={`tab-item ${activeTab === tab.key ? "active" : ""}`}>
            {tab.label} ({tabCounts[tab.key] || 0})
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 font-body">
        Showing {Math.min(((page - 1) * perPage) + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length} products
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {paginated.map((product) => (
            <div key={product.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden card-hover cursor-pointer">
              <div className="aspect-square bg-gray-50 relative overflow-hidden flex items-center justify-center">
                {product.images?.[0]?.url || product.imageUrl ? (
                  <img src={product.images?.[0]?.url || product.imageUrl} alt={product.title} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon size={32} className="text-gray-300" />
                )}
                {product.enrichmentScore != null && (
                  <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm rounded-full px-2 py-0.5 flex items-center gap-1">
                    <Star size={10} className="text-amber-500" />
                    <span className="text-[10px] font-bold">{product.enrichmentScore}</span>
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="text-[10px] text-gray-500 font-body mb-0.5">{product.vendor?.name}</p>
                <h3 className="text-sm font-semibold font-body truncate">{product.title}</h3>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-bold font-body">{formatCurrency(product.retailPrice || product.salesPrice || 0)}</p>
                  <span className={`status-badge ${statusColor(product.status)}`}>{product.status?.replace(/_/g, " ")}</span>
                </div>
                <p className="text-[10px] text-gray-400 font-mono mt-1">SKU: {product.sku || product.vendorSku || "—"}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Price</th>
                <th>Enrichment</th>
                <th>Status</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((product) => (
                <tr key={product.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gray-50 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {product.images?.[0]?.url || product.imageUrl ? (
                          <img src={product.images?.[0]?.url || product.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon size={16} className="text-gray-300" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold font-body truncate max-w-[200px]">{product.title}</p>
                        <p className="text-[10px] text-gray-400 font-body">{product.brand || "—"}</p>
                      </div>
                    </div>
                  </td>
                  <td className="font-mono text-xs font-body">{product.sku || product.vendorSku || "—"}</td>
                  <td className="text-sm font-body">{product.vendor?.name || "—"}</td>
                  <td className="text-xs font-body"><span className="px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{product.category || "—"}</span></td>
                  <td className="text-sm font-semibold font-body">{formatCurrency(product.retailPrice || product.salesPrice || 0)}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", (product.enrichmentScore || 0) >= 70 ? "bg-green-500" : (product.enrichmentScore || 0) >= 40 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${product.enrichmentScore || 0}%` }} />
                      </div>
                      <span className="text-[10px] font-semibold text-gray-600">{product.enrichmentScore || 0}%</span>
                    </div>
                  </td>
                  <td><span className={`status-badge ${statusColor(product.status)}`}>{product.status?.replace(/_/g, " ")}</span></td>
                  <td><Link href={`/products/${product.id}`} className="btn-view"><Eye size={12} /> View</Link></td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400 font-body">No products found</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p > totalPages || p < 1) return null;
            return (
              <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-lg text-xs font-semibold font-body transition-colors ${p === page ? "bg-gray-900 text-white" : "border border-gray-200 hover:bg-gray-50"}`}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
