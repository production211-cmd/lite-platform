import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, formatDate, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge, Pagination } from "@/components/ui-components";
import {
  ShoppingCart, Search, DollarSign, Clock, Truck,
  CheckCircle, XCircle, AlertTriangle, Download,
} from "lucide-react";

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (search) params.search = search;
        if (statusFilter) params.status = statusFilter;
        const [data, s] = await Promise.all([
          api.getOrders(params),
          api.getOrderStats(),
        ]);
        setOrders(data.orders);
        setTotal(data.total);
        setStats(s);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [page, search, statusFilter]);

  return (
    <div>
      <TopBar
        title="Orders"
        subtitle={`${total} total orders`}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 border border-[var(--border)] text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
            <Download size={16} />
            Export
          </button>
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Revenue" value={stats?.totalRevenue || 0} format="currency" icon={DollarSign} iconColor="text-emerald-600" />
          <KPICard title="Total Orders" value={stats?.total || 0} format="number" icon={ShoppingCart} iconColor="text-blue-600" />
          <KPICard title="Delivered" value={stats?.delivered || 0} format="number" icon={CheckCircle} iconColor="text-emerald-600" />
          <KPICard title="In Transit" value={stats?.inTransit || 0} format="number" icon={Truck} iconColor="text-cyan-600" />
        </div>

        {/* Pipeline */}
        <div className="bg-white rounded-xl border border-[var(--border)] p-5">
          <h3 className="font-semibold text-sm mb-4">Order Pipeline</h3>
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {[
              { label: "Placed", value: stats?.placed || 0, color: "bg-blue-500" },
              { label: "Fraud Hold", value: stats?.fraudHold || 0, color: "bg-red-500" },
              { label: "Pending Accept", value: stats?.pendingAccept || 0, color: "bg-amber-500" },
              { label: "Shipped", value: stats?.shipped || 0, color: "bg-cyan-500" },
              { label: "In Transit", value: stats?.inTransit || 0, color: "bg-indigo-500" },
              { label: "Delivered", value: stats?.delivered || 0, color: "bg-emerald-500" },
              { label: "Cancelled", value: stats?.cancelled || 0, color: "bg-slate-400" },
            ].map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2">
                <div className="text-center min-w-[100px]">
                  <div className={cn("w-full h-1.5 rounded-full mb-2", stage.color)} />
                  <p className="text-lg font-bold">{stage.value}</p>
                  <p className="text-[10px] text-slate-500">{stage.label}</p>
                </div>
                {i < 6 && <span className="text-slate-300 text-lg">→</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search order #, customer..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="PLACED">Placed</option>
            <option value="FRAUD_HOLD">Fraud Hold</option>
            <option value="VENDOR_ACCEPT">Vendor Accepted</option>
            <option value="SHIPPED">Shipped</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        {/* Orders Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Vendor(s)</th>
                  <th>Items</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="cursor-pointer">
                    <td className="font-medium text-[#c8a45c]">{order.orderNumber}</td>
                    <td>
                      <div>
                        <p className="text-sm">{order.customerName}</p>
                        <p className="text-[10px] text-slate-500">{order.customerEmail}</p>
                      </div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {order.subOrders?.map((so: any) => (
                          <span key={so.id} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-medium">
                            {so.vendor?.name}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-xs text-center">
                      {order.subOrders?.reduce((acc: number, so: any) => acc + (so.items?.length || 0), 0) || 0}
                    </td>
                    <td className="font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td><StatusBadge status={order.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(order.placedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination page={page} total={total} limit={20} onPageChange={setPage} />
      </div>
    </div>
  );
}
