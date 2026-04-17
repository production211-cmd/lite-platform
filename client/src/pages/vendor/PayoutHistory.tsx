/**
 * PayoutHistory — Vendor Payout History & Earnings Breakdown
 * ===========================================================
 * Detailed payout history with period selector, earnings breakdown,
 * upcoming payout preview, and downloadable statements.
 */
import { useState, useMemo, Fragment } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-components";
import { PaginationBar } from "@/components/DataGrid";
import {
  DollarSign, TrendingUp, Calendar, Download, Clock,
  CheckCircle2, ArrowUpRight, ArrowDownRight, FileText,
  Filter, ChevronRight, CreditCard, Banknote,
} from "lucide-react";

interface Payout {
  id: string;
  date: string;
  amount: number;
  status: "completed" | "pending" | "processing" | "failed";
  method: string;
  reference: string;
  ordersCount: number;
  grossSales: number;
  commission: number;
  deductions: number;
  adjustments: number;
}

// Demo data
const DEMO_PAYOUTS: Payout[] = [
  { id: "PAY-001", date: "2024-03-15", amount: 12450.00, status: "completed", method: "ACH Transfer", reference: "ACH-2024-0315-001", ordersCount: 28, grossSales: 15200.00, commission: 2280.00, deductions: 470.00, adjustments: 0 },
  { id: "PAY-002", date: "2024-03-08", amount: 8920.50, status: "completed", method: "ACH Transfer", reference: "ACH-2024-0308-001", ordersCount: 19, grossSales: 11500.00, commission: 1725.00, deductions: 854.50, adjustments: 0 },
  { id: "PAY-003", date: "2024-03-01", amount: 15680.00, status: "completed", method: "ACH Transfer", reference: "ACH-2024-0301-001", ordersCount: 34, grossSales: 19800.00, commission: 2970.00, deductions: 1150.00, adjustments: 0 },
  { id: "PAY-004", date: "2024-02-23", amount: 6340.25, status: "completed", method: "ACH Transfer", reference: "ACH-2024-0223-001", ordersCount: 14, grossSales: 8200.00, commission: 1230.00, deductions: 629.75, adjustments: 0 },
  { id: "PAY-005", date: "2024-02-16", amount: 11200.00, status: "completed", method: "ACH Transfer", reference: "ACH-2024-0216-001", ordersCount: 25, grossSales: 14000.00, commission: 2100.00, deductions: 700.00, adjustments: 0 },
  { id: "PAY-006", date: "2024-02-09", amount: 9875.00, status: "completed", method: "ACH Transfer", reference: "ACH-2024-0209-001", ordersCount: 22, grossSales: 12500.00, commission: 1875.00, deductions: 750.00, adjustments: 0 },
];

const UPCOMING: Payout = {
  id: "PAY-NEXT", date: "2024-03-22", amount: 10250.00, status: "pending", method: "ACH Transfer", reference: "—",
  ordersCount: 23, grossSales: 13200.00, commission: 1980.00, deductions: 970.00, adjustments: 0,
};

