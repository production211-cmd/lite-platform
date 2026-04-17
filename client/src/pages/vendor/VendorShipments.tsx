import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";

export default function VendorShipments() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const [shipments, setShipments] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    if (!vendorId) return;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20", vendorId: vendorId! };
        if (statusFilter) params.status = statusFilter;
        const data = await api.getShipments(params);
        setShipments(data.shipments || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [vendorId, page, statusFilter]);

  return (
    <div>
      <TopBar title="My Shipments" subtitle={`${total} shipments`} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="LABEL_CREATED">Label Created</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXCEPTION">Exception</option>
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
                  <th>Tracking #</th>
                  <th>Order</th>
                  <th>Carrier</th>
                  <th>Leg</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s: any) => (
                  <tr key={s.id}>
                    <td className="font-mono text-xs font-medium">{s.trackingNumber}</td>
                    <td className="text-xs">{s.vendorOrder?.order?.orderNumber || "—"}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        s.carrier === "FEDEX" ? "bg-purple-50 text-purple-700" :
                        s.carrier === "DHL" ? "bg-yellow-50 text-yellow-700" :
                        "bg-amber-50 text-amber-700"
                      )}>
                        {s.carrier}
                      </span>
                    </td>
                    <td className="text-xs">{s.leg}</td>
                    <td className="text-xs font-medium">{formatCurrency(s.shippingCost || 0, s.costCurrency)}</td>
                    <td><StatusBadge status={s.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(s.createdAt)}</td>
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
