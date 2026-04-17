import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { CheckCircle, XCircle, Eye, Package } from "lucide-react";

export default function PendingProducts() {
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingProducts({ page: String(page), limit: "20" });
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await api.approveProduct(id);
      load();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await api.rejectProduct(id);
      load();
    } catch (err) {
      console.error(err);
    }
    setActionLoading(null);
  };

  return (
    <div>
      <TopBar title="Pending Review" subtitle={`${total} products awaiting approval`} />

      <div className="p-6 space-y-6 page-enter">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--border)] p-16 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">Queue Clear</h3>
            <p className="text-sm text-slate-500 mt-1">No products pending review right now.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {products.map((p: any) => (
              <div key={p.id} className="bg-white rounded-xl border border-[var(--border)] p-4 flex items-center gap-4">
                {/* Product image */}
                <div className="w-16 h-16 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                  {p.images?.[0]?.url ? (
                    <img src={p.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package size={24} className="text-slate-300" />
                    </div>
                  )}
                </div>

                {/* Product info */}
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold truncate">{p.title}</h4>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px] text-slate-500">{p.vendor?.name}</span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] text-slate-500">{p.category}</span>
                    <span className="text-[11px] text-slate-400">•</span>
                    <span className="text-[11px] font-medium">{formatCurrency(p.retailPrice || 0)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[10px] text-slate-400">Enrichment:</span>
                    <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
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

                {/* Submitted time */}
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] text-slate-400">Submitted</p>
                  <p className="text-xs text-slate-600">{timeAgo(p.createdAt)}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleApprove(p.id)}
                    disabled={actionLoading === p.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                  >
                    <CheckCircle size={12} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(p.id)}
                    disabled={actionLoading === p.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[11px] font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    <XCircle size={12} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
