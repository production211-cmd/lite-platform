import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, formatDate, timeAgo } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge, DataTable } from "@/components/ui-components";
import {
  ShoppingCart, Package, Store, DollarSign, Truck, RotateCcw,
  MessageSquare, AlertTriangle, Clock, TrendingUp, ArrowRight,
  Calendar,
} from "lucide-react";

export default function Dashboard() {
  const [kpis, setKpis] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [topVendors, setTopVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
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
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-4">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const actionItems = kpis?.actionRequired || {};

  return (
    <div>
      <TopBar
        title="Dashboard"
        subtitle="LITE Marketplace Overview"
        actions={
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Calendar size={14} />
            <span>Last 30 days</span>
          </div>
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Revenue"
            value={kpis?.totalRevenue || 0}
            format="currency"
            icon={DollarSign}
            iconColor="text-emerald-600"
            change={12.5}
            changeLabel="vs last month"
          />
          <KPICard
            title="Total Orders"
            value={kpis?.totalOrders || 0}
            format="number"
            icon={ShoppingCart}
            iconColor="text-blue-600"
            change={8.2}
            changeLabel="vs last month"
          />
          <KPICard
            title="Active Vendors"
            value={`${kpis?.activeVendors || 0} / ${kpis?.totalVendors || 0}`}
            icon={Store}
            iconColor="text-violet-600"
          />
          <KPICard
            title="Commission Earned"
            value={kpis?.totalCommissions || 0}
            format="currency"
            icon={TrendingUp}
            iconColor="text-amber-600"
            change={15.3}
            changeLabel="vs last month"
          />
        </div>

        {/* Second row KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            title="Total Products"
            value={kpis?.totalProducts || 0}
            format="number"
            icon={Package}
            iconColor="text-indigo-600"
          />
          <KPICard
            title="Pending Review"
            value={kpis?.pendingReview || 0}
            format="number"
            icon={Clock}
            iconColor="text-orange-600"
          />
          <KPICard
            title="Total Shipments"
            value={kpis?.totalShipments || 0}
            format="number"
            icon={Truck}
            iconColor="text-cyan-600"
          />
          <KPICard
            title="Total Returns"
            value={kpis?.totalReturns || 0}
            format="number"
            icon={RotateCcw}
            iconColor="text-rose-600"
          />
        </div>

        {/* Action Required */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle size={18} className="text-amber-500" />
            <h3 className="font-semibold text-[var(--foreground)]">Action Required</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {[
              { label: "Fraud Hold", value: actionItems.fraudHold, href: "/orders", color: "bg-red-50 text-red-700 border-red-200" },
              { label: "Pending Accept", value: actionItems.pendingAcceptance, href: "/orders/pending", color: "bg-amber-50 text-amber-700 border-amber-200" },
              { label: "Pending Ship", value: actionItems.pendingShipment, href: "/shipping", color: "bg-orange-50 text-orange-700 border-orange-200" },
              { label: "In Transit", value: actionItems.inTransit, href: "/shipping", color: "bg-blue-50 text-blue-700 border-blue-200" },
              { label: "Exceptions", value: actionItems.exceptions, href: "/shipping", color: "bg-red-50 text-red-700 border-red-200" },
              { label: "Open Messages", value: actionItems.openMessages, href: "/messages", color: "bg-violet-50 text-violet-700 border-violet-200" },
              { label: "Pending Payouts", value: actionItems.pendingPayouts, href: "/finance/payouts", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
            ].map((item) => (
              <Link key={item.label} href={item.href}>
                <div className={`rounded-lg border p-3 text-center cursor-pointer hover:shadow-sm transition-shadow ${item.color}`}>
                  <p className="text-2xl font-bold">{item.value || 0}</p>
                  <p className="text-[11px] font-medium mt-1">{item.label}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Two column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Orders */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="font-semibold">Recent Orders</h3>
              <Link href="/orders" className="text-xs text-[#c8a45c] font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th>Order</th>
                    <th>Customer</th>
                    <th>Vendor(s)</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 8).map((order: any) => (
                    <tr key={order.id}>
                      <td className="font-medium text-[#c8a45c]">{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {order.subOrders?.map((so: any) => (
                            <span key={so.id} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                              {so.vendor?.name}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td><StatusBadge status={order.status} size="xs" /></td>
                      <td className="text-slate-500">{timeAgo(order.placedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top Vendors */}
          <div className="bg-white rounded-xl border border-[var(--border)]">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="font-semibold">Top Vendors</h3>
              <Link href="/vendors" className="text-xs text-[#c8a45c] font-medium flex items-center gap-1 hover:underline">
                View all <ArrowRight size={12} />
              </Link>
            </div>
            <div className="divide-y divide-[var(--border)]">
              {topVendors.slice(0, 8).map((vendor: any, i: number) => (
                <div key={vendor.id} className="flex items-center gap-3 p-4 hover:bg-slate-50 transition-colors">
                  <span className="text-xs font-bold text-slate-400 w-5">{i + 1}</span>
                  <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                    {vendor.logoUrl ? (
                      <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-500">
                        {vendor.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{vendor.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {vendor._count?.products || 0} products · {vendor.location === "DOMESTIC_US" ? "US" : vendor.country}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatCurrency(vendor.totalRevenue)}</p>
                    <p className="text-[10px] text-slate-500">{vendor._count?.subOrders || 0} orders</p>
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
