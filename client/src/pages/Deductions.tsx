import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { StatusBadge } from "@/components/ui-components";
import { MinusCircle, RotateCcw, AlertTriangle, DollarSign } from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters, ExportButton,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const FILTER_CONFIGS: FilterConfig[] = [
  {
    key: "type",
    label: "Type",
    type: "multi-select",
    options: [
      { value: "RETURN", label: "Returns" },
      { value: "CHARGEBACK", label: "Chargebacks" },
      { value: "PENALTY", label: "Penalties" },
      { value: "ADJUSTMENT", label: "Adjustments" },
    ],
  },
  {
    key: "vendorName",
    label: "Vendor",
    type: "multi-select",
    options: [],
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    options: [
      { value: "APPLIED", label: "Applied" },
      { value: "PENDING", label: "Pending" },
      { value: "REVERSED", label: "Reversed" },
    ],
  },
];

export default function Deductions() {
  const [deductions, setDeductions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDeductions({ page: "1", limit: "500" }).then((data: any) => {
      setDeductions(data.deductions || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const normalized = useMemo(() =>
    deductions.map((d) => ({
      ...d,
      vendorName: d.vendor?.name || "Unknown",
      amount: d.amount || 0,
      date: d.createdAt || "",
    })),
  [deductions]);

  const dynamicFilterConfigs = useMemo(() => {
    const vendors = [...new Set(normalized.map((d) => d.vendorName).filter(Boolean))];
    return FILTER_CONFIGS.map((f) => {
      if (f.key === "vendorName") return { ...f, options: vendors.map((v) => ({ value: v, label: v })) };
      return f;
    });
  }, [normalized]);

  const grid = useDataGrid({
    data: normalized,
    searchKeys: ["vendorName", "reason", "type"],
    defaultSort: { key: "date", direction: "desc" },
    defaultLimit: 25,
  });

  const typeIcon = (type: string) => {
    switch (type) {
      case "RETURN": return <RotateCcw size={14} className="text-amber-600" />;
      case "CHARGEBACK": return <AlertTriangle size={14} className="text-red-600" />;
      case "PENALTY": return <MinusCircle size={14} className="text-rose-600" />;
      default: return <DollarSign size={14} className="text-slate-400" />;
    }
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "RETURN": return "bg-amber-50 text-amber-700";
      case "CHARGEBACK": return "bg-red-50 text-red-700";
      case "PENALTY": return "bg-rose-50 text-rose-700";
      default: return "bg-slate-50 text-slate-700";
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (d) => (
        <div className="flex items-center gap-2">
          {typeIcon(d.type)}
          <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", typeColor(d.type))}>{d.type}</span>
        </div>
      ),
    },
    { key: "vendorName", label: "Vendor", sortable: true, render: (d) => <span className="text-xs">{d.vendorName}</span> },
    { key: "reason", label: "Reason", sortable: true, render: (d) => <span className="text-xs max-w-[200px] truncate block">{d.reason || "—"}</span> },
    { key: "amount", label: "Amount", sortable: true, align: "right", render: (d) => <span className="text-xs font-bold text-red-600">-{formatCurrency(d.amount, d.currency)}</span> },
    { key: "currency", label: "Currency", render: (d) => <span className="text-xs">{d.currency}</span> },
    { key: "status", label: "Status", sortable: true, render: (d) => <StatusBadge status={d.status || "APPLIED"} size="xs" /> },
    { key: "date", label: "Date", sortable: true, render: (d) => <span className="text-xs text-slate-500">{timeAgo(d.date)}</span> },
  ];

  return (
    <div>
      <TopBar title="Deductions" subtitle={`${normalized.length} deduction records`} />
      <div className="p-6 space-y-5 page-enter">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-soft card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><RotateCcw size={20} className="text-amber-600" /></div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(normalized.filter(d => d.type === "RETURN").reduce((s, d) => s + d.amount, 0))}</p>
                <p className="text-xs text-slate-500">Return Deductions</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-soft card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center"><AlertTriangle size={20} className="text-red-600" /></div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(normalized.filter(d => d.type === "CHARGEBACK").reduce((s, d) => s + d.amount, 0))}</p>
                <p className="text-xs text-slate-500">Chargebacks</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-soft card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center"><MinusCircle size={20} className="text-rose-600" /></div>
              <div>
                <p className="text-lg font-bold">{formatCurrency(normalized.filter(d => d.type === "PENALTY").reduce((s, d) => s + d.amount, 0))}</p>
                <p className="text-xs text-slate-500">Penalties</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={grid.search} onChange={grid.setSearch} placeholder="Search by vendor, reason, type..." className="flex-1 min-w-[250px]" />
          {dynamicFilterConfigs.map((fc) => (
            <FilterDropdown key={fc.key} label={fc.label} options={fc.options || []} value={grid.filters[fc.key] || (fc.type === "multi-select" ? [] : "")} onChange={(val) => grid.setFilter(fc.key, val)} multi={fc.type === "multi-select"} />
          ))}
          <ExportButton onClick={() => alert("Export feature coming soon")} />
        </div>

        <ActiveFilters filters={grid.filters} filterConfigs={dynamicFilterConfigs} search={grid.search} onRemoveFilter={(key) => grid.setFilter(key, key === "type" || key === "vendorName" ? [] : "")} onClearSearch={() => grid.setSearch("")} onClearAll={grid.clearFilters} />

        <DataGrid columns={columns} data={grid.paginated} sort={grid.sort} onSort={grid.toggleSort} isLoading={loading} emptyMessage="No deductions found" emptyIcon={MinusCircle} />

        <PaginationBar page={grid.page} totalPages={grid.totalPages} totalItems={grid.totalFiltered} limit={grid.limit} onPageChange={grid.setPage} onLimitChange={grid.setLimit} />
      </div>
    </div>
  );
}
