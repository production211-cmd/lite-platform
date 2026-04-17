import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { ShoppingCart, CheckCircle, XCircle } from "lucide-react";

export default function PortalOrders() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const data = await api.getVendorOrders(vendorId, { page: String(page), limit: "20" });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendorId, page]);

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try { await api.acceptOrder(id); load(); } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try { await api.rejectOrder(id); load(); } catch (err) { console.error(err); }
    setActionLoading(null);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-6">
        <ShoppingCart size={24} className="text-slate-600" />
        <div>
          <h1 className="text-xl font-bold text-slate-800">My Orders</h1>
          <p className="text-sm text-slate-500">{total} orders from {user?.vendorName}</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-600 rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((o: any) => (
            <div key={o.id} className="bg-white rounded-lg border border-slate-200 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{o.order?.orderNumber || "—"}</span>
                  <StatusBadge status={o.status} size="xs" />
                </div>
                <div className="flex items-center gap-4 mt-1.5 text-xs text-slate-500">
                  <span>{o.items?.length || 0} items</span>
                  <span>{formatCurrency(o.vendorTotal || 0)}</span>
                  <span>{timeAgo(o.createdAt)}</span>
                </div>
              </div>
              {o.status === "PLACED" && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAccept(o.id)}
                    disabled={actionLoading === o.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    <CheckCircle size={12} /> Accept
                  </button>
                  <button
                    onClick={() => handleReject(o.id)}
                    disabled={actionLoading === o.id}
                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <XCircle size={12} /> Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-6">
        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
