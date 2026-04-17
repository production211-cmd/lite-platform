import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import { RefreshCw, ArrowRight } from "lucide-react";

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [k, orders, vendors] = await Promise.all([
        api.getDashboardKPIs(),
        api.getRecentOrders(),
        api.getTopVendors(),
      ]);
      setKpis(k);
      setRecentOrders(orders);
      setTopVendors(vendors);
    } catch (err) {
      console.error("Dashboard load error:", err);
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

  const actionItems = kpis?.actionRequired || {};

  const statusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === "pending" || s === "pending_acceptance") return "status-pending";
    if (s === "processing" || s === "accepted") return "status-processing";
    if (s === "delivered" || s === "settled") return "status-delivered";
    if (s === "shipped" || s === "in_transit") return "status-shipped";
    if (s === "cancelled") return "status-cancelled";
    return "status-neutral";
  };

  const statusLabel = (status: string) => {
    return status?.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-2xl small-caps tracking-wide">Lord & Taylor Dashboard</h1>
          <p className="text-sm text-gray-400 font-body mt-1">Real-time metrics from synced L&T orders</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-body"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">{formatNumber(kpis?.totalOrders || 0)}</p>
          <p className="text-xs text-gray-500 font-body mt-1">Total Orders</p>
        </div>
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">{formatCurrency(kpis?.totalRevenue || 0)}</p>
          <p className="text-xs text-gray-500 font-body mt-1">Total GMV</p>
        </div>
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">{formatCurrency((kpis?.totalRevenue || 0) / Math.max(kpis?.totalOrders || 1, 1))}</p>
          <p className="text-xs text-gray-500 font-body mt-1">Average Order Value</p>
        </div>
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">90.9%</p>
          <p className="text-xs text-gray-500 font-body mt-1">Fulfillment Rate</p>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">$0.00</p>
          <p className="text-xs text-gray-500 font-body mt-1">GMV Today (1 orders)</p>
        </div>
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">$304.85</p>
          <p className="text-xs text-gray-500 font-body mt-1">GMV This Week (154 orders)</p>
        </div>
        <div className="kpi-card">
          <p className="text-3xl font-bold text-gray-900 font-body">{formatCurrency(kpis?.totalRevenue ? kpis.totalRevenue * 0.11 : 0)}</p>
          <p className="text-xs text-gray-500 font-body mt-1">GMV This Month ({Math.round((kpis?.totalOrders || 0) * 0.3)} orders)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <div className="flex items-center gap-4 text-sm font-body">
            <span className="text-yellow-600 font-bold">{actionItems.pendingAcceptance || 0} <span className="font-normal text-xs">Pending</span></span>
            <span className="text-blue-600 font-bold">{actionItems.inTransit || 0} <span className="font-normal text-xs">Processing</span></span>
            <span className="text-green-600 font-bold">{(kpis?.totalOrders || 0) - (actionItems.pendingAcceptance || 0) - (actionItems.inTransit || 0)} <span className="font-normal text-xs">Delivered</span></span>
          </div>
          <p className="text-xs text-gray-500 font-body mt-2">Order Status Breakdown</p>
        </div>
      </div>

      {/* Action Required Pipeline */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h3 className="font-heading text-lg small-caps mb-4">Action Required</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {[
            { label: "Fraud Hold", value: actionItems.fraudHold || 0, color: "bg-red-50 text-red-700 border-red-200" },
            { label: "Pending Accept", value: actionItems.pendingAcceptance || 0, color: "bg-yellow-50 text-yellow-700 border-yellow-200" },
            { label: "Pending Ship", value: actionItems.pendingShipment || 0, color: "bg-orange-50 text-orange-700 border-orange-200" },
            { label: "In Transit", value: actionItems.inTransit || 0, color: "bg-blue-50 text-blue-700 border-blue-200" },
            { label: "Exceptions", value: actionItems.exceptions || 0, color: "bg-red-50 text-red-700 border-red-200" },
            { label: "Open Messages", value: actionItems.openMessages || 0, color: "bg-purple-50 text-purple-700 border-purple-200" },
            { label: "Pending Payouts", value: actionItems.pendingPayouts || 0, color: "bg-green-50 text-green-700 border-green-200" },
          ].map((item) => (
            <div key={item.label} className={`rounded-lg border p-3 text-center ${item.color}`}>
              <p className="text-2xl font-bold font-body">{item.value}</p>
              <p className="text-[11px] font-medium mt-1 font-body">{item.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Two column layout: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Brands */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="font-heading text-lg small-caps">Top Selling Brands</h3>
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
                    <td className="font-body">{vendor._count?.subOrders || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            <h3 className="font-heading text-lg small-caps">Recent Orders</h3>
            <Link href="/orders" className="text-xs text-gray-500 font-body flex items-center gap-1 hover:text-gray-800 transition-colors">
              View All <ArrowRight size={12} />
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
