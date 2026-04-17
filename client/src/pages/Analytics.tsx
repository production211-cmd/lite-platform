/**
 * Analytics — Reporting Dashboard
 * ================================
 * Revenue trends (area chart), conversion funnel, vendor performance
 * scorecards, shipping SLA compliance, and exportable report views.
 * Uses inline SVG charts for zero-dependency rendering.
 */
import { useState, useMemo, useId } from "react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import {
  TrendingUp, TrendingDown, DollarSign, ShoppingCart, Users,
  Truck, BarChart3, PieChart, Download, Calendar, ArrowUpRight,
  ArrowDownRight, Target, Clock, CheckCircle2, AlertTriangle,
  Package, Star, ChevronRight, Filter,
} from "lucide-react";

type Period = "7d" | "30d" | "90d" | "12m";

// Revenue data
const REVENUE_DATA: Record<Period, { label: string; value: number; orders: number }[]> = {
  "7d": [
    { label: "Mon", value: 12400, orders: 28 },
    { label: "Tue", value: 15800, orders: 34 },
    { label: "Wed", value: 11200, orders: 25 },
    { label: "Thu", value: 18600, orders: 41 },
    { label: "Fri", value: 22300, orders: 48 },
    { label: "Sat", value: 19700, orders: 43 },
    { label: "Sun", value: 14500, orders: 32 },
  ],
  "30d": [
    { label: "W1", value: 82400, orders: 185 },
    { label: "W2", value: 95800, orders: 210 },
    { label: "W3", value: 88200, orders: 195 },
    { label: "W4", value: 103600, orders: 228 },
  ],
  "90d": [
    { label: "Jan", value: 285000, orders: 620 },
    { label: "Feb", value: 312000, orders: 685 },
    { label: "Mar", value: 370000, orders: 818 },
  ],
  "12m": [
    { label: "Apr", value: 245000, orders: 540 },
    { label: "May", value: 268000, orders: 590 },
    { label: "Jun", value: 295000, orders: 650 },
    { label: "Jul", value: 310000, orders: 685 },
    { label: "Aug", value: 285000, orders: 630 },
    { label: "Sep", value: 320000, orders: 705 },
    { label: "Oct", value: 355000, orders: 780 },
    { label: "Nov", value: 425000, orders: 935 },
    { label: "Dec", value: 480000, orders: 1060 },
    { label: "Jan", value: 285000, orders: 630 },
    { label: "Feb", value: 312000, orders: 690 },
    { label: "Mar", value: 370000, orders: 818 },
  ],
};

// Conversion funnel
const FUNNEL = [
  { stage: "Site Visits", value: 124500, color: "#e5e7eb" },
  { stage: "Product Views", value: 45200, color: "#dbeafe" },
  { stage: "Add to Cart", value: 12800, color: "#bfdbfe" },
  { stage: "Checkout Started", value: 8400, color: "#93c5fd" },
  { stage: "Orders Placed", value: 5620, color: "#3b82f6" },
];

// Vendor performance
const VENDOR_PERFORMANCE = [
  { name: "Eleonora Bonucci", revenue: 185400, orders: 412, rating: 4.9, onTime: 99.1, returns: 1.2, trend: "up" },
  { name: "Urban Threads", revenue: 142800, orders: 318, rating: 4.7, onTime: 97.8, returns: 2.1, trend: "up" },
  { name: "Link2Lux", revenue: 128500, orders: 285, rating: 4.6, onTime: 96.5, returns: 1.8, trend: "down" },
  { name: "Maison Kitsuné", revenue: 98200, orders: 218, rating: 4.8, onTime: 98.2, returns: 0.9, trend: "up" },
  { name: "Atelier Noir", revenue: 76400, orders: 170, rating: 4.5, onTime: 95.1, returns: 3.2, trend: "down" },
  { name: "Nordic Essentials", revenue: 65800, orders: 146, rating: 4.4, onTime: 94.8, returns: 2.8, trend: "up" },
];

