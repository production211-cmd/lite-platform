import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { CheckCircle, XCircle } from "lucide-react";

export default function VendorOrders() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: "20" };
      if (statusFilter) params.status = statusFilter;
      const data = await api.getVendorOrders(vendorId, params);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendorId, page, statusFilter]);

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
    <div>
      <TopBar title="My Orders" subtitle={`${total} orders`} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Pending Acceptance</option>
            <option value="VENDOR_ACCEPT">Accepted</option>
            <option value="SHIPPED">Shipped</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => (
                  <tr key={o.id}>
                    <td className="text-xs font-medium">{o.order?.orderNumber || "—"}</td>
                    <td className="text-xs">{o.order?.customerName || "—"}</td>
                    <td className="text-xs text-center">{o.items?.length || 0}</td>
                    <td className="text-xs font-medium">{formatCurrency(o.vendorTotal || 0)}</td>
                    <td><StatusBadge status={o.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(o.createdAt)}</td>
                    <td className="text-center">
                      {o.status === "PLACED" ? (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAccept(o.id)}
                            disabled={actionLoading === o.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-600 text-white text-[10px] font-medium rounded-md hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <CheckCircle size={10} /> Accept
                          </button>
                          <button
                            onClick={() => handleReject(o.id)}
                            disabled={actionLoading === o.id}
                            className="flex items-center gap-1 px-2.5 py-1 bg-red-600 text-white text-[10px] font-medium rounded-md hover:bg-red-700 disabled:opacity-50"
                          >
                            <XCircle size={10} /> Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">—</span>
                      )}
                    </td>
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
