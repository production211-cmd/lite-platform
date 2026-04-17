import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge, Pagination } from "@/components/ui-components";
import { RotateCcw, Clock, CheckCircle, DollarSign, Package, Search } from "lucide-react";

export default function Returns() {
  const [returns, setReturns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (statusFilter) params.status = statusFilter;
        const [data, s] = await Promise.all([
          api.getReturns(params),
          api.getReturnStats(),
        ]);
        setReturns(data.returns);
        setTotal(data.total);
        setStats(s);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [page, statusFilter]);

  return (
    <div>
      <TopBar title="Returns" subtitle={`${total} returns`} />
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Returns" value={stats?.total || 0} format="number" icon={RotateCcw} iconColor="text-rose-600" />
          <KPICard title="Initiated" value={stats?.initiated || 0} format="number" icon={Clock} iconColor="text-amber-600" />
          <KPICard title="In Transit" value={stats?.inTransit || 0} format="number" icon={Package} iconColor="text-blue-600" />
          <KPICard title="Inspecting" value={stats?.inspecting || 0} format="number" icon={Search} iconColor="text-violet-600" />
          <KPICard title="Total Refunds" value={stats?.totalRefunds || 0} format="currency" icon={DollarSign} iconColor="text-emerald-600" />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="INITIATED">Initiated</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="RECEIVED_WAREHOUSE">Received</option>
            <option value="INSPECTING">Inspecting</option>
            <option value="APPROVED">Approved</option>
            <option value="REFUNDED">Refunded</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Order</th>
                  <th>Vendor</th>
                  <th>Reason</th>
                  <th>Refund Amount</th>
                  <th>Status</th>
                  <th>Initiated</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((r: any) => (
                  <tr key={r.id}>
                    <td className="text-xs font-medium text-[#c8a45c]">{r.vendorOrder?.order?.orderNumber || "—"}</td>
                    <td className="text-xs">{r.vendor?.name}</td>
                    <td className="text-xs">{r.reason || "—"}</td>
                    <td className="text-xs font-medium">{r.refundAmount ? formatCurrency(r.refundAmount) : "—"}</td>
                    <td><StatusBadge status={r.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(r.initiatedAt || r.createdAt)}</td>
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
