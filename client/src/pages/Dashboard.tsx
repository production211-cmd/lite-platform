import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { RefreshCw, Eye } from "lucide-react";

/**
 * Dashboard — matches litemarketplace.com reference exactly
 * =========================================================
 * - Row 1: 4 KPI cards with TOP colored borders (Total Orders, Total GMV, AOV, Fulfillment Rate)
 * - Row 2: 4 KPI cards with TOP colored borders (GMV Today, GMV This Week, GMV This Month, Order Status Breakdown)
 * - Bottom: Two-column layout (Top Selling Brands table + Recent Orders table)
 */

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const [k, orders, vendors] = await Promise.all([
        api.getDashboardKPIs("month"),
        api.getRecentOrders(),
        api.getTopVendors(),
      ]);
      setKpis(k);
      setRecentOrders(orders);
      setTopVendors(vendors);
    } catch (err: any) {
      console.error("Dashboard load error:", err);
      setError(err?.message || "Failed to load dashboard data");
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  if (loading && !kpis) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const totalOrders = kpis?.totalOrders || 0;
  const totalRevenue = kpis?.totalRevenue || 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const statusBreakdown = kpis?.statusBreakdown || {};
  const periodMetrics = kpis?.periodMetrics || {};

  // Calculate fulfillment rate
  const deliveredCount = (statusBreakdown.DELIVERED || 0) + (statusBreakdown.SETTLED || 0);
  const fulfillmentRate = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;

  // Calculate order status groups for the breakdown card
  const pendingCount = (statusBreakdown.PLACED || 0) + (statusBreakdown.FRAUD_HOLD || 0);
  const processingCount = (statusBreakdown.VENDOR_ACCEPT || 0) + (statusBreakdown.IN_TRANSIT || 0) + (statusBreakdown.SHIPPED || 0);

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "placed" || s === "pending" || s === "pending_acceptance") return "status-pending";
    if (s === "processing" || s === "vendor_accept" || s === "accepted") return "status-processing";
    if (s === "delivered" || s === "settled") return "status-delivered";
    if (s === "shipped" || s === "in_transit") return "status-shipped";
    if (s === "cancelled") return "status-cancelled";
    return "status-neutral";
  };

  const statusLabel = (status: string) => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Page Header — matches reference exactly */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl small-caps tracking-wide">Lord & Taylor Dashboard</h1>
          <p className="text-sm text-gray-400 font-body mt-1">Real-time metrics from synced L&T orders</p>
        </div>
        <button
          onClick={() => load()}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-body"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between">
          <span className="text-sm text-red-700 font-body">{error}</span>
          <button onClick={() => load()} className="text-xs font-semibold text-red-600 hover:text-red-800 font-body">Retry</button>
        </div>
      )}

      {/* KPI Cards Row 1 — TOP colored borders matching reference */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card-top kpi-blue animate-fade-in stagger-1">
          <p className="text-3xl font-bold text-gray-900 font-body mt-2">{formatNumber(totalOrders)}</p>
          <p className="text-sm text-gray-500 font-body mt-1">Total Orders</p>
        </div>
        <div className="kpi-card-top kpi-green animate-fade-in stagger-2">
          <p className="text-3xl font-bold text-gray-900 font-body mt-2">{formatCurrency(totalRevenue)}</p>
          <p className="text-sm text-gray-500 font-body mt-1">Total GMV</p>
        </div>
        <div className="kpi-card-top kpi-orange animate-fade-in stagger-3">
          <p className="text-3xl font-bold text-gray-900 font-body mt-2">{formatCurrency(aov)}</p>
          <p className="text-sm text-gray-500 font-body mt-1">Average Order Value</p>
        </div>
        <div className="kpi-card-top kpi-purple animate-fade-in stagger-4">
          <p className="text-3xl font-bold text-gray-900 font-body mt-2">{fulfillmentRate.toFixed(2)}%</p>
          <p className="text-sm text-gray-500 font-body mt-1">Fulfillment Rate</p>
        </div>
      </div>

      {/* KPI Cards Row 2 — Period metrics + Order Status Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card-top kpi-green animate-fade-in stagger-5">
          <p className="text-2xl font-bold text-gray-900 font-body mt-2">{formatCurrency(periodMetrics.today?.gmv ?? 0)}</p>
          <p className="text-sm text-gray-500 font-body mt-1">GMV Today ({periodMetrics.today?.orders ?? 0} orders)</p>
        </div>
        <div className="kpi-card-top kpi-blue animate-fade-in stagger-6">
          <p className="text-2xl font-bold text-gray-900 font-body mt-2">{formatCurrency(periodMetrics.week?.gmv ?? 0)}</p>
          <p className="text-sm text-gray-500 font-body mt-1">GMV This Week ({periodMetrics.week?.orders ?? 0} orders)</p>
        </div>
        <div className="kpi-card-top kpi-orange animate-fade-in stagger-7">
          <p className="text-2xl font-bold text-gray-900 font-body mt-2">{formatCurrency(periodMetrics.month?.gmv ?? 0)}</p>
          <p className="text-sm text-gray-500 font-body mt-1">GMV This Month ({periodMetrics.month?.orders ?? 0} orders)</p>
        </div>
        <div className="kpi-card-top kpi-pink animate-fade-in stagger-8">
          <div className="flex items-center gap-3 text-sm font-body mt-2">
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-yellow-600">{pendingCount}</span>
              <span className="text-xs text-gray-500">Pending</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-blue-600">{processingCount}</span>
              <span className="text-xs text-gray-500">Processing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="font-bold text-green-600">{deliveredCount}</span>
              <span className="text-xs text-gray-500">Delivered</span>
            </span>
          </div>
          <p className="text-sm text-gray-500 font-body mt-2">Order Status Breakdown</p>
        </div>
      </div>

      {/* Two column layout: Top Selling Brands + Recent Orders — matches reference */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Brands */}
        <div className="bg-white rounded-lg border border-gray-200 animate-fade-in stagger-9">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="section-heading">Top Selling Brands</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Brand</th>
                  <th>Revenue</th>
                  <th>Orders</th>
                </tr>
              </thead>
              <tbody>
                {topVendors.slice(0, 10).map((vendor: any) => (
                  <tr key={vendor.id}>
                    <td className="font-medium font-body">{vendor.name}</td>
                    <td className="font-body">{formatCurrency(vendor.totalRevenue || 0)}</td>
                    <td className="font-body">{vendor._count?.vendorOrders ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200 animate-fade-in stagger-10">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="section-heading">Recent Orders</h3>
            <Link href="/orders" className="text-xs text-blue-600 font-semibold font-body flex items-center gap-1 hover:text-blue-700 transition-colors">
              View All &gt;
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.slice(0, 10).map((order: any) => (
                  <tr key={order.id}>
                    <td className="font-medium font-body">{order.orderNumber}</td>
                    <td className="font-body">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`status-badge ${statusColor(order.status)}`}>
                        {statusLabel(order.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
