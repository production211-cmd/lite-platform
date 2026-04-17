import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft, Building2, MapPin, Mail, Phone, Globe, Star,
  Package, ShoppingCart, Truck, TrendingUp, AlertTriangle,
  CheckCircle, Clock, Eye, Percent, DollarSign, BarChart3,
} from "lucide-react";

export default function VendorDetail() {
  const [, params] = useRoute("/vendors/:id");
  const [vendor, setVendor] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    if (!params?.id) return;
    api.getVendor(params.id).then((data: any) => {
      setVendor(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params?.id]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

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

  const tabs = [
    { key: "overview", label: "Overview" },
    { key: "orders", label: "Orders" },
    { key: "products", label: "Products" },
    { key: "finance", label: "Finance" },
    { key: "compliance", label: "Compliance" },
    { key: "settings", label: "Settings" },
  ];

  const performance = vendor.performance || vendor.vendorPerformance?.[0] || {};
  const access = vendor.vendorAccess?.[0] || {};

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
            <div className="w-16 h-16 rounded-xl bg-gray-100 flex items-center justify-center text-xl font-bold font-heading text-gray-400">
              {vendor.name?.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold font-heading">{vendor.name}</h1>
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-bold",
                  vendor.status === "ACTIVE" ? "bg-green-50 text-green-600" :
                  vendor.status === "ONBOARDING" ? "bg-amber-50 text-amber-600" :
                  "bg-gray-100 text-gray-500"
                )}>
                  {vendor.status}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500 font-body">
                {vendor.country && <span className="flex items-center gap-1"><MapPin size={10} /> {vendor.country}</span>}
                {vendor.contactEmail && <span className="flex items-center gap-1"><Mail size={10} /> {vendor.contactEmail}</span>}
                {vendor.contactPhone && <span className="flex items-center gap-1"><Phone size={10} /> {vendor.contactPhone}</span>}
                {vendor.website && <span className="flex items-center gap-1"><Globe size={10} /> {vendor.website}</span>}
              </div>
              <p className="text-xs text-gray-400 font-body mt-1">
                Joined {formatDate(vendor.createdAt)} · Commission: {vendor.commissionRate || 0}% · Portal: {access.portalType || "FULL"}
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

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-4">
          {/* KPI Row */}
          <div className="grid grid-cols-5 gap-3">
            <div className="kpi-card kpi-green">
              <DollarSign size={14} className="text-green-500 mb-1" />
              <p className="text-lg font-bold font-body">{formatCurrency(vendor._sum?.totalAmount || vendor.totalRevenue || 0)}</p>
              <p className="text-[10px] text-gray-500 font-body">Total Revenue</p>
            </div>
            <div className="kpi-card kpi-blue">
              <ShoppingCart size={14} className="text-blue-500 mb-1" />
              <p className="text-lg font-bold font-body">{vendor._count?.vendorOrders || 0}</p>
              <p className="text-[10px] text-gray-500 font-body">Total Orders</p>
            </div>
            <div className="kpi-card kpi-purple">
              <Package size={14} className="text-purple-500 mb-1" />
              <p className="text-lg font-bold font-body">{vendor._count?.products || 0}</p>
              <p className="text-[10px] text-gray-500 font-body">Products</p>
            </div>
            <div className="kpi-card kpi-orange">
              <Truck size={14} className="text-orange-500 mb-1" />
              <p className="text-lg font-bold font-body">{performance.fulfillmentRate ? `${Math.round(performance.fulfillmentRate)}%` : "—"}</p>
              <p className="text-[10px] text-gray-500 font-body">Fulfillment Rate</p>
            </div>
            <div className="kpi-card kpi-green">
              <Star size={14} className="text-amber-500 mb-1" />
              <p className="text-lg font-bold font-body">{performance.qualityScore || "—"}</p>
              <p className="text-[10px] text-gray-500 font-body">Quality Score</p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4">
            {/* Contact & Business */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
              <h3 className="text-sm font-bold font-heading mb-3">Business Details</h3>
              <div className="space-y-2.5">
                {[
                  { label: "Legal Name", value: vendor.legalName || vendor.name },
                  { label: "Country", value: vendor.country },
                  { label: "Currency", value: vendor.currency },
                  { label: "VAT Number", value: vendor.vatNumber || "—" },
                  { label: "Contact Email", value: vendor.contactEmail },
                  { label: "Contact Phone", value: vendor.contactPhone || "—" },
                  { label: "Ship From", value: access.shipFromAddress || "—" },
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
              <h3 className="text-sm font-bold font-heading mb-3">Performance Metrics</h3>
              <div className="space-y-3">
                {[
                  { label: "Fulfillment Rate", value: performance.fulfillmentRate, suffix: "%", color: "green" },
                  { label: "On-Time Shipping", value: performance.onTimeShippingRate, suffix: "%", color: "blue" },
                  { label: "Return Rate", value: performance.returnRate, suffix: "%", color: "orange" },
                  { label: "Quality Score", value: performance.qualityScore, suffix: "/100", color: "purple" },
                  { label: "Response Time", value: performance.avgResponseTime, suffix: "h", color: "gray" },
                ].map((metric) => (
                  <div key={metric.label}>
                    <div className="flex justify-between text-xs font-body mb-1">
                      <span className="text-gray-500">{metric.label}</span>
                      <span className="font-semibold">{metric.value != null ? `${Math.round(metric.value)}${metric.suffix}` : "—"}</span>
                    </div>
                    {metric.value != null && (
                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full bg-${metric.color}-500`} style={{ width: `${Math.min(metric.value, 100)}%` }} />
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
            <div className="grid grid-cols-4 gap-6">
              <div>
                <p className="text-xs text-gray-500 font-body">Commission Rate</p>
                <p className="text-lg font-bold font-body">{vendor.commissionRate || 0}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Payment Terms</p>
                <p className="text-lg font-bold font-body">{vendor.paymentTerms || "Net 30"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Portal Type</p>
                <p className="text-lg font-bold font-body">{access.portalType || "FULL"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-body">Contract Status</p>
                <p className="text-lg font-bold font-body text-green-600">Active</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-8 text-center text-gray-400">
          <ShoppingCart size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-body">Vendor orders will be displayed here</p>
          <p className="text-xs font-body mt-1">Filtered view of all orders for {vendor.name}</p>
        </div>
      )}

      {activeTab === "products" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-8 text-center text-gray-400">
          <Package size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-body">Vendor products will be displayed here</p>
          <p className="text-xs font-body mt-1">Filtered view of all products from {vendor.name}</p>
        </div>
      )}

      {activeTab === "finance" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-8 text-center text-gray-400">
          <DollarSign size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-body">Vendor financial details will be displayed here</p>
          <p className="text-xs font-body mt-1">Payouts, deductions, and settlement history for {vendor.name}</p>
        </div>
      )}

      {activeTab === "compliance" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
          <h3 className="text-sm font-bold font-heading mb-4">Compliance Checklist</h3>
          <div className="space-y-3">
            {[
              { label: "Business Registration", status: true },
              { label: "VAT Certificate", status: !!vendor.vatNumber },
              { label: "Product Liability Insurance", status: false },
              { label: "GDPR Data Processing Agreement", status: true },
              { label: "Anti-Counterfeiting Declaration", status: true },
              { label: "Return Policy Agreement", status: true },
              { label: "Shipping SLA Agreement", status: false },
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

      {activeTab === "settings" && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-8 text-center text-gray-400">
          <Building2 size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm font-body">Vendor settings will be displayed here</p>
          <p className="text-xs font-body mt-1">Edit commission rates, portal access, and notification preferences</p>
        </div>
      )}
    </div>
  );
}
