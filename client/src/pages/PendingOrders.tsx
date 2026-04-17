import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "vendorName",
    label: "Vendor",
    type: "multi-select",
    options: [],
  },
  {
    key: "sla",
    label: "SLA Status",
    type: "select",
    options: [
      { value: "overdue", label: "Overdue (>24h)" },
      { value: "ok", label: "Within SLA" },
    ],
  },
];

export default function PendingOrders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.getPendingAcceptance({ page: "1", limit: "500" });
      setOrders(data.orders || []);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleAccept = async (vendorOrderId: string) => {
    setActionLoading(vendorOrderId);
    try { await api.acceptOrder(vendorOrderId); load(); } catch (err) { console.error("Accept failed:", err); }
    setActionLoading(null);
  };

  const handleReject = async (vendorOrderId: string) => {
    setActionLoading(vendorOrderId);
    try { await api.rejectOrder(vendorOrderId); load(); } catch (err) { console.error("Reject failed:", err); }
    setActionLoading(null);
  };

  const normalized = useMemo(() =>
    orders.map((o) => {
      const hours = (Date.now() - new Date(o.createdAt).getTime()) / 3600000;
      return {
        ...o,
        vendorName: o.vendor?.name || "Unknown",
        orderNumber: o.order?.orderNumber || "—",
        itemCount: o.items?.length || 0,
        amount: o.vendorTotal || 0,
        hours,
        overdue: hours > 24,
        sla: hours > 24 ? "overdue" : "ok",
        date: o.createdAt || "",
      };
    }),
  [orders]);

  const dynamicFilterConfigs = useMemo(() => {
    const vendors = [...new Set(normalized.map((o) => o.vendorName).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: normalized,
    searchKeys: ["orderNumber", "vendorName"],
    defaultSort: { key: "hours", direction: "desc" },
    defaultLimit: 25,
  });

  const columns: ColumnDef<any>[] = [
    { key: "orderNumber", label: "Order #", sortable: true, render: (o) => <span className="font-medium text-[#c8a45c] text-xs">{o.orderNumber}</span> },
    { key: "vendorName", label: "Vendor", sortable: true, render: (o) => <span className="text-xs">{o.vendorName}</span> },
    { key: "itemCount", label: "Items", sortable: true, align: "center", render: (o) => <span className="text-xs">{o.itemCount}</span> },
    { key: "amount", label: "Amount", sortable: true, align: "right", render: (o) => <span className="text-xs font-medium">{formatCurrency(o.amount)}</span> },
    { key: "hours", label: "Waiting Since", sortable: true, render: (o) => <span className="text-xs text-slate-500">{timeAgo(o.date)}</span> },
    {
      key: "sla",
      label: "SLA",
      sortable: true,
      render: (o) => (
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", o.overdue ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700")}>
          {o.overdue ? `${Math.round(o.hours)}h — OVERDUE` : `${Math.round(o.hours)}h`}
        </span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      align: "center",
      width: "180px",
      render: (o) => (
        <div className="flex items-center justify-center gap-2">
          <button onClick={() => handleAccept(o.id)} disabled={actionLoading === o.id} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-[11px] font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50">
            <CheckCircle size={12} /> Accept
          </button>
          <button onClick={() => handleReject(o.id)} disabled={actionLoading === o.id} className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white text-[11px] font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50">
            <XCircle size={12} /> Reject
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <TopBar title="Pending Acceptance" subtitle={`${normalized.length} orders awaiting vendor confirmation`} />
      <div className="p-6 space-y-5 page-enter">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 text-center shadow-soft card-hover">
            <Clock size={24} className="mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-bold">{normalized.length}</p>
            <p className="text-xs text-slate-500 mt-1">Awaiting Response</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 text-center shadow-soft card-hover">
            <AlertTriangle size={24} className="mx-auto text-red-500 mb-2" />
            <p className="text-2xl font-bold">{normalized.filter((o) => o.overdue).length}</p>
            <p className="text-xs text-slate-500 mt-1">Overdue (&gt;24h)</p>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 text-center shadow-soft card-hover">
            <p className="text-2xl font-bold">{formatCurrency(normalized.reduce((sum, o) => sum + o.amount, 0))}</p>
            <p className="text-xs text-slate-500 mt-1">Total Value at Risk</p>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={grid.search} onChange={grid.setSearch} placeholder="Search by order #, vendor..." className="flex-1 min-w-[250px]" />
          {dynamicFilterConfigs.map((fc) => (
            <FilterDropdown key={fc.key} label={fc.label} options={fc.options || []} value={grid.filters[fc.key] || (fc.type === "multi-select" ? [] : "")} onChange={(val) => grid.setFilter(fc.key, val)} multi={fc.type === "multi-select"} />
          ))}
        </div>

        <ActiveFilters filters={grid.filters} filterConfigs={dynamicFilterConfigs} search={grid.search} onRemoveFilter={(key) => grid.setFilter(key, key === "vendorName" ? [] : "")} onClearSearch={() => grid.setSearch("")} onClearAll={grid.clearFilters} />

        <DataGrid columns={columns} data={grid.paginated} sort={grid.sort} onSort={grid.toggleSort} isLoading={loading} emptyMessage="All clear — no orders pending acceptance" emptyIcon={CheckCircle} rowClassName={(o) => o.overdue ? "bg-red-50/50" : ""} />

        <PaginationBar page={grid.page} totalPages={grid.totalPages} totalItems={grid.totalFiltered} limit={grid.limit} onPageChange={grid.setPage} onLimitChange={grid.setLimit} />
      </div>
    </div>
  );
}
