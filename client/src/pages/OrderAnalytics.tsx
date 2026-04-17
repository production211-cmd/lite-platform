import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import {
  TrendingUp, ShoppingCart, DollarSign, Truck,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight,
} from "lucide-react";

export default function OrderAnalytics() {
  const [orderData, setOrderData] = useState<any>(null);
  const [vendorData, setVendorData] = useState<any>(null);
  const [shippingData, setShippingData] = useState<any>(null);
  const [catalogData, setCatalogData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [orders, vendors, shipping, catalog] = await Promise.all([
          api.getOrderAnalytics({ period }),
          api.getVendorAnalytics(),
          api.getShippingAnalytics(),
          api.getCatalogAnalytics(),
        ]);
        setOrderData(orders);
        setVendorData(vendors);
        setShippingData(shipping);
        setCatalogData(catalog);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [period]);

  if (loading) {
    return (
      <div>
        <TopBar title="Analytics" subtitle="Order trends and performance metrics" />
        <div className="flex items-center justify-center py-32">
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <TopBar
        title="Analytics"
        subtitle="Order trends and performance metrics"
        actions={
          <div className="flex items-center gap-2">
            {["7d", "30d", "90d"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn(
                  "px-3 py-1.5 text-xs font-medium rounded-lg transition-colors",
                  period === p
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {p === "7d" ? "7 Days" : p === "30d" ? "30 Days" : "90 Days"}
              </button>
            ))}
          </div>
        }
      />

      <div className="p-6 space-y-6 page-enter">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <ShoppingCart size={20} className="text-blue-600" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <ArrowUpRight size={12} />
                +12%
              </span>
            </div>
            <p className="text-2xl font-bold">{formatNumber(orderData?.totalOrders || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Orders ({period})</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <DollarSign size={20} className="text-emerald-600" />
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                <ArrowUpRight size={12} />
                +8%
              </span>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(orderData?.totalRevenue || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Revenue ({period})</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                <TrendingUp size={20} className="text-violet-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">{formatCurrency(orderData?.avgOrderValue || 0)}</p>
            <p className="text-xs text-slate-500 mt-1">Avg Order Value</p>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                <Truck size={20} className="text-cyan-600" />
              </div>
            </div>
            <p className="text-2xl font-bold">
              {shippingData?.avgDeliveryDays ? `${shippingData.avgDeliveryDays.toFixed(1)}d` : "—"}
            </p>
            <p className="text-xs text-slate-500 mt-1">Avg Delivery Time</p>
          </div>
        </div>

        {/* Status Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <PieChart size={16} className="text-slate-400" />
              Order Status Distribution
            </h3>
            <div className="space-y-3">
              {orderData?.statusBreakdown?.map((item: any) => {
                const pct = orderData.totalOrders > 0
                  ? ((item._count || 0) / orderData.totalOrders * 100).toFixed(1)
                  : "0";
                const colors: Record<string, string> = {
                  DELIVERED: "bg-emerald-500",
                  IN_TRANSIT: "bg-cyan-500",
                  SHIPPED: "bg-blue-500",
                  PLACED: "bg-indigo-500",
                  VENDOR_ACCEPT: "bg-violet-500",
                  CANCELLED: "bg-slate-400",
                  FRAUD_HOLD: "bg-red-500",
                  SETTLED: "bg-emerald-600",
                };
                return (
                  <div key={item.status} className="flex items-center gap-3">
                    <div className="w-24 text-xs text-slate-600 font-medium">
                      {item.status?.replace(/_/g, " ")}
                    </div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={cn("h-full rounded-full transition-all", colors[item.status] || "bg-slate-300")}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-16 text-right text-xs text-slate-500">
                      {item._count} ({pct}%)
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-slate-400" />
              Top Vendors by Revenue
            </h3>
            <div className="space-y-3">
              {vendorData?.topVendors?.slice(0, 8).map((v: any, i: number) => {
                const maxRev = vendorData.topVendors[0]?.totalRevenue || 1;
                const pct = ((v.totalRevenue || 0) / maxRev * 100).toFixed(0);
                return (
                  <div key={v.id} className="flex items-center gap-3">
                    <span className="w-5 text-[10px] text-slate-400 font-bold">#{i + 1}</span>
                    <div className="w-28 text-xs font-medium truncate">{v.name}</div>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c8a45c] rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-20 text-right text-xs font-medium">
                      {formatCurrency(v.totalRevenue || 0)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Shipping & Catalog Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-sm mb-4">Shipping Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{shippingData?.totalShipments || 0}</p>
                <p className="text-[10px] text-slate-500">Total Shipments</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{formatCurrency(shippingData?.totalCost || 0)}</p>
                <p className="text-[10px] text-slate-500">Total Cost</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{formatCurrency(shippingData?.avgCost || 0)}</p>
                <p className="text-[10px] text-slate-500">Avg Cost/Shipment</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{shippingData?.exceptionRate ? `${shippingData.exceptionRate.toFixed(1)}%` : "0%"}</p>
                <p className="text-[10px] text-slate-500">Exception Rate</p>
              </div>
            </div>
            {/* Carrier breakdown */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-600">By Carrier</p>
              {shippingData?.byCarrier?.map((c: any) => (
                <div key={c.carrier} className="flex items-center justify-between text-xs">
                  <span className={cn(
                    "font-bold px-2 py-0.5 rounded text-[10px]",
                    c.carrier === "FEDEX" ? "bg-purple-50 text-purple-700" :
                    c.carrier === "DHL" ? "bg-yellow-50 text-yellow-700" :
                    "bg-amber-50 text-amber-700"
                  )}>
                    {c.carrier}
                  </span>
                  <span>{c._count} shipments</span>
                  <span className="font-medium">{formatCurrency(c._sum?.shippingCost || 0)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[var(--border)] p-5">
            <h3 className="font-semibold text-sm mb-4">Catalog Health</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{catalogData?.totalProducts || 0}</p>
                <p className="text-[10px] text-slate-500">Total Products</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{catalogData?.avgEnrichmentScore ? `${(catalogData.avgEnrichmentScore * 100).toFixed(0)}%` : "—"}</p>
                <p className="text-[10px] text-slate-500">Avg Enrichment</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{catalogData?.totalCategories || 0}</p>
                <p className="text-[10px] text-slate-500">Categories</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3 text-center">
                <p className="text-lg font-bold">{catalogData?.totalBrands || 0}</p>
                <p className="text-[10px] text-slate-500">Brands</p>
              </div>
            </div>
            {/* Status breakdown */}
            <div className="mt-4 space-y-2">
              <p className="text-xs font-medium text-slate-600">Product Status</p>
              {catalogData?.byStatus?.map((s: any) => (
                <div key={s.status} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{s.status?.replace(/_/g, " ")}</span>
                  <span className="font-medium">{s._count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
