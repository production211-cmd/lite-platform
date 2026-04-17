import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { DollarSign, Clock, CheckCircle, ArrowUpRight } from "lucide-react";

export default function VendorFinance() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const [payouts, setPayouts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"payouts" | "settlements">("payouts");

  useEffect(() => {
    if (!vendorId) return;
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20", vendorId: vendorId! };
        if (tab === "payouts") {
          const data = await api.getPayouts(params);
          setPayouts(data.payouts || []);
          setTotal(data.total || 0);
        } else {
          const data = await api.getSettlements(params);
          setPayouts(data.settlements || []);
          setTotal(data.total || 0);
        }
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [vendorId, page, tab]);

  return (
    <div>
      <TopBar title="Finance" subtitle="Payouts and settlements" />
      <div className="p-6 space-y-6 animate-fade-in">
        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => { setTab("payouts"); setPage(1); }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              tab === "payouts" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Payouts
          </button>
          <button
            onClick={() => { setTab("settlements"); setPage(1); }}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-colors",
              tab === "settlements" ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Settlements
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
          </div>
        ) : tab === "payouts" ? (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Period</th>
                  <th>Gross</th>
                  <th>Commission</th>
                  <th>Deductions</th>
                  <th>Net Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((p: any) => (
                  <tr key={p.id}>
                    <td className="text-xs">
                      {p.periodStart ? `${formatDate(p.periodStart)} – ${formatDate(p.periodEnd)}` : "—"}
                    </td>
                    <td className="text-xs">{formatCurrency(p.grossAmount || 0, p.currency)}</td>
                    <td className="text-xs text-red-600">-{formatCurrency(p.commissionAmount || 0, p.currency)}</td>
                    <td className="text-xs text-red-600">-{formatCurrency(p.deductionAmount || 0, p.currency)}</td>
                    <td className="text-xs font-bold">{formatCurrency(p.netAmount || 0, p.currency)}</td>
                    <td><StatusBadge status={p.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Settlement ID</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map((s: any) => (
                  <tr key={s.id}>
                    <td className="text-xs font-mono">{s.id?.slice(0, 8)}...</td>
                    <td className="text-xs font-bold">{formatCurrency(s.amount || 0, s.currency)}</td>
                    <td className="text-xs">{s.currency}</td>
                    <td className="text-xs">{s.method || "REVOLUT"}</td>
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
