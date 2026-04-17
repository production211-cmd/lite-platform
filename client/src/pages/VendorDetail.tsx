import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Globe, Star,
  Package, ShoppingCart, Truck, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Eye, Percent, DollarSign, BarChart3,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const statusColor = (status: string) => {
  const s = status?.toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED" || s === "SETTLED") return "status-delivered";
  if (s === "SHIPPED" || s === "IN_TRANSIT") return "status-shipped";
  if (s === "PROCESSING" || s === "VENDOR_ACCEPT") return "status-processing";
  if (s === "PLACED" || s === "PENDING" || s === "PENDING_REVIEW") return "status-pending";
  if (s === "CANCELLED" || s === "REFUNDED" || s === "REJECTED") return "status-danger";
  if (s === "APPROVED" || s === "PUSHED") return "status-delivered";
  return "status-neutral";
};

export default function VendorDetail() {
  const [, params] = useRoute("/vendors/:id");
  const [vendor, setVendor] = useState<any>(null);
  const [performance, setPerformance] = useState<any>(null);
  const [vendorProducts, setVendorProducts] = useState<any[]>([]);
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");
  const [ordersLoaded, setOrdersLoaded] = useState(false);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([
      api.getVendor(params.id),
      api.getVendorPerformance(params.id).catch(() => []),
    ]).then(([v, perf]) => {
      setVendor(v);
      // Performance is an array of monthly records — use the latest
      const latestPerf = Array.isArray(perf) ? perf[0] : perf;
      setPerformance(latestPerf || {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params?.id]);

  // Lazy-load tab data
  useEffect(() => {
    if (!params?.id) return;
    if (activeTab === "orders" && !ordersLoaded) {
      api.getVendorOrders(params.id, { limit: "20" }).then((data: any) => {
        setVendorOrders(data.orders || data.data || []);
        setOrdersTotal(data.total || 0);
        setOrdersLoaded(true);
      }).catch(() => {});
    }
    if (activeTab === "products" && !productsLoaded) {
      api.getVendorProducts(params.id, { limit: "20" }).then((data: any) => {
        setVendorProducts(data.products || data.data || []);
        setProductsTotal(data.total || 0);
        setProductsLoaded(true);
      }).catch(() => {});
    }
  }, [activeTab, params?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading vendor...</p>
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="p-6">
        <Link href="/vendors" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 font-body">
          <ArrowLeft size={16} /> Back to Vendors
        </Link>
        <div className="text-center py-20 text-gray-400">
          <Building2 size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-body">Vendor not found</p>
        </div>
      </div>
    );
  }

  const vendorStatus = vendor.isActive ? "ACTIVE" : "INACTIVE";
  const counts = vendor._count || {};
  const perf = performance || {};

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: `Orders (${counts.vendorOrders || 0})` },
    { key: "products", label: `Products (${counts.products || 0})` },
    { key: "finance", label: "Finance" },
    { key: "compliance", label: "Compliance" },
    { key: "settings", label: "Settings" },
  ];

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Back */}
      <Link href="/vendors" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-body">
        <ArrowLeft size={16} /> Back to Vendors
      </Link>

      {/* Vendor Header */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {vendor.logoUrl ? (
              <img src={vendor.logoUrl} alt={vendor.name} className="w-16 h-16 rounded-xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold font-heading text-gray-400">
                {vendor.name?.charAt(0)}
              </div>
            )}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold font-heading">{vendor.name}</h1>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  vendorStatus === "ACTIVE" ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500"
                )}>
                  {vendorStatus}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600">
                  {vendor.economicModel}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 font-body">
                {(vendor.city || vendor.country) && (
                  <span className="flex items-center gap-1"><MapPin size={10} /> {[vendor.city, vendor.country].filter(Boolean).join(", ")}</span>
                )}
                {vendor.contactEmail && <span className="flex items-center gap-1"><Mail size={10} /> {vendor.contactEmail}</span>}
                {vendor.contactPhone && <span className="flex items-center gap-1"><Phone size={10} /> {vendor.contactPhone}</span>}
              </div>
              <p className="text-xs text-gray-400 font-body mt-1">
                Onboarded {formatDate(vendor.onboardedAt || vendor.createdAt)}
                {" · "}Commission: {vendor.commissionRate || 0}%
                {" · "}Payout: {vendor.payoutCycle?.replace(/_/g, " ") || "—"}
                {" · "}{vendor.integrationType || "—"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50">Edit Vendor</button>
            <button className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800">Message</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tab-bar">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`tab-item ${activeTab === tab.key ? "active" : ""}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ==================== OVERVIEW TAB ==================== */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-3">
            <div className="kpi-card kpi-green">
              <DollarSign size={14} className="text-green-500 mb-1" />
              <p className="text-lg font-bold font-body">{formatCurrency(perf.totalRevenue || 0, vendor.currency)}</p>
              <p className="text-[10px] text-gray-500 font-body">Revenue ({perf.period || "—"})</p>
            </div>
            <div className="kpi-card kpi-blue">
              <ShoppingCart size={14} className="text-blue-500 mb-1" />
              <p className="text-lg font-bold font-body">{counts.vendorOrders || 0}</p>
              <p className="text-[10px] text-gray-500 font-body">Total Orders</p>
            </div>
            <div className="kpi-card kpi-purple">
              <Package size={14} className="text-purple-500 mb-1" />
              <p className="text-lg font-bold font-body">{counts.products || 0}</p>
              <p className="text-[10px] text-gray-500 font-body">Products</p>
            </div>
            <div className="kpi-card kpi-orange">
              <Truck size={14} className="text-orange-500 mb-1" />
              <p className="text-lg font-bold font-body">{perf.fulfillmentRate ? `${Math.round(perf.fulfillmentRate)}%` : "—"}</p>
              <p className="text-[10px] text-gray-500 font-body">Fulfillment Rate</p>
            </div>
            <div className="kpi-card kpi-green">
              <Star size={14} className="text-amber-500 mb-1" />
              <p className="text-lg font-bold font-body">{perf.acceptanceRate ? `${Math.round(perf.acceptanceRate)}%` : "—"}</p>
              <p className="text-[10px] text-gray-500 font-body">Acceptance Rate</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Contact & Business */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
              <h3 className="text-sm font-bold font-heading mb-3">Business Details</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Name", value: vendor.name },
                  { label: "Slug", value: vendor.slug },
                  { label: "Location", value: [vendor.city, vendor.country].filter(Boolean).join(", ") },
                  { label: "Currency", value: vendor.currency },
                  { label: "Tax ID", value: vendor.taxId || "—" },
                  { label: "Contact Email", value: vendor.contactEmail },
                  { label: "Contact Phone", value: vendor.contactPhone || "—" },
                  { label: "Shipping Model", value: vendor.shippingModel?.replace(/_/g, " ") || "—" },
                  { label: "Brand Structure", value: vendor.brandStructure?.replace(/_/g, " ") || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between text-sm font-body">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{item.value || "—"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
              <h3 className="text-sm font-bold font-heading mb-3">Performance Metrics ({perf.period || "—"})</h3>
              <div className="space-y-3">
                {[
                  { label: "Fulfillment Rate", value: perf.fulfillmentRate, suffix: "%", max: 100 },
                  { label: "Acceptance Rate", value: perf.acceptanceRate, suffix: "%", max: 100 },
                  { label: "SLA Compliance", value: perf.slaComplianceRate, suffix: "%", max: 100 },
                  { label: "Return Rate", value: perf.returnRate, suffix: "%", max: 30 },
                  { label: "Avg Ship Time", value: perf.avgShipTime, suffix: "h", max: 72 },
                  { label: "Total Orders", value: perf.totalOrders, suffix: "", max: 100 },
                  { label: "Commission Earned", value: perf.totalCommission, suffix: "", max: null },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-xs font-body mb-1">
                      <span className="text-gray-500">{metric.label}</span>
                      <span className="font-semibold">
                        {metric.value != null
                          ? metric.suffix === "" && metric.label.includes("Commission")
                            ? formatCurrency(metric.value, vendor.currency)
                            : `${metric.label === "Total Orders" ? metric.value : Math.round(metric.value * 10) / 10}${metric.suffix}`
                          : "—"}
                      </span>
                    </div>
                    {metric.value != null && metric.max != null && (
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full", metric.label === "Return Rate" ? "bg-orange-400" : "bg-green-500")}
                          style={{ width: `${Math.min((metric.value / metric.max) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Commission & Terms */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
            <h3 className="text-sm font-bold font-heading mb-3">Commission & Terms</h3>
            <div className="grid grid-cols-5 gap-6">
              <div>
                <p className="text-xs text-gray-500 font-body">Commission Rate</p>
                <p className="text-lg font-bold font-body">{vendor.commissionRate || 0}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Payout Cycle</p>
                <p className="text-lg font-bold font-body">{vendor.payoutCycle?.replace(/_/g, " ") || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Economic Model</p>
                <p className="text-lg font-bold font-body">{vendor.economicModel || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Integration</p>
                <p className="text-lg font-bold font-body">{vendor.integrationType || "—"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Location Type</p>
                <p className="text-lg font-bold font-body">{vendor.location?.replace(/_/g, " ") || "—"}</p>
              </div>
            </div>
          </div>

          {/* Portal Users */}
          {vendor.users && vendor.users.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
              <h3 className="text-sm font-bold font-heading mb-3">Portal Users ({vendor.users.length})</h3>
              <div className="space-y-2">
                {vendor.users.map((u: any) => (
                  <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {u.name?.charAt(0) || u.email?.charAt(0) || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-body">{u.name || u.email}</p>
                        <p className="text-[10px] text-gray-400 font-body">{u.email} · {u.role}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", u.isActive ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-500")}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==================== ORDERS TAB ==================== */}
      {activeTab === "orders" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading">Vendor Orders ({ordersTotal})</h3>
          </div>
          {vendorOrders.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Subtotal</th>
                  <th>Commission</th>
                  <th>Items</th>
                  <th>Placed</th>
                  <th>SLA Deadline</th>
                </tr>
              </thead>
              <tbody>
                {vendorOrders.map((vo: any) => (
                  <tr key={vo.id}>
                    <td>
                      <Link href={`/orders/${vo.orderId || vo.order?.id || ""}`} className="text-sm font-semibold font-body text-blue-600 hover:underline">
                        {vo.order?.orderNumber || vo.orderId?.slice(-8) || "—"}
                      </Link>
                    </td>
                    <td><span className={`status-badge ${statusColor(vo.status)}`}>{vo.status?.replace(/_/g, " ")}</span></td>
                    <td className="text-sm font-semibold font-body">{formatCurrency(vo.subtotal || 0, vo.currency)}</td>
                    <td className="text-sm text-green-600 font-body">{formatCurrency(vo.commission || 0, vo.currency)}</td>
                    <td className="text-sm font-body">{vo.items?.length || vo._count?.items || "—"}</td>
                    <td className="text-xs text-gray-500 font-body">{formatDate(vo.createdAt)}</td>
                    <td className="text-xs text-gray-500 font-body">{formatDate(vo.slaDeadline)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400 font-body text-sm">
              <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
              No orders found for this vendor
            </div>
          )}
        </div>
      )}

      {/* ==================== PRODUCTS TAB ==================== */}
      {activeTab === "products" && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-bold font-heading">Products ({productsTotal})</h3>
          </div>
          {vendorProducts.length > 0 ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Status</th>
                  <th>Price</th>
                  <th>Category</th>
                  <th>Brand</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {vendorProducts.map((p: any) => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {p.images?.[0]?.url && (
                          <img src={p.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <span className="text-sm font-semibold font-body truncate max-w-[200px]">{p.title || "—"}</span>
                      </div>
                    </td>
                    <td className="text-xs font-mono text-gray-500">{p.retailerSku || p.vendorSku || "—"}</td>
                    <td><span className={`status-badge ${statusColor(p.status)}`}>{p.status?.replace(/_/g, " ")}</span></td>
                    <td className="text-sm font-semibold font-body">{formatCurrency(p.salesPrice || 0, p.currency)}</td>
                    <td className="text-xs text-gray-500 font-body">{p.category || "—"}</td>
                    <td className="text-xs text-gray-500 font-body">{p.brand || "—"}</td>
                    <td>
                      <Link href={`/products/${p.id}`}>
                        <button className="btn-view"><Eye size={12} /> View</button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center text-gray-400 font-body text-sm">
              <Package size={32} className="mx-auto mb-3 opacity-30" />
              No products found for this vendor
            </div>
          )}
        </div>
      )}

      {/* ==================== FINANCE TAB ==================== */}
      {activeTab === "finance" && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <div className="kpi-card kpi-green">
              <p className="text-lg font-bold font-body">{formatCurrency(perf.totalRevenue || 0, vendor.currency)}</p>
              <p className="text-[10px] text-gray-500 font-body">Revenue ({perf.period || "—"})</p>
            </div>
            <div className="kpi-card kpi-blue">
              <p className="text-lg font-bold font-body">{formatCurrency(perf.totalCommission || 0, vendor.currency)}</p>
              <p className="text-[10px] text-gray-500 font-body">Commission ({perf.period || "—"})</p>
            </div>
            <div className="kpi-card kpi-purple">
              <p className="text-lg font-bold font-body">{counts.payouts || 0}</p>
              <p className="text-[10px] text-gray-500 font-body">Payouts</p>
            </div>
            <div className="kpi-card kpi-orange">
              <p className="text-lg font-bold font-body">{counts.settlements || 0}</p>
              <p className="text-[10px] text-gray-500 font-body">Settlements</p>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
            <h3 className="text-sm font-bold font-heading mb-3">Financial Summary</h3>
            <div className="space-y-2.5">
              {[
                { label: "Commission Rate", value: `${vendor.commissionRate || 0}%` },
                { label: "Payout Cycle", value: vendor.payoutCycle?.replace(/_/g, " ") || "—" },
                { label: "Currency", value: vendor.currency || "—" },
                { label: "Banking Details", value: vendor.bankingDetails ? "Configured" : "Not configured" },
                { label: "Total Payouts", value: String(counts.payouts || 0) },
                { label: "Total Settlements", value: String(counts.settlements || 0) },
              ].map((item) => (
                <div key={item.label} className="flex justify-between text-sm font-body">
                  <span className="text-gray-500">{item.label}</span>
                  <span className="font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ==================== COMPLIANCE TAB ==================== */}
      {activeTab === "compliance" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
          <h3 className="text-sm font-bold font-heading mb-4">Compliance Checklist</h3>
          <div className="space-y-3">
            {[
              { label: "Business Registration", status: true },
              { label: "Tax ID / VAT Certificate", status: !!vendor.taxId },
              { label: "Product Liability Insurance", status: false },
              { label: "GDPR Data Processing Agreement", status: true },
              { label: "Anti-Counterfeiting Declaration", status: true },
              { label: "Return Policy Agreement", status: true },
              { label: "Shipping SLA Agreement", status: vendor.shippingModel != null },
              { label: "Banking Details Configured", status: !!vendor.bankingDetails },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between py-2 border-b border-gray-50">
                <span className="text-sm font-body">{item.label}</span>
                {item.status ? (
                  <span className="flex items-center gap-1.5 text-xs text-green-600 font-semibold font-body">
                    <CheckCircle size={14} /> Verified
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold font-body">
                    <AlertTriangle size={14} /> Pending
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ==================== SETTINGS TAB ==================== */}
      {activeTab === "settings" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
          <h3 className="text-sm font-bold font-heading mb-4">Vendor Configuration</h3>
          <div className="space-y-2.5">
            {[
              { label: "Vendor ID", value: vendor.id },
              { label: "Slug", value: vendor.slug },
              { label: "Integration Type", value: vendor.integrationType },
              { label: "Shipping Model", value: vendor.shippingModel?.replace(/_/g, " ") },
              { label: "Brand Structure", value: vendor.brandStructure?.replace(/_/g, " ") },
              { label: "Location", value: vendor.location?.replace(/_/g, " ") },
              { label: "Economic Model", value: vendor.economicModel },
              { label: "Commission Rate", value: `${vendor.commissionRate || 0}%` },
              { label: "Payout Cycle", value: vendor.payoutCycle?.replace(/_/g, " ") },
              { label: "Created", value: formatDate(vendor.createdAt) },
              { label: "Last Updated", value: formatDate(vendor.updatedAt) },
            ].map((item) => (
              <div key={item.label} className="flex justify-between text-sm font-body">
                <span className="text-gray-500">{item.label}</span>
                <span className="font-medium font-mono text-xs text-right max-w-[60%] truncate">{item.value || "—"}</span>
              </div>
            ))}
          </div>
          {vendor.connectorConfig && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <h4 className="text-xs font-bold font-heading mb-2 text-gray-500">Connector Config</h4>
              <pre className="text-[10px] font-mono bg-gray-50 rounded p-3 overflow-x-auto text-gray-600">
                {JSON.stringify(vendor.connectorConfig, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
