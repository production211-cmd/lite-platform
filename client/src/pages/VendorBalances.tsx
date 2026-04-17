import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, Search } from "lucide-react";

export default function VendorBalances() {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await api.getVendorBalances();
        setBalances(data || []);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = balances.filter((b: any) =>
    !search || b.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalOutstanding = filtered.reduce((s: number, b: any) => s + (b.balance || 0), 0);
  const totalEarned = filtered.reduce((s: number, b: any) => s + (b.totalEarned || 0), 0);

  return (
    <div>
      <TopBar title="Vendor Balances" subtitle={`${balances.length} active vendors`} />

      <div className="p-6 space-y-6 page-enter">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Wallet size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-slate-500">Total Outstanding</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalEarned)}</p>
                <p className="text-xs text-slate-500">Total Earned (All Time)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <ArrowUpRight size={20} className="text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold">{filtered.length}</p>
                <p className="text-xs text-slate-500">Active Vendors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search vendors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
          />
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
                  <th>Payout Cycle</th>
                  <th>Currency</th>
                  <th>Total Earned</th>
                  <th>Outstanding Balance</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((b: any) => (
                  <tr key={b.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">
                          {b.name?.[0] || "?"}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{b.name}</p>
                          <p className="text-[10px] text-slate-500">{b.economicModel}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs">{b.payoutCycle || "BIWEEKLY"}</td>
                    <td className="text-xs">{b.currency || "USD"}</td>
                    <td className="text-xs">{formatCurrency(b.totalEarned || 0, b.currency)}</td>
                    <td>
                      <span className={cn(
                        "text-sm font-bold",
                        (b.balance || 0) > 0 ? "text-amber-600" : "text-emerald-600"
                      )}>
                        {formatCurrency(b.balance || 0, b.currency)}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full",
                        (b.balance || 0) > 1000 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"
                      )}>
                        {(b.balance || 0) > 1000 ? "Payout Due" : "Current"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
