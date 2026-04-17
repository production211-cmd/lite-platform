import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge, Pagination } from "@/components/ui-components";
import { Wallet, Clock, CheckCircle, ArrowUpRight, DollarSign, Search } from "lucide-react";

export default function Payouts() {
  const [payouts, setPayouts] = useState<any[]>([]);
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
          api.getPayouts(params),
          api.getPayoutStats(),
        ]);
        setPayouts(data.payouts || []);
        setTotal(data.total || 0);
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
      <TopBar title="Payouts" subtitle={`${total} payout records`} />

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Disbursed" value={stats?.totalDisbursed || 0} format="currency" icon={DollarSign} iconColor="text-emerald-600" />
          <KPICard title="Pending" value={stats?.pending || 0} format="number" icon={Clock} iconColor="text-amber-600" />
          <KPICard title="Processing" value={stats?.processing || 0} format="number" icon={ArrowUpRight} iconColor="text-blue-600" />
          <KPICard title="Completed" value={stats?.completed || 0} format="number" icon={CheckCircle} iconColor="text-emerald-600" />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="PROCESSING">Processing</option>
            <option value="COMPLETED">Completed</option>
            <option value="FAILED">Failed</option>
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
                  <th>Vendor</th>
                  <th>Period</th>
                  <th>Gross</th>
                  <th>Commission</th>
                  <th>Deductions</th>
                  <th>Net Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-xs font-medium">{p.vendor?.name || "—"}</td>
                    <td className="text-xs text-slate-500">
                      {p.periodStart ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : "—"}
                    </td>
                    <td className="text-xs">{formatCurrency(p.grossAmount || 0, p.currency)}</td>
                    <td className="text-xs text-red-600">-{formatCurrency(p.commissionAmount || 0, p.currency)}</td>
                    <td className="text-xs text-red-600">-{formatCurrency(p.deductionAmount || 0, p.currency)}</td>
                    <td className="text-xs font-bold">{formatCurrency(p.netAmount || 0, p.currency)}</td>
                    <td className="text-xs">{p.currency}</td>
                    <td><StatusBadge status={p.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(p.createdAt)}</td>
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
