import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge } from "@/components/ui-components";
import {
  DollarSign, TrendingUp, TrendingDown, CreditCard,
  ArrowUpRight, ArrowDownRight, Wallet, PieChart,
} from "lucide-react";

export default function Finance() {
  const [pnl, setPnl] = useState<any>(null);
  const [payoutStats, setPayoutStats] = useState<any>(null);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, ps, b] = await Promise.all([
          api.getPnL(),
          api.getPayoutStats(),
          api.getVendorBalances(),
        ]);
        setPnl(p);
        setPayoutStats(ps);
        setBalances(b);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <TopBar title="Finance & Accounting" subtitle="Revenue, payouts, and P&L overview" />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* P&L Summary */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={pnl?.revenue || 0} format="currency" icon={DollarSign} iconColor="text-emerald-600" />
          <KPICard title="Gross Profit" value={pnl?.grossProfit || 0} format="currency" icon={TrendingUp} iconColor="text-blue-600" />
          <KPICard title="Commission Earned" value={pnl?.commissions || 0} format="currency" icon={Wallet} iconColor="text-violet-600" />
          <KPICard title="Net Profit" value={pnl?.netProfit || 0} format="currency" icon={PieChart} iconColor="text-amber-600" />
        </div>

        {/* P&L Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold mb-4">Profit & Loss Statement</h3>
            <div className="space-y-3">
              {[
                { label: "Revenue (GMV)", value: pnl?.revenue, type: "income" },
                { label: "Cost of Goods (Vendor Payable)", value: pnl?.cogs, type: "expense" },
                { label: "Gross Profit", value: pnl?.grossProfit, type: "total" },
                { label: "Commission Income", value: pnl?.commissions, type: "income" },
                { label: "Shipping Costs", value: pnl?.shippingCosts, type: "expense" },
                { label: "Refunds", value: pnl?.refunds, type: "expense" },
                { label: "Deductions Applied", value: pnl?.deductions, type: "expense" },
                { label: "Operating Expenses", value: pnl?.operatingExpenses, type: "expense" },
                { label: "Net Profit", value: pnl?.netProfit, type: "total" },
              ].map((item) => (
                <div key={item.label} className={cn(
                  "flex items-center justify-between py-2",
                  item.type === "total" && "border-t border-[var(--border)] font-bold pt-3"
                )}>
                  <div className="flex items-center gap-2">
                    {item.type === "income" && <ArrowUpRight size={14} className="text-emerald-500" />}
                    {item.type === "expense" && <ArrowDownRight size={14} className="text-red-500" />}
                    <span className="text-sm">{item.label}</span>
                  </div>
                  <span className={cn(
                    "text-sm font-medium",
                    item.type === "income" && "text-emerald-600",
                    item.type === "expense" && "text-red-600",
                    item.type === "total" && "text-[var(--foreground)]"
                  )}>
                    {formatCurrency(item.value || 0)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Payout Summary */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold mb-4">Payout Summary</h3>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <p className="text-xl font-bold text-amber-700">{formatCurrency(payoutStats?.pending || 0)}</p>
                <p className="text-xs text-amber-600 mt-1">Pending</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-xl font-bold text-blue-700">{formatCurrency(payoutStats?.processing || 0)}</p>
                <p className="text-xs text-blue-600 mt-1">Processing</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-4 text-center">
                <p className="text-xl font-bold text-emerald-700">{formatCurrency(payoutStats?.completed || 0)}</p>
                <p className="text-xs text-emerald-600 mt-1">Completed</p>
              </div>
            </div>

            <h4 className="font-medium text-sm mb-3">Vendor Balances</h4>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {balances.map((vendor: any) => (
                <div key={vendor.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{vendor.name}</p>
                    <p className="text-[10px] text-slate-500">{vendor.payoutCycle} · {vendor.currency}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(vendor.balance, vendor.currency)}</p>
                    <p className="text-[10px] text-slate-500">
                      Earned: {formatCurrency(vendor.totalEarned, vendor.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
