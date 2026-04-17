import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";

export default function PendingOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingAcceptance({ page: String(page), limit: "20" });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [page]);

  const handleAccept = async (vendorOrderId: string) => {
    setActionLoading(vendorOrderId);
    try {
      await api.acceptOrder(vendorOrderId);
      load();
    } catch (err) {
      console.error("Accept failed:", err);
    }
    setActionLoading(null);
  };

  const handleReject = async (vendorOrderId: string) => {
    setActionLoading(vendorOrderId);
    try {
      await api.rejectOrder(vendorOrderId);
      load();
    } catch (err) {
      console.error("Reject failed:", err);
    }
    setActionLoading(null);
  };

  return (
    <div>
      <TopBar
        title="Pending Acceptance"
        subtitle={`${total} orders awaiting vendor confirmation`}
      />

      <div className="p-6 space-y-6 page-enter">
        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 text-center">
            <Clock size={24} className="mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{total}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting Response</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 text-center">
            <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">
              {orders.filter((o) => {
                const hours = (Date.now() - new Date(o.createdAt).getTime()) / 3600000;
                return hours > 24;
              }).length}
            </p>
            <p className="text-xs text-slate-500 mt-1">Overdue (&gt;24h)</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 text-center">
            <p className="text-2xl font-bold">
              {formatCurrency(orders.reduce((sum, o) => sum + (o.vendorTotal || 0), 0))}
            </p>
            <p className="text-xs text-slate-500 mt-1">Total Value at Risk</p>
          </div>
        </div>

        {/* Orders table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl border border-[var(--border)] p-16 text-center">
            <CheckCircle size={48} className="mx-auto text-emerald-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700">All Clear</h3>
            <p className="text-sm text-slate-500 mt-1">No orders pending vendor acceptance right now.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Order #</th>
                  <th>Vendor</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Waiting Since</th>
                  <th>SLA</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o: any) => {
                  const hours = (Date.now() - new Date(o.createdAt).getTime()) / 3600000;
                  const overdue = hours > 24;
                  return (
                    <tr key={o.id} className={cn(overdue && "bg-red-50/50")}>
                      <td className="font-medium text-[#c8a45c] text-xs">
                        {o.order?.orderNumber || "—"}
                      </td>
                      <td className="text-xs">{o.vendor?.name || "—"}</td>
                      <td className="text-xs text-center">{o.items?.length || 0}</td>
                      <td className="text-xs font-medium">{formatCurrency(o.vendorTotal || 0)}</td>
                      <td className="text-xs text-slate-500">{timeAgo(o.createdAt)}</td>
                      <td>
                        <span className={cn(
                          "text-[10px] font-medium px-2 py-0.5 rounded-full",
                          overdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                        )}>
                          {overdue ? `${Math.round(hours)}h — OVERDUE` : `${Math.round(hours)}h`}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAccept(o.id)}
                            disabled={actionLoading === o.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle size={12} />
                            Accept
                          </button>
                          <button
                            onClick={() => handleReject(o.id)}
                            disabled={actionLoading === o.id}
                            className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[11px] font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                          >
                            <XCircle size={12} />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