export default function PayoutHistory() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("all");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const perPage = 10;

  const filtered = useMemo(() => {
    if (period === "all") return DEMO_PAYOUTS;
    const now = new Date();
    const cutoff = new Date();
    if (period === "30d") cutoff.setDate(now.getDate() - 30);
    if (period === "90d") cutoff.setDate(now.getDate() - 90);
    return DEMO_PAYOUTS.filter((p) => new Date(p.date) >= cutoff);
  }, [period]);

  const totalEarnings = filtered.reduce((s, p) => s + p.amount, 0);
  const totalOrders = filtered.reduce((s, p) => s + p.ordersCount, 0);
  const avgPayout = filtered.length > 0 ? totalEarnings / filtered.length : 0;

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="page-enter p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-wide text-gray-900">Payout History</h1>
          <p className="text-sm text-gray-500 mt-1">Track your earnings and payout schedule</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
            className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
          >
            <option value="all">All Time</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <DollarSign size={20} className="text-green-600" />
            </div>
            <span className="text-sm text-gray-500">Total Earned</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalEarnings)}</p>
          <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} />+12.4% vs prior period</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Banknote size={20} className="text-blue-600" />
            </div>
            <span className="text-sm text-gray-500">Avg Payout</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(avgPayout)}</p>
          <p className="text-xs text-gray-500 mt-1">{filtered.length} payouts</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <span className="text-sm text-gray-500">Orders Fulfilled</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatNumber(totalOrders)}</p>
          <p className="text-xs text-gray-500 mt-1">across {filtered.length} payout cycles</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock size={20} className="text-amber-600" />
            </div>
            <span className="text-sm text-gray-500">Next Payout</span>
          </div>
          <p className="text-2xl font-semibold text-gray-900">{formatCurrency(UPCOMING.amount)}</p>
          <p className="text-xs text-amber-600 mt-1">Est. {new Date(UPCOMING.date).toLocaleDateString()}</p>
        </div>
      </div>

      {/* Upcoming Payout Banner */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-xl p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <p className="text-sm text-gray-300 mb-1">Upcoming Payout — {new Date(UPCOMING.date).toLocaleDateString()}</p>
            <p className="text-3xl font-semibold">{formatCurrency(UPCOMING.amount)}</p>
            <p className="text-sm text-gray-400 mt-1">{UPCOMING.ordersCount} orders — {UPCOMING.method}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-xs text-gray-400">Gross Sales</p>
              <p className="text-lg font-medium">{formatCurrency(UPCOMING.grossSales)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Commission</p>
              <p className="text-lg font-medium text-red-300">-{formatCurrency(UPCOMING.commission)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400">Deductions</p>
              <p className="text-lg font-medium text-red-300">-{formatCurrency(UPCOMING.deductions)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Date</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Reference</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Orders</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Gross</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Commission</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Deductions</th>
                <th className="text-right py-3 px-4 font-medium text-gray-600">Net Payout</th>
                <th className="text-center py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((p) => (
                <Fragment key={p.id}>
                  <tr
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  >
                    <td className="py-3 px-4 text-gray-900">{new Date(p.date).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-gray-600 font-mono text-xs">{p.reference}</td>
                    <td className="py-3 px-4 text-gray-900">{p.ordersCount}</td>
                    <td className="py-3 px-4 text-gray-900">{formatCurrency(p.grossSales)}</td>
                    <td className="py-3 px-4 text-red-600">-{formatCurrency(p.commission)}</td>
                    <td className="py-3 px-4 text-red-600">-{formatCurrency(p.deductions)}</td>
                    <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(p.amount)}</td>
                    <td className="py-3 px-4 text-center"><StatusBadge status={p.status} /></td>
                    <td className="py-3 px-4">
                      <ChevronRight size={14} className={`text-gray-400 transition-transform ${expandedId === p.id ? "rotate-90" : ""}`} />
                    </td>
                  </tr>
                  {expandedId === p.id && (
                    <tr>
                      <td colSpan={9} className="bg-gray-50 px-8 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Payment Method</p>
                            <p className="text-gray-900 flex items-center gap-1"><CreditCard size={14} />{p.method}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Commission Rate</p>
                            <p className="text-gray-900">{((p.commission / p.grossSales) * 100).toFixed(1)}%</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 mb-1">Adjustments</p>
                            <p className="text-gray-900">{p.adjustments === 0 ? "None" : formatCurrency(p.adjustments)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors">
                              <FileText size={12} />
                              View Statement
                            </button>
                            <button className="flex items-center gap-1 px-3 py-1.5 border border-gray-300 rounded-lg text-xs text-gray-700 hover:bg-gray-100 transition-colors">
                              <Download size={12} />
                              PDF
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="border-t border-gray-200 p-4">
            <PaginationBar
              page={page}
              totalPages={totalPages}
              limit={perPage}
              totalItems={filtered.length}
              onPageChange={setPage}
              onLimitChange={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
}
