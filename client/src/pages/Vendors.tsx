import { useEffect, useState } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, formatNumber, cn } from "@/lib/utils";
import { TopBar } from "@/components/TopBar";
import { KPICard, Pagination } from "@/components/ui-components";
import {
  Store, Search, Filter, Grid3X3, List, MapPin, Globe,
  Package, ShoppingCart, TrendingUp, ExternalLink, Plus,
} from "lucide-react";

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [filterLocation, setFilterLocation] = useState("");
  const [filterModel, setFilterModel] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const params: Record<string, string> = { page: String(page), limit: "20" };
        if (search) params.search = search;
        if (filterLocation) params.location = filterLocation;
        if (filterModel) params.economicModel = filterModel;
        const data = await api.getVendors(params);
        setVendors(data.vendors);
        setTotal(data.total);
      } catch (err) {
        console.error(err);
      }
      setLoading(false);
    }
    load();
  }, [page, search, filterLocation, filterModel]);

  const domestic = vendors.filter((v) => v.location === "DOMESTIC_US").length;
  const international = vendors.filter((v) => v.location === "INTERNATIONAL").length;
  const marketplace = vendors.filter((v) => v.economicModel === "MARKETPLACE").length;
  const wholesale = vendors.filter((v) => v.economicModel === "WHOLESALE").length;

  return (
    <div>
      <TopBar
        title="Vendors"
        subtitle={`${total} vendors registered`}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors">
            <Plus size={16} />
            Add Vendor
          </button>
        }
      />

      <div className="p-6 space-y-6 animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard title="Total Vendors" value={total} format="number" icon={Store} iconColor="text-violet-600" />
          <KPICard title="Domestic (US)" value={domestic} format="number" icon={MapPin} iconColor="text-blue-600" />
          <KPICard title="International" value={international} format="number" icon={Globe} iconColor="text-emerald-600" />
          <KPICard title="Marketplace / Wholesale" value={`${marketplace} / ${wholesale}`} icon={TrendingUp} iconColor="text-amber-600" />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search vendors..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
            />
          </div>

          <select
            value={filterLocation}
            onChange={(e) => { setFilterLocation(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Locations</option>
            <option value="DOMESTIC_US">Domestic (US)</option>
            <option value="INTERNATIONAL">International</option>
          </select>

          <select
            value={filterModel}
            onChange={(e) => { setFilterModel(e.target.value); setPage(1); }}
            className="px-3 py-2 border border-[var(--border)] rounded-lg text-sm bg-white"
          >
            <option value="">All Models</option>
            <option value="MARKETPLACE">Marketplace</option>
            <option value="WHOLESALE">Wholesale</option>
          </select>

          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-auto">
            <button
              onClick={() => setView("grid")}
              className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-slate-500")}
            >
              <Grid3X3 size={16} />
            </button>
            <button
              onClick={() => setView("list")}
              className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-slate-500")}
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {/* Vendor Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin" />
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {vendors.map((vendor) => (
              <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
                <div className="bg-white rounded-xl border border-[var(--border)] p-5 card-hover cursor-pointer">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0">
                      {vendor.logoUrl ? (
                        <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-400">
                          {vendor.name[0]}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm truncate">{vendor.name}</h3>
                      <div className="flex items-center gap-1 mt-0.5">
                        <MapPin size={10} className="text-slate-400" />
                        <span className="text-[11px] text-slate-500">
                          {vendor.city ? `${vendor.city}, ` : ""}{vendor.country || "—"}
                        </span>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-full",
                      vendor.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                    )}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold">{vendor._count?.products || 0}</p>
                      <p className="text-[10px] text-slate-500">Products</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-2.5 text-center">
                      <p className="text-lg font-bold">{vendor._count?.vendorOrders || 0}</p>
                      <p className="text-[10px] text-slate-500">Orders</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full font-medium",
                      vendor.economicModel === "MARKETPLACE"
                        ? "bg-blue-50 text-blue-700"
                        : "bg-purple-50 text-purple-700"
                    )}>
                      {vendor.economicModel}
                    </span>
                    <span className="text-slate-500">
                      {vendor.commissionRate ? `${vendor.commissionRate}% comm.` : "Wholesale"}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[var(--border)] overflow-hidden">
            <table className="w-full data-table">
              <thead>
                <tr className="bg-slate-50/80">
                  <th>Vendor</th>
                  <th>Location</th>
                  <th>Model</th>
                  <th>Integration</th>
                  <th>Commission</th>
                  <th>Products</th>
                  <th>Orders</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.id} className="cursor-pointer">
                    <td>
                      <Link href={`/vendors/${vendor.id}`} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0">
                          {vendor.logoUrl ? (
                            <img src={vendor.logoUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400">{vendor.name[0]}</div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{vendor.name}</p>
                          <p className="text-[10px] text-slate-500">{vendor.slug}</p>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="text-xs">{vendor.city || vendor.country}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-medium",
                        vendor.economicModel === "MARKETPLACE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                      )}>
                        {vendor.economicModel}
                      </span>
                    </td>
                    <td className="text-xs">{vendor.integrationType}</td>
                    <td className="text-xs">{vendor.commissionRate ? `${vendor.commissionRate}%` : "—"}</td>
                    <td className="text-xs font-medium">{vendor._count?.products || 0}</td>
                    <td className="text-xs font-medium">{vendor._count?.vendorOrders || 0}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] font-medium px-2 py-0.5 rounded-full",
                        vendor.isActive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
                      )}>
                        {vendor.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
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
