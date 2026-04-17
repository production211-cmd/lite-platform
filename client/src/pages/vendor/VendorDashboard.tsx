import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, timeAgo } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-components";
import {
  ShoppingCart, Package, DollarSign, Truck,
  TrendingUp, RefreshCw, ArrowRight, Clock,
} from "lucide-react";
import { Link } from "wouter";

export default function VendorDashboard() {
  const { user } = useAuth();
  const vendorId = user?.vendorId;
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any>(null);
  const [performance, setPerformance] = useState<any[]>([]);

  const load = async () => {
    if (!vendorId) return;
    setLoading(true);
    try {
      const [ordersData, productsData, perfData] = await Promise.all([
        api.getVendorOrders(vendorId, { limit: "5" }),
        api.getVendorProducts(vendorId, { limit: "1" }),
        api.getVendorPerformance(vendorId),
      ]);
      setOrders(ordersData.orders || []);
      setProducts(productsData);
      setPerformance(perfData || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, [vendorId]);

  const latestPerf = performance[0];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            Welcome back, {user?.firstName || "Vendor"}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {user?.vendorName} — Here's your latest performance snapshot
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <ShoppingCart size={20} className="text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{latestPerf?.orderCount || orders.length || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Active Orders</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(latestPerf?.revenue || 0)}</p>
          <p className="text-xs text-slate-500 mt-1">Revenue (This Period)</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <Package size={20} className="text-violet-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">{products?.total || 0}</p>
          <p className="text-xs text-slate-500 mt-1">Products Listed</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <TrendingUp size={20} className="text-amber-600" />
            </div>
          </div>
          <p className="text-2xl font-bold">
            {latestPerf?.fulfillmentRate ? `${(latestPerf.fulfillmentRate * 100).toFixed(0)}%` : "—"}
          </p>
          <p className="text-xs text-slate-500 mt-1">Fulfillment Rate</p>
        </div>
      </div>

      {/* Performance metrics */}
      {latestPerf && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-semibold text-sm mb-4">Performance Metrics</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-lg font-bold">{latestPerf.avgShipDays?.toFixed(1) || "—"}</p>
              <p className="text-[10px] text-slate-500">Avg Ship Days</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{latestPerf.returnRate ? `${(latestPerf.returnRate * 100).toFixed(1)}%` : "—"}</p>
              <p className="text-[10px] text-slate-500">Return Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{latestPerf.qualityScore?.toFixed(2) || "—"}</p>
              <p className="text-[10px] text-slate-500">Quality Score</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{latestPerf.lateShipRate ? `${(latestPerf.lateShipRate * 100).toFixed(1)}%` : "—"}</p>
              <p className="text-[10px] text-slate-500">Late Ship Rate</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{latestPerf.cancellationRate ? `${(latestPerf.cancellationRate * 100).toFixed(1)}%` : "—"}</p>
              <p className="text-[10px] text-slate-500">Cancel Rate</p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders */}
      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="font-semibold text-sm">Recent Orders</h3>
          <Link href="/vendor/orders" className="text-xs text-blue-600 flex items-center gap-1 hover:underline">
            View All <ArrowRight size={12} />
          </Link>
        </div>
        {orders.length === 0 ? (
          <div className="p-8 text-center">
            <Clock size={32} className="mx-auto text-slate-300 mb-2" />
            <p className="text-sm text-slate-500">No recent orders</p>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr className="bg-slate-50/80">
                <th>Order #</th>
                <th>Items</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o: any) => (
                <tr key={o.id}>
                  <td className="text-xs font-medium">{o.order?.orderNumber || "—"}</td>
                  <td className="text-xs text-center">{o.items?.length || 0}</td>
                  <td className="text-xs font-medium">{formatCurrency(o.vendorTotal || 0)}</td>
                  <td><StatusBadge status={o.status} size="xs" /></td>
                  <td className="text-xs text-slate-500">{timeAgo(o.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
