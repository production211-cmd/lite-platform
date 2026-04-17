import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge, Pagination } from "@/components/ui-components";
import { MinusCircle, RotateCcw, AlertTriangle, DollarSign } from "lucide-react";

export default function Deductions() {
  const [deductions, setDeductions] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (typeFilter) params.type = typeFilter;
        const data = await api.getDeductions(params);
        setDeductions(data.deductions || []);
        setTotal(data.total || 0);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [page, typeFilter]);

  const typeIcon = (type: string) => {
    switch (type) {
      case "RETURN": return <RotateCcw size={14} className="text-amber-600" />;
      case "CHARGEBACK": return <AlertTriangle size={14} className="text-red-600" />;
      case "PENALTY": return <MinusCircle size={14} className="text-rose-600" />;
      default: return <DollarSign size={14} className="text-slate-400" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "RETURN": return "bg-amber-50 text-amber-700";
      case "CHARGEBACK": return "bg-red-50 text-red-700";
      case "PENALTY": return "bg-rose-50 text-rose-700";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  return (
    <div>
      <TopBar title="Deductions" subtitle={`${total} deduction records`} />

      <div className="p-6 space-y-6 page-enter">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <RotateCcw size={20} className="text-amber-600" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(deductions.filter(d => d.type === "RETURN").reduce((s, d) => s + (d.amount || 0), 0))}
                </p>
                <p className="text-xs text-slate-500">Return Deductions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(deductions.filter(d => d.type === "CHARGEBACK").reduce((s, d) => s + (d.amount || 0), 0))}
                </p>
                <p className="text-xs text-slate-500">Chargebacks</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                <MinusCircle size={20} className="text-rose-600" />
              </div>
              <div>
                <p className="text-lg font-bold">
                  {formatCurrency(deductions.filter(d => d.type === "PENALTY").reduce((s, d) => s + (d.amount || 0), 0))}
                </p>
                <p className="text-xs text-slate-500">Penalties</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Types</option>
            <option value="RETURN">Returns</option>
            <option value="CHARGEBACK">Chargebacks</option>
            <option value="PENALTY">Penalties</option>
            <option value="ADJUSTMENT">Adjustments</option>
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
                  <th>Type</th>
                  <th>Vendor</th>
                  <th>Reason</th>
                  <th>Amount</th>
                  <th>Currency</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {deductions.map((d: any) => (
                  <tr key={d.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {typeIcon(d.type)}
                        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", typeColor(d.type))}>
                          {d.type}
                        </span>
                      </div>
                    </td>
                    <td className="text-xs">{d.vendor?.name || "—"}</td>
                    <td className="text-xs max-w-[200px] truncate">{d.reason || "—"}</td>
                    <td className="text-xs font-bold text-red-600">-{formatCurrency(d.amount || 0, d.currency)}</td>
                    <td className="text-xs">{d.currency}</td>
                    <td><StatusBadge status={d.status || "APPLIED"} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(d.createdAt)}</td>
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