// Shipping SLA
const SHIPPING_SLA = {
  onTimeRate: 97.2,
  avgTransitDays: 3.4,
  exceptionsRate: 2.1,
  byCarrier: [
    { carrier: "UPS", onTime: 98.1, avgDays: 3.2, volume: 1240 },
    { carrier: "FedEx", onTime: 97.5, avgDays: 2.8, volume: 980 },
    { carrier: "USPS", onTime: 95.2, avgDays: 4.1, volume: 620 },
    { carrier: "DHL", onTime: 96.8, avgDays: 5.2, volume: 340 },
  ],
  byRegion: [
    { region: "Northeast", onTime: 98.5, avgDays: 2.8 },
    { region: "Southeast", onTime: 97.1, avgDays: 3.2 },
    { region: "Midwest", onTime: 96.8, avgDays: 3.5 },
    { region: "West", onTime: 97.9, avgDays: 3.1 },
    { region: "International", onTime: 92.4, avgDays: 7.2 },
  ],
};

// SVG Area Chart
function AreaChart({ data, height = 200, color = "#3b82f6" }: { data: { label: string; value: number }[]; height?: number; color?: string }) {
  const width = 800;
  const padding = { top: 20, right: 20, bottom: 30, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map((d) => d.value));
  const minVal = Math.min(...data.map((d) => d.value)) * 0.8;
  const range = maxVal - minVal || 1;

  const points = data.map((d, i) => ({
    x: padding.left + (i / (data.length - 1)) * chartW,
    y: padding.top + chartH - ((d.value - minVal) / range) * chartH,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding.top + chartH} L ${points[0].x} ${padding.top + chartH} Z`;

  const yTicks = 5;
  const yLabels = Array.from({ length: yTicks }, (_, i) => minVal + (range / (yTicks - 1)) * i);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Grid lines */}
      {yLabels.map((v, i) => {
        const y = padding.top + chartH - ((v - minVal) / range) * chartH;
        return (
          <g key={i}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#f3f4f6" strokeWidth="1" />
            <text x={padding.left - 8} y={y + 4} textAnchor="end" fill="#9ca3af" fontSize="10">
              {v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`}
            </text>
          </g>
        );
      })}

      {/* Area fill */}
      <defs>
        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#areaGrad)" />

      {/* Line */}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Data points */}
      {points.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="4" fill="white" stroke={color} strokeWidth="2" />
          <text x={p.x} y={padding.top + chartH + 18} textAnchor="middle" fill="#6b7280" fontSize="10">
            {data[i].label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// Horizontal Bar Chart
function HBarChart({ data, maxVal }: { data: { label: string; value: number; color: string }[]; maxVal: number }) {
  return (
    <div className="space-y-3">
      {data.map((d, i) => (
        <div key={i}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-700">{d.label}</span>
            <span className="font-medium text-gray-900">{formatNumber(d.value)}</span>
          </div>
          <div className="h-6 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${(d.value / maxVal) * 100}%`, backgroundColor: d.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut Chart
function DonutChart({ value, total, color = "#3b82f6", size = 120 }: { value: number; total: number; color?: string; size?: number }) {
  const pct = (value / total) * 100;
  const r = (size - 16) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="10" />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="10"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform={`rotate(-90 ${size / 2} ${size / 2})`}
        className="transition-all duration-1000"
      />
      <text x={size / 2} y={size / 2 - 4} textAnchor="middle" fill="#111827" fontSize="20" fontWeight="600">
        {pct.toFixed(1)}%
      </text>
      <text x={size / 2} y={size / 2 + 14} textAnchor="middle" fill="#9ca3af" fontSize="10">
        on-time
      </text>
    </svg>
  );
}

export default function Analytics() {
  const [period, setPeriod] = useState<Period>("30d");
  const [activeTab, setActiveTab] = useState<"overview" | "vendors" | "shipping">("overview");

  const tabId = useId();

  const revenueData = useMemo(() => REVENUE_DATA[period], [period]);
  const { totalRevenue, totalOrders, avgOrderValue } = useMemo(() => {
    const rev = revenueData.reduce((s, d) => s + d.value, 0);
    const ord = revenueData.reduce((s, d) => s + d.orders, 0);
    return { totalRevenue: rev, totalOrders: ord, avgOrderValue: ord > 0 ? rev / ord : 0 };
  }, [revenueData]);
  const conversionRate = useMemo(() => ((FUNNEL[4].value / FUNNEL[0].value) * 100).toFixed(2), []);

  return (
    <div className="page-enter p-6 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-heading text-2xl tracking-wide text-gray-900">Analytics & Reports</h1>
          <p className="text-sm text-gray-500 mt-1">Performance insights and business intelligence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-100 rounded-lg p-0.5">
            {(["7d", "30d", "90d", "12m"] as Period[]).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  period === p ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : p === "90d" ? "90 Days" : "12 Months"}
              </button>
            ))}
          </div>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div role="tablist" aria-label="Analytics sections" className="flex gap-1 mb-6 border-b border-gray-200">
        {[
          { id: "overview" as const, label: "Overview", icon: BarChart3 },
          { id: "vendors" as const, label: "Vendor Performance", icon: Users },
          { id: "shipping" as const, label: "Shipping SLA", icon: Truck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              role="tab"
              id={`${tabId}-tab-${tab.id}`}
              aria-selected={activeTab === tab.id}
              aria-controls={`${tabId}-panel-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div role="tabpanel" id={`${tabId}-panel-overview`} aria-labelledby={`${tabId}-tab-overview`}>
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
                  <DollarSign size={20} className="text-green-600" />
                </div>
                <span className="text-sm text-gray-500">Revenue</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(totalRevenue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} />+14.2% vs prior</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <ShoppingCart size={20} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Orders</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(totalOrders)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} />+8.7% vs prior</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                  <Target size={20} className="text-purple-600" />
                </div>
                <span className="text-sm text-gray-500">AOV</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{formatCurrency(avgOrderValue)}</p>
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1"><ArrowUpRight size={12} />+5.1% vs prior</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-5 card-hover">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
                  <TrendingUp size={20} className="text-amber-600" />
                </div>
                <span className="text-sm text-gray-500">Conversion</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{conversionRate}%</p>
              <p className="text-xs text-red-500 mt-1 flex items-center gap-1"><ArrowDownRight size={12} />-0.3% vs prior</p>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-base tracking-wide text-gray-900">Revenue Trend</h3>
              <span className="text-xs text-gray-500">{period === "7d" ? "Daily" : period === "30d" ? "Weekly" : period === "90d" ? "Monthly" : "Monthly"}</span>
            </div>
            <AreaChart data={revenueData} height={220} color="#3b82f6" />
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-6">Conversion Funnel</h3>
            <div className="space-y-4">
              {FUNNEL.map((step, i) => {
                const pct = ((step.value / FUNNEL[0].value) * 100).toFixed(1);
                const dropoff = i > 0 ? ((1 - step.value / FUNNEL[i - 1].value) * 100).toFixed(1) : null;
                return (
                  <div key={step.stage} className="flex items-center gap-4">
                    <div className="w-36 text-sm text-gray-700 shrink-0">{step.stage}</div>
                    <div className="flex-1 h-8 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full rounded-full transition-all duration-700 flex items-center justify-end pr-3"
                        style={{ width: `${pct}%`, backgroundColor: step.color }}
                      >
                        <span className="text-xs font-medium text-gray-700">{formatNumber(step.value)}</span>
                      </div>
                    </div>
                    <div className="w-16 text-right">
                      <span className="text-xs font-medium text-gray-900">{pct}%</span>
                    </div>
                    <div className="w-20 text-right">
                      {dropoff && <span className="text-xs text-red-500">-{dropoff}%</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Vendor Performance Tab */}
      {activeTab === "vendors" && (
        <div role="tabpanel" id={`${tabId}-panel-vendors`} aria-labelledby={`${tabId}-tab-vendors`} className="space-y-6">
          {/* Vendor Scorecards */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading text-base tracking-wide text-gray-900">Vendor Performance Scorecards</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Vendor</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Revenue</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Orders</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Rating</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">On-Time %</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Return %</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-600">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {VENDOR_PERFORMANCE.map((v, i) => (
                    <tr key={v.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                            {i + 1}
                          </div>
                          <span className="font-medium text-gray-900">{v.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-gray-900">{formatCurrency(v.revenue)}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(v.orders)}</td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-amber-600">
                          <Star size={12} fill="currentColor" />
                          {v.rating}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={v.onTime >= 97 ? "text-green-600" : v.onTime >= 95 ? "text-amber-600" : "text-red-600"}>
                          {v.onTime}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className={v.returns <= 2 ? "text-green-600" : v.returns <= 3 ? "text-amber-600" : "text-red-600"}>
                          {v.returns}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        {v.trend === "up" ? (
                          <ArrowUpRight size={16} className="mx-auto text-green-500" />
                        ) : (
                          <ArrowDownRight size={16} className="mx-auto text-red-500" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Revenue by Vendor Chart */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-6">Revenue by Vendor</h3>
            <HBarChart
              data={VENDOR_PERFORMANCE.map((v, i) => ({
                label: v.name,
                value: v.revenue,
                color: ["#3b82f6", "#8b5cf6", "#06b6d4", "#f59e0b", "#ef4444", "#10b981"][i],
              }))}
              maxVal={Math.max(...VENDOR_PERFORMANCE.map((v) => v.revenue))}
            />
          </div>
        </div>
      )}

      {/* Shipping SLA Tab */}
      {activeTab === "shipping" && (
        <div role="tabpanel" id={`${tabId}-panel-shipping`} aria-labelledby={`${tabId}-tab-shipping`}>
        <div className="space-y-6">
          {/* SLA Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 flex items-center gap-6">
              <DonutChart value={SHIPPING_SLA.onTimeRate} total={100} color="#22c55e" size={100} />
              <div>
                <p className="text-sm text-gray-500">On-Time Delivery</p>
                <p className="text-2xl font-semibold text-gray-900">{SHIPPING_SLA.onTimeRate}%</p>
                <p className="text-xs text-green-600 mt-1">Above 95% SLA target</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Clock size={20} className="text-blue-600" />
                </div>
                <span className="text-sm text-gray-500">Avg Transit</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{SHIPPING_SLA.avgTransitDays} days</p>
              <p className="text-xs text-green-600 mt-1">-0.3 days vs prior period</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <span className="text-sm text-gray-500">Exception Rate</span>
              </div>
              <p className="text-2xl font-semibold text-gray-900">{SHIPPING_SLA.exceptionsRate}%</p>
              <p className="text-xs text-red-500 mt-1">+0.4% vs prior period</p>
            </div>
          </div>

          {/* By Carrier */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="font-heading text-base tracking-wide text-gray-900">Performance by Carrier</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-600">Carrier</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Volume</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">On-Time %</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-600">Avg Transit</th>
                    <th className="py-3 px-4 font-medium text-gray-600">SLA Status</th>
                  </tr>
                </thead>
                <tbody>
                  {SHIPPING_SLA.byCarrier.map((c) => (
                    <tr key={c.carrier} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4 font-medium text-gray-900">{c.carrier}</td>
                      <td className="py-3 px-4 text-right text-gray-700">{formatNumber(c.volume)}</td>
                      <td className="py-3 px-4 text-right">
                        <span className={c.onTime >= 97 ? "text-green-600 font-medium" : c.onTime >= 95 ? "text-amber-600 font-medium" : "text-red-600 font-medium"}>
                          {c.onTime}%
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">{c.avgDays} days</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                          c.onTime >= 97 ? "bg-green-50 text-green-700" : c.onTime >= 95 ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"
                        }`}>
                          {c.onTime >= 97 ? <CheckCircle2 size={12} /> : c.onTime >= 95 ? <Clock size={12} /> : <AlertTriangle size={12} />}
                          {c.onTime >= 97 ? "Meeting SLA" : c.onTime >= 95 ? "At Risk" : "Below SLA"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* By Region */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-6">Delivery Performance by Region</h3>
            <div className="space-y-4">
              {SHIPPING_SLA.byRegion.map((r) => (
                <div key={r.region} className="flex items-center gap-4">
                  <div className="w-28 text-sm text-gray-700 shrink-0">{r.region}</div>
                  <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${r.onTime}%`,
                        backgroundColor: r.onTime >= 97 ? "#22c55e" : r.onTime >= 95 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <div className="w-16 text-right text-sm font-medium text-gray-900">{r.onTime}%</div>
                  <div className="w-20 text-right text-xs text-gray-500">{r.avgDays}d avg</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}
