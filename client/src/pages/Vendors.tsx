import { useEffect, useState, useMemo } from "react";
import { Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  Store, Search, Grid3X3, List, MapPin, Globe, Eye,
  Package, ShoppingCart, Plus, ChevronLeft, ChevronRight,
} from "lucide-react";

const TABS = [
  { key: "all", label: "All Vendors" },
  { key: "MARKETPLACE", label: "Marketplace" },
  { key: "WHOLESALE", label: "Wholesale" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
];

export default function Vendors() {
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    api.getVendors().then((data: any) => {
      const list = Array.isArray(data) ? data : data?.vendors || [];
      setVendors(list);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = vendors;
    if (activeTab === "MARKETPLACE" || activeTab === "WHOLESALE") {
      result = result.filter((v) => v.economicModel === activeTab);
    } else if (activeTab === "active") {
      result = result.filter((v) => v.isActive);
    } else if (activeTab === "inactive") {
      result = result.filter((v) => !v.isActive);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((v) =>
        v.name?.toLowerCase().includes(q) ||
        v.slug?.toLowerCase().includes(q) ||
        v.city?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vendors, activeTab, search]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const tabCounts = useMemo(() => ({
    all: vendors.length,
    MARKETPLACE: vendors.filter((v) => v.economicModel === "MARKETPLACE").length,
    WHOLESALE: vendors.filter((v) => v.economicModel === "WHOLESALE").length,
    active: vendors.filter((v) => v.isActive).length,
    inactive: vendors.filter((v) => !v.isActive).length,
  }), [vendors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading vendors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div className="page-header">
          <h1>Vendors</h1>
          <p>Manage marketplace vendor partnerships</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors font-body">
          <Plus size={16} />
          Add Vendor
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="quick-stat card-hover">
          <p className="stat-number">{vendors.length}</p>
          <p className="stat-label">Total Vendors</p>
        </div>
        <div className="quick-stat card-hover">
          <p className="stat-number">{vendors.filter((v) => v.location === "DOMESTIC_US").length}</p>
          <p className="stat-label">Domestic (US)</p>
        </div>
        <div className="quick-stat card-hover">
          <p className="stat-number">{vendors.filter((v) => v.location === "INTERNATIONAL").length}</p>
          <p className="stat-label">International</p>
        </div>
        <div className="quick-stat card-hover">
          <p className="stat-number">{tabCounts.MARKETPLACE} / {tabCounts.WHOLESALE}</p>
          <p className="stat-label">Marketplace / Wholesale</p>
        </div>
      </div>

      {/* Search + Filters + View Toggle */}
      <div className="flex items-center gap-3">
        <div className="search-bar flex-1">
          <Search size={16} className="text-gray-400 flex-shrink-0" />
          <input
            type="text"
            placeholder="Search vendors by name, city..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
          <button
            onClick={() => setView("grid")}
            className={cn("p-2 rounded-md transition-colors", view === "grid" ? "bg-white shadow-sm" : "text-gray-500")}
          >
            <Grid3X3 size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={cn("p-2 rounded-md transition-colors", view === "list" ? "bg-white shadow-sm" : "text-gray-500")}
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`tab-item ${activeTab === tab.key ? "active" : ""}`}
          >
            {tab.label} ({tabCounts[tab.key as keyof typeof tabCounts] || 0})
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500 font-body">
        Showing {Math.min(((page - 1) * perPage) + 1, filtered.length)}-{Math.min(page * perPage, filtered.length)} of {filtered.length} vendors
      </div>

      {/* Vendor Grid */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((vendor) => (
            <Link key={vendor.id} href={`/vendors/${vendor.id}`}>
              <div className="bg-white rounded-lg border border-gray-200 p-5 card-hover cursor-pointer">
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                    {vendor.logoUrl ? (
                      <img src={vendor.logoUrl} alt={vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg font-bold text-gray-400">{vendor.name?.[0]}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm font-body truncate">{vendor.name}</h3>
                    <div className="flex items-center gap-1 mt-0.5">
                      <MapPin size={10} className="text-gray-400" />
                      <span className="text-[11px] text-gray-500 font-body">
                        {vendor.city ? `${vendor.city}, ` : ""}{vendor.country || "—"}
                      </span>
                    </div>
                  </div>
                  <span className={cn(
                    "text-[10px] font-semibold px-2 py-0.5 rounded-full font-body",
                    vendor.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                  )}>
                    {vendor.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold font-body">{vendor._count?.products || 0}</p>
                    <p className="text-[10px] text-gray-500 font-body">Products</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2.5 text-center">
                    <p className="text-lg font-bold font-body">{vendor._count?.vendorOrders || 0}</p>
                    <p className="text-[10px] text-gray-500 font-body">Orders</p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px]">
                  <span className={cn(
                    "px-2 py-0.5 rounded-full font-semibold font-body",
                    vendor.economicModel === "MARKETPLACE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                  )}>
                    {vendor.economicModel}
                  </span>
                  <span className="text-gray-500 font-body">
                    {vendor.commissionRate ? `${vendor.commissionRate}% comm.` : "Wholesale"}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-soft">
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Location</th>
                <th>Model</th>
                <th>Integration</th>
                <th>Commission</th>
                <th>Products</th>
                <th>Orders</th>
                <th>Status</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((vendor) => (
                <tr key={vendor.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                        {vendor.logoUrl ? (
                          <img src={vendor.logoUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-bold text-gray-400">{vendor.name?.[0]}</span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm font-body">{vendor.name}</p>
                        <p className="text-[10px] text-gray-500 font-body">{vendor.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <MapPin size={12} className="text-gray-400" />
                      <span className="text-xs font-body">{vendor.city || vendor.country || "—"}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "text-[10px] px-2 py-0.5 rounded-full font-semibold font-body",
                      vendor.economicModel === "MARKETPLACE" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
                    )}>
                      {vendor.economicModel}
                    </span>
                  </td>
                  <td className="text-xs font-body">{vendor.integrationType}</td>
                  <td className="text-xs font-body">{vendor.commissionRate ? `${vendor.commissionRate}%` : "—"}</td>
                  <td className="text-xs font-semibold font-body">{vendor._count?.products || 0}</td>
                  <td className="text-xs font-semibold font-body">{vendor._count?.vendorOrders || 0}</td>
                  <td>
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full font-body",
                      vendor.isActive ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                    )}>
                      {vendor.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <Link href={`/vendors/${vendor.id}`}>
                      <button className="btn-view">
                        <Eye size={12} />
                        View
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = page <= 3 ? i + 1 : page - 2 + i;
            if (p > totalPages || p < 1) return null;
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-8 h-8 rounded-lg text-xs font-semibold font-body transition-colors ${
                  p === page ? "bg-gray-900 text-white" : "border border-gray-200 hover:bg-gray-50"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
