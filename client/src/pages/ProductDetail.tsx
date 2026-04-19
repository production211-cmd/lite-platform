/**
 * ProductDetail — Product Review Workspace
 * ==========================================
 * Full product review workspace with gallery, variant table,
 * price history, vendor info, enrichment breakdown, compliance,
 * tags, and inline edit mode.
 *
 * Uses shared helpers: formatCurrency, formatDate, getStatusLabel, cn
 * API shape: GET /api/products/:id returns product with vendor, images,
 * variants, priceHistory (field/oldValue/newValue).
 */

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { cn, formatCurrency, formatDate, formatDateTime, getStatusLabel } from "@/lib/utils";
import {
  ArrowLeft, CheckCircle, XCircle, Send, Image as ImageIcon,
  Tag, DollarSign, BarChart3, Package, Clock, AlertTriangle,
  Eye, Edit, History, Star, ShieldCheck, Globe, Layers,
  ChevronRight, ExternalLink, Save, X, FileText, MapPin,
  Shield, Hash, Truck, Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface ProductImage {
  id: string;
  url: string;
  altText: string | null;
  position: number;
  isGenerated: boolean;
  isCompliant: boolean;
  complianceIssues: string[];
}

interface ProductVariant {
  id: string;
  title: string | null;
  size: string | null;
  color: string | null;
  material: string | null;
  vendorSku: string | null;
  retailerSku: string | null;
  salesPrice: number | null;
  retailerCost: number | null;
  vendorCost: number | null;
  inventoryQuantity: number;
  isActive: boolean;
  weight: number | null;
  weightUnit: string | null;
}

interface PriceHistoryEntry {
  id: string;
  field: string;
  oldValue: number | null;
  newValue: number | null;
  currency: string;
  source: string;
  changedBy: string | null;
  createdAt: string;
}

interface Vendor {
  id: string;
  name: string;
  slug: string;
  country: string;
  city: string | null;
  economicModel: string;
  integrationType: string;
  commissionRate: number;
  currency: string;
  logoUrl: string | null;
  contactEmail: string | null;
}

interface Product {
  id: string;
  title: string;
  brand: string | null;
  description: string | null;
  bodyHtml: string | null;
  productType: string | null;
  category: string | null;
  subcategory: string | null;
  status: string;
  tags: string[];
  salesPrice: number | null;
  compareAtPrice: number | null;
  retailerCost: number | null;
  vendorCost: number | null;
  currency: string;
  enrichmentScore: number | null;
  attributeScore: number | null;
  descriptionScore: number | null;
  seoScore: number | null;
  geoScore: number | null;
  metaTitle: string | null;
  metaDescription: string | null;
  keywords: string[];
  hsCode: string | null;
  countryOfOrigin: string | null;
  complianceRisk: string | null;
  requiresFda: boolean;
  requiresCites: boolean;
  shipsFrom: string | null;
  vendorSku: string | null;
  retailerSku: string | null;
  shopifyProductId: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  vendor: Vendor;
  images: ProductImage[];
  variants: ProductVariant[];
  priceHistory: PriceHistoryEntry[];
}

/* ------------------------------------------------------------------ */
/* Style maps                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-50 text-amber-700 border border-amber-200",
  NEEDS_REVIEW: "bg-amber-50 text-amber-700 border border-amber-200",
  QUALIFIED: "bg-teal-50 text-teal-700 border border-teal-200",
  APPROVED: "bg-emerald-50 text-emerald-700 border border-emerald-200",
  PUBLISHED: "bg-blue-50 text-blue-700 border border-blue-200",
  PUSHED: "bg-blue-50 text-blue-700 border border-blue-200",
  REJECTED: "bg-red-50 text-red-700 border border-red-200",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const RISK_STYLES: Record<string, string> = {
  LOW: "bg-green-50 text-green-700",
  MEDIUM: "bg-amber-50 text-amber-700",
  HIGH: "bg-orange-50 text-orange-700",
  CRITICAL: "bg-red-50 text-red-700",
};

/* ------------------------------------------------------------------ */
/* Sub-components                                                      */
/* ------------------------------------------------------------------ */

function ScoreBar({ label, score, maxScore = 35 }: { label: string; score: number | null; maxScore?: number }) {
  const pct = score != null ? Math.min((score / maxScore) * 100, 100) : 0;
  const color = pct >= 70 ? "bg-emerald-500" : pct >= 40 ? "bg-amber-500" : "bg-red-400";
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-body text-gray-500 w-24 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-500", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] font-body font-semibold text-gray-600 w-8 text-right">{score ?? 0}</span>
    </div>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: React.ReactNode; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between py-2 border-b border-gray-50 last:border-0">
      <span className="text-[11px] font-body text-gray-400 shrink-0">{label}</span>
      <span className={cn("text-[11px] font-body text-gray-700 text-right", mono && "font-mono")}>{value || "—"}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main Component                                                      */
/* ------------------------------------------------------------------ */

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"variants" | "pricing" | "compliance" | "seo">("variants");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Partial<Product>>({});
  const [saveLoading, setSaveLoading] = useState(false);

  const fetchProduct = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getProduct(id);
      if (data.error) throw new Error(data.error);
      setProduct(data as Product);
    } catch (err: any) {
      setError(err.message || "Failed to load product");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (params?.id) fetchProduct(params.id);
  }, [params?.id, fetchProduct]);

  /* ---- Actions ---- */
  const handleAction = async (action: string) => {
    if (!product) return;
    setActionLoading(action);
    try {
      if (action === "approve") await api.approveProduct(product.id);
      else if (action === "reject") await api.rejectProduct(product.id);
      else if (action === "push") await api.pushProduct(product.id);
      await fetchProduct(product.id);
    } catch (err: any) {
      console.error(`Action ${action} failed:`, err);
    }
    setActionLoading(null);
    setConfirmAction(null);
  };

  /* ---- Edit Mode ---- */
  const startEdit = () => {
    if (!product) return;
    setEditData({
      title: product.title,
      brand: product.brand,
      description: product.description,
      category: product.category,
      subcategory: product.subcategory,
      salesPrice: product.salesPrice,
      compareAtPrice: product.compareAtPrice,
      retailerCost: product.retailerCost,
      metaTitle: product.metaTitle,
      metaDescription: product.metaDescription,
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveEdit = async () => {
    if (!product) return;
    setSaveLoading(true);
    try {
      await api.updateProduct(product.id, editData);
      await fetchProduct(product.id);
      setIsEditing(false);
      setEditData({});
    } catch (err: any) {
      console.error("Save failed:", err);
    }
    setSaveLoading(false);
  };

  /* ---- Derived values ---- */
  const retailPrice = product?.salesPrice ?? product?.compareAtPrice ?? 0;
  const wholesalePrice = product?.retailerCost ?? product?.vendorCost ?? 0;
  const margin = useMemo(() => {
    if (retailPrice <= 0) return 0;
    return ((retailPrice - wholesalePrice) / retailPrice) * 100;
  }, [retailPrice, wholesalePrice]);

  const totalStock = useMemo(
    () => product?.variants.reduce((sum, v) => sum + (v.inventoryQuantity ?? 0), 0) ?? 0,
    [product]
  );

  const totalVariants = product?.variants.length ?? 0;
  const activeVariants = product?.variants.filter((v) => v.isActive).length ?? 0;
  const currency = product?.currency ?? "USD";
  const syncStatus = product?.shopifyProductId ? "SYNCED" : "NOT_SYNCED";

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-7 w-72 bg-gray-200 rounded" />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-5 space-y-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg" />
          </div>
          <div className="col-span-7 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => <div key={i} className="h-20 bg-gray-100 rounded-lg" />)}
            </div>
            <div className="h-40 bg-gray-100 rounded-lg" />
            <div className="h-48 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  /* ---- Error / Not Found ---- */
  if (error || !product) {
    return (
      <div className="p-6">
        <Link href="/products" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Back to Products
        </Link>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertTriangle size={24} className="mx-auto mb-2 text-red-400" />
          <p className="text-sm text-red-700">{error || "Product not found."}</p>
        </div>
      </div>
    );
  }

  const canReview = product.status === "PENDING_REVIEW" || product.status === "NEEDS_REVIEW";

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400" aria-label="Breadcrumb">
        <Link href="/products" className="hover:text-gray-600 transition-colors">Products</Link>
        <ChevronRight size={10} aria-hidden="true" />
        <span className="text-gray-700 font-medium truncate max-w-[300px]">{product.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          {isEditing ? (
            <input
              type="text"
              value={editData.title ?? ""}
              onChange={(e) => setEditData((d) => ({ ...d, title: e.target.value }))}
              className="text-xl font-bold font-heading bg-white border border-gray-300 rounded-lg px-3 py-1.5 w-full max-w-lg focus:outline-none focus:ring-2 focus:ring-gray-900/20"
            />
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold font-heading">{product.title}</h1>
              <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase", STATUS_STYLES[product.status] || "bg-gray-100 text-gray-600")}>
                {getStatusLabel(product.status)}
              </span>
            </div>
          )}
          <p className="text-sm text-gray-500 font-body mt-1">
            {product.brand ?? "—"} — {product.category ?? "Uncategorized"}
            {product.subcategory && ` / ${product.subcategory}`}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isEditing ? (
            <>
              <button onClick={cancelEdit} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
                <X size={12} /> Cancel
              </button>
              <button onClick={saveEdit} disabled={saveLoading} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5 disabled:opacity-50">
                {saveLoading ? "Saving..." : <><Save size={12} /> Save Changes</>}
              </button>
            </>
          ) : (
            <>
              <button onClick={startEdit} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
                <Edit size={12} /> Edit
              </button>
              {canReview && (
                <>
                  {confirmAction === "reject" ? (
                    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      <span className="text-xs text-red-700 font-body">Confirm reject?</span>
                      <button onClick={() => handleAction("reject")} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Yes</button>
                      <button onClick={() => setConfirmAction(null)} className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs font-bold">No</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmAction("reject")} disabled={!!actionLoading} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold font-body hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50">
                      <XCircle size={12} /> Reject
                    </button>
                  )}
                  <button onClick={() => handleAction("approve")} disabled={!!actionLoading} className="px-3 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold font-body hover:bg-emerald-700 flex items-center gap-1.5 disabled:opacity-50">
                    {actionLoading === "approve" ? "Approving..." : <><CheckCircle size={12} /> Approve</>}
                  </button>
                </>
              )}
              {product.status === "APPROVED" && (
                <button onClick={() => setConfirmAction("push")} disabled={!!actionLoading} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold font-body hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50">
                  {actionLoading === "push" ? "Publishing..." : <><Send size={12} /> Push to Shopify</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tags */}
      {product.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag size={11} className="text-gray-400" />
          {product.tags.map((tag, i) => (
            <span key={i} className="text-[10px] font-body bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      )}

      {/* Main Content — Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ============ Left Column — Gallery + Description ============ */}
        <div className="lg:col-span-5 space-y-4">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center relative">
              {product.images[selectedImage]?.url ? (
                <>
                  <img
                    src={product.images[selectedImage].url}
                    alt={product.images[selectedImage].altText || "Product image"}
                    className="w-full h-full object-cover"
                  />
                  {product.images[selectedImage].isGenerated && (
                    <span className="absolute top-2 left-2 text-[9px] font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">AI Generated</span>
                  )}
                  {!product.images[selectedImage].isCompliant && (
                    <span className="absolute top-2 right-2 text-[9px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle size={8} /> Non-Compliant
                    </span>
                  )}
                </>
              ) : (
                <div className="text-center text-gray-300">
                  <ImageIcon size={48} className="mx-auto mb-2" />
                  <p className="text-xs font-body">No image</p>
                </div>
              )}
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-1 p-2 overflow-x-auto">
                {product.images.map((img, i) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-14 h-14 rounded border-2 overflow-hidden flex-shrink-0 transition-all",
                      i === selectedImage ? "border-gray-900 shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    {img.url ? (
                      <img src={img.url} alt={img.altText || `Thumbnail ${i + 1}`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={12} className="text-gray-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
            <div className="px-3 py-2 border-t border-gray-100 text-[10px] text-gray-400 font-body">
              {product.images.length} image{product.images.length !== 1 ? "s" : ""}
              {product.images.some((img) => !img.isCompliant) && (
                <span className="text-red-500 ml-2">• Compliance issues detected</span>
              )}
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-2">Description</h3>
            {isEditing ? (
              <textarea
                value={editData.description ?? ""}
                onChange={(e) => setEditData((d) => ({ ...d, description: e.target.value }))}
                rows={6}
                className="w-full text-sm font-body text-gray-700 bg-white border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-y"
              />
            ) : (
              <p className="text-sm font-body text-gray-700 leading-relaxed">
                {product.description || "No description available."}
              </p>
            )}
          </div>

          {/* Vendor Card */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Vendor</h3>
            <Link href={`/vendors/${product.vendor.id}`} className="flex items-center gap-3 group">
              {product.vendor.logoUrl ? (
                <img src={product.vendor.logoUrl} alt={product.vendor.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold text-gray-500">
                  {product.vendor.name.charAt(0)}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors truncate">{product.vendor.name}</p>
                <p className="text-[10px] text-gray-400 font-body flex items-center gap-1">
                  <Globe size={8} /> {product.vendor.city ? `${product.vendor.city}, ` : ""}{product.vendor.country}
                  <span className="mx-1">•</span>
                  {product.vendor.economicModel.replace(/_/g, " ")}
                  <span className="mx-1">•</span>
                  {product.vendor.commissionRate}% commission
                </p>
              </div>
              <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
            </Link>
          </div>

          {/* Product Details */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-2">Details</h3>
            <InfoRow label="Product Type" value={product.productType} />
            <InfoRow label="Category" value={isEditing ? (
              <input type="text" value={editData.category ?? ""} onChange={(e) => setEditData((d) => ({ ...d, category: e.target.value }))} className="text-[11px] font-body text-right bg-white border border-gray-200 rounded px-2 py-0.5 w-32 focus:outline-none" />
            ) : product.category} />
            <InfoRow label="Subcategory" value={product.subcategory} />
            <InfoRow label="Brand" value={isEditing ? (
              <input type="text" value={editData.brand ?? ""} onChange={(e) => setEditData((d) => ({ ...d, brand: e.target.value }))} className="text-[11px] font-body text-right bg-white border border-gray-200 rounded px-2 py-0.5 w-32 focus:outline-none" />
            ) : product.brand} />
            <InfoRow label="Vendor SKU" value={product.vendorSku} mono />
            <InfoRow label="Retailer SKU" value={product.retailerSku} mono />
            <InfoRow label="Currency" value={product.currency} />
          </div>
        </div>

        {/* ============ Right Column — Metrics + Tabs ============ */}
        <div className="lg:col-span-7 space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <DollarSign size={12} className="text-emerald-500 mb-1" />
              <p className="text-lg font-bold font-body">{formatCurrency(retailPrice, currency)}</p>
              <p className="text-[10px] text-gray-400 font-body">Retail Price</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <Tag size={12} className="text-blue-500 mb-1" />
              <p className="text-lg font-bold font-body">{formatCurrency(wholesalePrice, currency)}</p>
              <p className="text-[10px] text-gray-400 font-body">Wholesale</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <BarChart3 size={12} className="text-purple-500 mb-1" />
              <p className="text-lg font-bold font-body">{margin.toFixed(1)}%</p>
              <p className="text-[10px] text-gray-400 font-body">Margin</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <Package size={12} className="text-orange-500 mb-1" />
              <p className="text-lg font-bold font-body">{totalStock}</p>
              <p className="text-[10px] text-gray-400 font-body">{activeVariants}/{totalVariants} variants</p>
            </div>
          </div>

          {/* Price Edit Row (when editing) */}
          {isEditing && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <h3 className="text-xs font-bold font-heading text-amber-700 uppercase tracking-wide mb-3">Edit Pricing</h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-gray-500 font-body block mb-1">Sales Price</label>
                  <input type="number" step="0.01" value={editData.salesPrice ?? ""} onChange={(e) => setEditData((d) => ({ ...d, salesPrice: parseFloat(e.target.value) || null }))} className="w-full text-sm font-body bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-body block mb-1">Compare At Price</label>
                  <input type="number" step="0.01" value={editData.compareAtPrice ?? ""} onChange={(e) => setEditData((d) => ({ ...d, compareAtPrice: parseFloat(e.target.value) || null }))} className="w-full text-sm font-body bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 font-body block mb-1">Retailer Cost</label>
                  <input type="number" step="0.01" value={editData.retailerCost ?? ""} onChange={(e) => setEditData((d) => ({ ...d, retailerCost: parseFloat(e.target.value) || null }))} className="w-full text-sm font-body bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20" />
                </div>
              </div>
            </div>
          )}

          {/* Shopify Sync + Enrichment Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Sync Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Shopify Sync</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full",
                  syncStatus === "SYNCED" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                )}>
                  {syncStatus === "SYNCED" ? "Synced" : "Not Synced"}
                </span>
              </div>
              {product.shopifyProductId && (
                <p className="text-[10px] text-gray-400 font-body font-mono truncate">{product.shopifyProductId}</p>
              )}
              {product.publishedAt && (
                <p className="text-[10px] text-gray-400 font-body mt-1">
                  Published: {formatDateTime(product.publishedAt)}
                </p>
              )}
            </div>

            {/* Enrichment Score Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide">Enrichment</h3>
                <span className={cn(
                  "text-sm font-bold font-body",
                  (product.enrichmentScore ?? 0) >= 80 ? "text-emerald-600" :
                  (product.enrichmentScore ?? 0) >= 50 ? "text-amber-600" : "text-red-600"
                )}>
                  {product.enrichmentScore ?? 0}/100
                </span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-3" role="progressbar" aria-valuenow={product.enrichmentScore ?? 0} aria-valuemin={0} aria-valuemax={100}>
                <div className={cn(
                  "h-full rounded-full transition-all duration-500",
                  (product.enrichmentScore ?? 0) >= 80 ? "bg-emerald-500" :
                  (product.enrichmentScore ?? 0) >= 50 ? "bg-amber-500" : "bg-red-400"
                )} style={{ width: `${product.enrichmentScore ?? 0}%` }} />
              </div>
              <div className="space-y-1.5">
                <ScoreBar label="Attributes" score={product.attributeScore} maxScore={30} />
                <ScoreBar label="Description" score={product.descriptionScore} maxScore={35} />
                <ScoreBar label="SEO" score={product.seoScore} maxScore={25} />
                <ScoreBar label="Geo/Origin" score={product.geoScore} maxScore={15} />
              </div>
            </div>
          </div>

          {/* Tabs: Variants / Pricing / Compliance / SEO */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto" role="tablist">
              {([
                { key: "variants" as const, label: "Variants", icon: Layers, count: totalVariants },
                { key: "pricing" as const, label: "Price History", icon: History, count: product.priceHistory.length },
                { key: "compliance" as const, label: "Compliance", icon: Shield, count: null },
                { key: "seo" as const, label: "SEO", icon: FileText, count: null },
              ]).map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold font-body flex items-center gap-1.5 border-b-2 transition-colors whitespace-nowrap",
                    activeTab === tab.key ? "border-gray-900 text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <tab.icon size={12} /> {tab.label}
                  {tab.count != null && (
                    <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-1">{tab.count}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Variants Tab */}
            {activeTab === "variants" && (
              <div role="tabpanel" aria-label="Variants">
                {product.variants.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Variant</th>
                          <th>Size</th>
                          <th>Color</th>
                          <th>SKU</th>
                          <th className="text-right">Stock</th>
                          <th className="text-right">Price</th>
                          <th className="text-center">Active</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.variants.map((v) => (
                          <tr key={v.id} className={cn(!v.isActive && "opacity-50")}>
                            <td className="text-xs font-body font-medium">{v.title || `${v.size ?? "—"} / ${v.color ?? "—"}`}</td>
                            <td className="text-xs font-body">{v.size ?? "—"}</td>
                            <td className="text-xs font-body">
                              {v.color ? (
                                <span className="flex items-center gap-1.5">
                                  <span className="w-3 h-3 rounded-full border border-gray-200" style={{ backgroundColor: v.color.toLowerCase() }} />
                                  {v.color}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="text-xs font-body font-mono text-gray-500">{v.vendorSku ?? v.retailerSku ?? "—"}</td>
                            <td className="text-xs font-body text-right">
                              <span className={cn(v.inventoryQuantity <= 2 ? "text-red-600 font-bold" : "text-gray-700")}>
                                {v.inventoryQuantity}
                              </span>
                            </td>
                            <td className="text-xs font-body text-right font-medium">
                              {formatCurrency(v.salesPrice ?? retailPrice, currency)}
                            </td>
                            <td className="text-center">
                              <span className={cn("w-2 h-2 rounded-full inline-block", v.isActive ? "bg-emerald-500" : "bg-gray-300")} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <Layers size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-body">No variants defined</p>
                  </div>
                )}
              </div>
            )}

            {/* Price History Tab */}
            {activeTab === "pricing" && (
              <div role="tabpanel" aria-label="Price History">
                {product.priceHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Field</th>
                          <th className="text-right">Old Value</th>
                          <th className="text-right">New Value</th>
                          <th>Source</th>
                          <th>Changed By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {product.priceHistory.map((entry) => (
                          <tr key={entry.id}>
                            <td className="text-xs font-body">{formatDate(entry.createdAt)}</td>
                            <td className="text-xs font-body font-medium capitalize">{entry.field.replace(/([A-Z])/g, " $1").trim()}</td>
                            <td className="text-xs font-body text-right text-gray-500">
                              {entry.oldValue != null ? formatCurrency(entry.oldValue, entry.currency) : "—"}
                            </td>
                            <td className="text-xs font-body text-right font-medium">
                              {entry.newValue != null ? formatCurrency(entry.newValue, entry.currency) : "—"}
                            </td>
                            <td className="text-xs font-body text-gray-500">{entry.source}</td>
                            <td className="text-xs font-body text-gray-400">{entry.changedBy ?? "System"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <History size={24} className="mx-auto mb-2 text-gray-300" />
                    <p className="text-xs font-body">No price history available</p>
                  </div>
                )}
              </div>
            )}

            {/* Compliance Tab */}
            {activeTab === "compliance" && (
              <div role="tabpanel" aria-label="Compliance" className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <InfoRow label="HS Code" value={product.hsCode} mono />
                    <InfoRow label="Country of Origin" value={product.countryOfOrigin} />
                    <InfoRow label="Ships From" value={product.shipsFrom} />
                  </div>
                  <div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-50">
                      <span className="text-[11px] font-body text-gray-400">Compliance Risk</span>
                      {product.complianceRisk ? (
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", RISK_STYLES[product.complianceRisk] || "bg-gray-100 text-gray-500")}>
                          {product.complianceRisk}
                        </span>
                      ) : (
                        <span className="text-[11px] font-body text-gray-400">Not assessed</span>
                      )}
                    </div>
                    <div className="flex items-start justify-between py-2 border-b border-gray-50">
                      <span className="text-[11px] font-body text-gray-400">Requires FDA</span>
                      <span className={cn("text-[11px] font-body font-semibold", product.requiresFda ? "text-red-600" : "text-gray-500")}>
                        {product.requiresFda ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="flex items-start justify-between py-2">
                      <span className="text-[11px] font-body text-gray-400">Requires CITES</span>
                      <span className={cn("text-[11px] font-body font-semibold", product.requiresCites ? "text-red-600" : "text-gray-500")}>
                        {product.requiresCites ? "Yes" : "No"}
                      </span>
                    </div>
                  </div>
                </div>
                {/* Image Compliance Issues */}
                {product.images.some((img) => !img.isCompliant) && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-3">
                    <h4 className="text-xs font-bold text-red-700 mb-2 flex items-center gap-1.5">
                      <AlertTriangle size={12} /> Image Compliance Issues
                    </h4>
                    {product.images.filter((img) => !img.isCompliant).map((img) => (
                      <div key={img.id} className="text-[11px] text-red-600 font-body mb-1">
                        Image #{img.position + 1}: {img.complianceIssues.join(", ") || "Non-compliant"}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEO Tab */}
            {activeTab === "seo" && (
              <div role="tabpanel" aria-label="SEO" className="p-4 space-y-3">
                <div>
                  <label className="text-[10px] font-body text-gray-400 block mb-1">Meta Title</label>
                  {isEditing ? (
                    <input type="text" value={editData.metaTitle ?? ""} onChange={(e) => setEditData((d) => ({ ...d, metaTitle: e.target.value }))} className="w-full text-sm font-body bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20" placeholder="Enter meta title..." />
                  ) : (
                    <p className="text-sm font-body text-gray-700">{product.metaTitle || <span className="text-gray-400 italic">Not set</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-body text-gray-400 block mb-1">Meta Description</label>
                  {isEditing ? (
                    <textarea value={editData.metaDescription ?? ""} onChange={(e) => setEditData((d) => ({ ...d, metaDescription: e.target.value }))} rows={3} className="w-full text-sm font-body bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900/20 resize-y" placeholder="Enter meta description..." />
                  ) : (
                    <p className="text-sm font-body text-gray-700">{product.metaDescription || <span className="text-gray-400 italic">Not set</span>}</p>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-body text-gray-400 block mb-1">Keywords</label>
                  {product.keywords.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {product.keywords.map((kw, i) => (
                        <span key={i} className="text-[10px] font-body bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{kw}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-body text-gray-400 italic">No keywords set</p>
                  )}
                </div>
                <div className="bg-gray-50 rounded-lg p-3 mt-2">
                  <h4 className="text-xs font-bold text-gray-600 mb-2">SEO Score Breakdown</h4>
                  <ScoreBar label="SEO Score" score={product.seoScore} maxScore={25} />
                  <div className="mt-2">
                    <ScoreBar label="Description" score={product.descriptionScore} maxScore={35} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-body flex-wrap">
            <span>ID: <span className="font-mono">{product.id.slice(0, 12)}...</span></span>
            <span>SKU: {product.vendorSku ?? product.retailerSku ?? "—"}</span>
            <span>Created: {formatDate(product.createdAt)}</span>
            <span>Updated: {formatDate(product.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog Overlay (for push action) */}
      {confirmAction && confirmAction !== "reject" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Confirm action">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-bold font-heading mb-2">Confirm Action</h3>
            <p className="text-xs text-gray-500 font-body mb-4">
              Are you sure you want to {confirmAction} this product?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmAction(null)} className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold">Cancel</button>
              <button onClick={() => handleAction(confirmAction)} className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold">Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
