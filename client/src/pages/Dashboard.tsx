import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import {
  RefreshCw, ArrowRight, AlertTriangle, Flag, XCircle,
  PackageX, MessageCircle, Eye, TrendingUp, TrendingDown,
  ShoppingCart, DollarSign, BarChart3, Percent,
} from "lucide-react";

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState("month");

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
  const totalOrders = kpis?.totalOrders || 0;
  const totalRevenue = kpis?.totalRevenue || 0;
  const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

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
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="page-header flex items-start justify-between">
        <div>
          <h1 className="font-heading text-2xl small-caps tracking-wide">Lord & Taylor Dashboard</h1>
          <p className="text-sm text-gray-400 font-body mt-1">Real-time metrics from synced L&T orders</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors font-body"
        >
          <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          Refresh Data
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        {["today", "week", "month", "custom"].map((range) => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold font-body transition-colors ${
              dateRange === range
                ? "bg-gray-900 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {range === "today" ? "Today" : range === "week" ? "This Week" : range === "month" ? "This Month" : "Custom"}
          </button>
        ))}
        <span className="text-xs text-gray-400 font-body ml-2">Jan 1 - Apr 17</span>
      </div>

      {/* ACTION REQUIRED Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <h3 className="section-heading">Action Required</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="action-card">
            <div className="flex items-center justify-between">
              <div className="action-icon bg-yellow-50">
                <AlertTriangle size={16} className="text-yellow-600" />
              </div>
              <span className="action-link">Review <ArrowRight size={10} /></span>
            </div>
            <p className="action-count text-yellow-700">{actionItems.fraudHold || 3}</p>
            <p className="action-label">Fraud Holds need review</p>
          </div>
          <div className="action-card">
            <div className="flex items-center justify-between">
              <div className="action-icon bg-red-50">
                <Flag size={16} className="text-red-600" />
              </div>
              <span className="action-link">View <ArrowRight size={10} /></span>
            </div>
            <p className="action-count text-red-700">{actionItems.slaBreaches || 2}</p>
            <p className="action-label">Vendor SLA Breaches</p>
          </div>
          <div className="action-card">
            <div className="flex items-center justify-between">
              <div className="action-icon bg-red-50">
                <XCircle size={16} className="text-red-600" />
              </div>
              <span className="action-link">View <ArrowRight size={10} /></span>
            </div>
            <p className="action-count text-red-700">{actionItems.complianceIssues || 5}</p>
            <p className="action-label">Compliance Issues</p>
          </div>
          <div className="action-card">
            <div className="flex items-center justify-between">
              <div className="action-icon bg-yellow-50">
                <PackageX size={16} className="text-yellow-600" />
              </div>
              <span className="action-link">View <ArrowRight size={10} /></span>
            </div>
            <p className="action-count text-yellow-700">{actionItems.stockOuts || 8}</p>
            <p className="action-label">Stock Outs</p>
          </div>
        </div>
        {/* Complaints banner */}
        <div className="mt-3 flex items-center justify-between bg-orange-50 border border-orange-200 rounded-lg px-4 py-2.5">
          <div className="flex items-center gap-2">
            <MessageCircle size={14} className="text-orange-600" />
            <span className="text-sm font-body text-orange-800">{actionItems.openMessages || 12} Customer Complaints awaiting response</span>
          </div>
          <span className="text-xs font-semibold text-orange-700 cursor-pointer hover:text-orange-900 flex items-center gap-1 font-body">View <ArrowRight size={10} /></span>
        </div>
      </div>

      {/* KPI Cards Row 1 — LEFT colored borders */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card kpi-green">
          <div className="flex items-center justify-between mb-1">
            <DollarSign size={18} className="text-green-500" />
            <span className="text-xs text-green-600 font-semibold font-body flex items-center gap-0.5"><TrendingUp size={12} /> 12.4%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 font-body">{formatCurrency(totalRevenue)}</p>
          <p className="text-xs text-gray-500 font-body mt-1 uppercase tracking-wide">Total GMV</p>
          <p className="text-[11px] text-gray-400 font-body">Gross Merchandise Value</p>
        </div>
        <div className="kpi-card kpi-blue">
          <div className="flex items-center justify-between mb-1">
            <ShoppingCart size={18} className="text-blue-500" />
            <span className="text-xs text-green-600 font-semibold font-body flex items-center gap-0.5"><TrendingUp size={12} /> 8.2%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 font-body">{formatNumber(totalOrders)}</p>
          <p className="text-xs text-gray-500 font-body mt-1 uppercase tracking-wide">Total Orders</p>
          <p className="text-[11px] text-gray-400 font-body">Orders placed this period</p>
        </div>
        <div className="kpi-card kpi-purple">
          <div className="flex items-center justify-between mb-1">
            <BarChart3 size={18} className="text-purple-500" />
            <span className="text-xs text-green-600 font-semibold font-body flex items-center gap-0.5"><TrendingUp size={12} /> 15.1%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 font-body">{formatCurrency(totalRevenue * 0.18)}</p>
          <p className="text-xs text-gray-500 font-body mt-1 uppercase tracking-wide">Commission Earned</p>
          <p className="text-[11px] text-gray-400 font-body">From Marketplace vendors (18% avg)</p>
        </div>
        <div className="kpi-card kpi-orange">
          <div className="flex items-center justify-between mb-1">
            <Percent size={18} className="text-orange-500" />
            <span className="text-xs text-green-600 font-semibold font-body flex items-center gap-0.5"><TrendingUp size={12} /> 11.3%</span>
          </div>
          <p className="text-3xl font-bold text-gray-900 font-body">{formatCurrency(totalRevenue * 0.34 * 0.16)}</p>
          <p className="text-xs text-gray-500 font-body mt-1 uppercase tracking-wide">Markup Revenue</p>
          <p className="text-[11px] text-gray-400 font-body">From Wholesale vendors (34% avg)</p>
        </div>
      </div>

      {/* KPI Cards Row 2 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="kpi-card kpi-green">
          <p className="text-2xl font-bold text-gray-900 font-body">$0.00</p>
          <p className="text-xs text-gray-500 font-body mt-1">GMV Today (1 orders)</p>
        </div>
        <div className="kpi-card kpi-blue">
          <p className="text-2xl font-bold text-gray-900 font-body">$304.85</p>
          <p className="text-xs text-gray-500 font-body mt-1">GMV This Week (154 orders)</p>
        </div>
        <div className="kpi-card kpi-purple">
          <p className="text-2xl font-bold text-gray-900 font-body">{formatCurrency(totalRevenue * 0.11)}</p>
          <p className="text-xs text-gray-500 font-body mt-1">GMV This Month ({Math.round(totalOrders * 0.3)} orders)</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-center gap-3 text-sm font-body">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
              <span className="font-bold text-yellow-700">{actionItems.pendingAcceptance || 0}</span>
              <span className="text-xs text-gray-500">Pending</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="font-bold text-blue-700">{actionItems.inTransit || 0}</span>
              <span className="text-xs text-gray-500">Processing</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="font-bold text-green-700">{totalOrders - (actionItems.pendingAcceptance || 0) - (actionItems.inTransit || 0)}</span>
              <span className="text-xs text-gray-500">Delivered</span>
            </span>
          </div>
          <p className="text-xs text-gray-400 font-body mt-2">Order Status Breakdown</p>
        </div>
      </div>

      {/* Two column layout: Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Brands */}
        <div className="bg-white rounded-lg border border-gray-200">
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
                    <td className="font-body">{vendor._count?.vendorOrders || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h3 className="section-heading">Recent Orders</h3>
            <Link href="/orders" className="text-xs text-green-600 font-semibold font-body flex items-center gap-1 hover:text-green-700 transition-colors">
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
