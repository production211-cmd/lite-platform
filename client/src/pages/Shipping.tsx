import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, StatusBadge, Pagination } from "@/components/ui-components";
import { Truck, Search, Package, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react";

export default function Shipping() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [carrierFilter, setCarrierFilter] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (statusFilter) params.status = statusFilter;
        if (carrierFilter) params.carrier = carrierFilter;
        const [data, s] = await Promise.all([
          api.getShipments(params),
          api.getShipmentStats(),
        ]);
        setShipments(data.shipments);
        setTotal(data.total);
        setStats(s);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [page, statusFilter, carrierFilter]);

  return (
    <div>
      <TopBar title="Shipping" subtitle={`${total} shipments`} />

      <div className="p-6 space-y-6 animate-fade-in">
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard title="Total Shipments" value={stats?.total || 0} format="number" icon={Truck} iconColor="text-blue-600" />
          <KPICard title="Label Created" value={stats?.labelCreated || 0} format="number" icon={Package} iconColor="text-indigo-600" />
          <KPICard title="In Transit" value={stats?.inTransit || 0} format="number" icon={Clock} iconColor="text-cyan-600" />
          <KPICard title="Delivered" value={stats?.delivered || 0} format="number" icon={CheckCircle} iconColor="text-emerald-600" />
          <KPICard title="Total Cost" value={stats?.totalCost || 0} format="currency" icon={DollarSign} iconColor="text-amber-600" />
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="LABEL_CREATED">Label Created</option>
            <option value="PICKED_UP">Picked Up</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="EXCEPTION">Exception</option>
          </select>

          <select
            value={carrierFilter}
            onChange={(e) => { setCarrierFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Carriers</option>
            <option value="FEDEX">FedEx</option>
            <option value="DHL">DHL</option>
            <option value="UPS">UPS</option>
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Tracking #</th>
                  <th>Order</th>
                  <th>Vendor</th>
                  <th>Carrier</th>
                  <th>Model</th>
                  <th>Leg</th>
                  <th>Cost</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {shipments.map((s) => (
                  <tr key={s.id} className="cursor-pointer">
                    <td className="font-mono text-xs font-medium">{s.trackingNumber}</td>
                    <td className="text-xs text-[#c8a45c]">{s.subOrder?.order?.orderNumber || "—"}</td>
                    <td className="text-xs">{s.vendor?.name}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded",
                        s.carrier === "FEDEX" ? "bg-purple-50 text-purple-700" :
                        s.carrier === "DHL" ? "bg-yellow-50 text-yellow-700" :
                        "bg-amber-50 text-amber-700"
                      )}>
                        {s.carrier}
                      </span>
                    </td>
                    <td className="text-xs">{s.shippingModel}</td>
                    <td className="text-xs">{s.leg}</td>
                    <td className="text-xs font-medium">{formatCurrency(s.shippingCost || 0, s.costCurrency)}</td>
                    <td><StatusBadge status={s.status} size="xs" /></td>
                    <td className="text-xs text-slate-500">{timeAgo(s.createdAt)}</td>
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
