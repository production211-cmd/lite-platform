import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { Wallet, TrendingUp, ArrowUpRight } from "lucide-react";
import {
  useDataGrid, SearchBar, FilterDropdown, PaginationBar,
  DataGrid, ActiveFilters, ExportButton,
  type ColumnDef, type FilterConfig,
} from "@/components/DataGrid";

const FILTER_CONFIGS: FilterConfig[] = [
  { key: "economicModel", label: "Model", type: "select", options: [
    { value: "MARKETPLACE", label: "Marketplace" },
    { value: "WHOLESALE", label: "Wholesale" },
  ]},
  { key: "payoutCycle", label: "Payout Cycle", type: "select", options: [
    { value: "WEEKLY", label: "Weekly" },
    { value: "BIWEEKLY", label: "Biweekly" },
    { value: "MONTHLY", label: "Monthly" },
  ]},
  { key: "balanceStatus", label: "Balance Status", type: "select", options: [
    { value: "due", label: "Payout Due (>$1,000)" },
    { value: "current", label: "Current" },
  ]},
];

export default function VendorBalances() {
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getVendorBalances().then((data: any) => {
      setBalances(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const normalized = useMemo(() =>
    balances.map((b) => ({
      ...b,
      balance: b.balance || 0,
      totalEarned: b.totalEarned || 0,
      balanceStatus: (b.balance || 0) > 1000 ? "due" : "current",
    })),
  [balances]);

  const grid = useDataGrid({
    data: normalized,
    searchKeys: ["name", "economicModel"],
    defaultSort: { key: "balance", direction: "desc" },
    defaultLimit: 25,
  });

  const totalOutstanding = normalized.reduce((s, b) => s + b.balance, 0);
  const totalEarned = normalized.reduce((s, b) => s + b.totalEarned, 0);

  const columns: ColumnDef<any>[] = [
    {
      key: "name",
      label: "Vendor",
      sortable: true,
      render: (b) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-400">{b.name?.[0] || "?"}</div>
          <div>
            <p className="text-sm font-medium">{b.name}</p>
            <p className="text-[10px] text-slate-500">{b.economicModel}</p>
          </div>
        </div>
      ),
    },
    { key: "payoutCycle", label: "Payout Cycle", sortable: true, render: (b) => <span className="text-xs">{b.payoutCycle || "BIWEEKLY"}</span> },
    { key: "currency", label: "Currency", render: (b) => <span className="text-xs">{b.currency || "USD"}</span> },
    { key: "totalEarned", label: "Total Earned", sortable: true, align: "right", render: (b) => <span className="text-xs">{formatCurrency(b.totalEarned, b.currency)}</span> },
    {
      key: "balance",
      label: "Outstanding Balance",
      sortable: true,
      align: "right",
      render: (b) => (
        <span className={cn("text-sm font-bold", b.balance > 0 ? "text-amber-600" : "text-emerald-600")}>
          {formatCurrency(b.balance, b.currency)}
        </span>
      ),
    },
    {
      key: "balanceStatus",
      label: "Status",
      sortable: true,
      render: (b) => (
        <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-full", b.balance > 1000 ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700")}>
          {b.balance > 1000 ? "Payout Due" : "Current"}
        </span>
      ),
    },
  ];

  return (
    <div>
      <TopBar title="Vendor Balances" subtitle={`${normalized.length} active vendors`} />
      <div className="p-6 space-y-5 page-enter">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-soft card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Wallet size={20} className="text-blue-600" /></div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalOutstanding)}</p>
                <p className="text-xs text-slate-500">Total Outstanding</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-soft card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><TrendingUp size={20} className="text-emerald-600" /></div>
              <div>
                <p className="text-xl font-bold">{formatCurrency(totalEarned)}</p>
                <p className="text-xs text-slate-500">Total Earned (All Time)</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl border border-[var(--border)] p-5 shadow-soft card-hover">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center"><ArrowUpRight size={20} className="text-violet-600" /></div>
              <div>
                <p className="text-xl font-bold">{normalized.length}</p>
                <p className="text-xs text-slate-500">Active Vendors</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <SearchBar value={grid.search} onChange={grid.setSearch} placeholder="Search vendors..." className="flex-1 min-w-[250px]" />
          {FILTER_CONFIGS.map((fc) => (
            <FilterDropdown key={fc.key} label={fc.label} options={fc.options || []} value={grid.filters[fc.key] || ""} onChange={(val) => grid.setFilter(fc.key, val)} />
          ))}
          <ExportButton onClick={() => alert("Export feature coming soon")} />
        </div>

        <ActiveFilters filters={grid.filters} filterConfigs={FILTER_CONFIGS} search={grid.search} onRemoveFilter={(key) => grid.setFilter(key, "")} onClearSearch={() => grid.setSearch("")} onClearAll={grid.clearFilters} />

        <DataGrid columns={columns} data={grid.paginated} sort={grid.sort} onSort={grid.toggleSort} isLoading={loading} emptyMessage="No vendor balances found" emptyIcon={Wallet} />

        <PaginationBar page={grid.page} totalPages={grid.totalPages} totalItems={grid.totalFiltered} limit={grid.limit} onPageChange={grid.setPage} onLimitChange={grid.setLimit} />
      </div>
    </div>
  );
}
