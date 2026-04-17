/**
 * ProductDetail — Product Review Workspace
 * ==========================================
 * Design: Detail-first layout (not quick-stats + tab-bar).
 * Full product review workspace with gallery, variant table,
 * price history, vendor info, enrichment status, and review actions.
 * Breadcrumb back-to-list navigation.
 *
 * Data normalization: The API returns fields like `salesPrice`,
 * `retailerCost`, `vendor.name`, `images[].altText`,
 * `variants[].inventoryQuantity`. This component normalizes
 * both API data and mock fallback data into a unified shape.
 */

import { useEffect, useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, CheckCircle, XCircle, Send, Image as ImageIcon,
  Tag, DollarSign, BarChart3, Package, Clock, AlertTriangle,
  Eye, Edit, History, Star, ShieldCheck, Globe, Layers,
  ChevronRight, ExternalLink,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface NormalizedVariant {
  id: string;
  size: string;
  color: string;
  sku: string;
  barcode: string;
  stock: number;
  price: number;
}

interface NormalizedPriceEntry {
  date: string;
  retailPrice: number;
  wholesalePrice: number;
  margin: number;
}

interface NormalizedProduct {
  id: string;
  title: string;
  brand: string;
  vendor: { id: string; companyName: string; country: string };
  category: string;
  subcategory: string;
  status: string;
  retailPrice: number;
  wholesalePrice: number;
  description: string;
  images: { url: string; alt: string; position: number }[];
  variants: NormalizedVariant[];
  priceHistory: NormalizedPriceEntry[];
  enrichmentScore: number;
  sku: string;
  shopifyProductId: string | null;
  syncStatus: string;
  lastSyncedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Normalizer — maps API shape → display shape                        */
/* ------------------------------------------------------------------ */

function normalizeProduct(raw: any): NormalizedProduct {
  // Determine retail price: API uses salesPrice or compareAtPrice
  const retailPrice =
    raw.retailPrice ?? raw.salesPrice ?? raw.compareAtPrice ?? 0;

  // Determine wholesale price: API uses retailerCost or vendorCost
  const wholesalePrice =
    raw.wholesalePrice ?? raw.retailerCost ?? raw.vendorCost ?? 0;

  // Normalize vendor
  const vendor = raw.vendor
    ? {
        id: raw.vendor.id ?? "",
        companyName: raw.vendor.companyName ?? raw.vendor.name ?? "Unknown Vendor",
        country: raw.vendor.country ?? raw.vendor.location ?? "—",
      }
    : { id: "", companyName: "Unknown Vendor", country: "—" };

  // Normalize images
  const images = (raw.images ?? []).map((img: any) => ({
    url: img.url ?? "",
    alt: img.alt ?? img.altText ?? "",
    position: img.position ?? 0,
  }));

  // Normalize variants
  const variants: NormalizedVariant[] = (raw.variants ?? []).map((v: any) => ({
    id: v.id ?? "",
    size: v.size ?? "—",
    color: v.color ?? "—",
    sku: v.sku ?? v.vendorSku ?? v.retailerSku ?? "—",
    barcode: v.barcode ?? "—",
    stock: v.stock ?? v.inventoryQuantity ?? 0,
    price: v.price ?? v.salesPrice ?? retailPrice,
  }));

  // Normalize price history
  const priceHistory: NormalizedPriceEntry[] = (raw.priceHistory ?? []).map(
    (entry: any) => ({
      date: entry.date ?? entry.createdAt ?? "",
      retailPrice: entry.retailPrice ?? entry.salesPrice ?? retailPrice,
      wholesalePrice:
        entry.wholesalePrice ?? entry.retailerCost ?? wholesalePrice,
      margin:
        entry.margin ??
        (entry.retailPrice || entry.salesPrice
          ? (
              (((entry.retailPrice ?? entry.salesPrice ?? 0) -
                (entry.wholesalePrice ?? entry.retailerCost ?? 0)) /
                (entry.retailPrice ?? entry.salesPrice ?? 1)) *
              100
            )
          : 0),
    })
  );

  // Determine sync status
  const syncStatus =
    raw.syncStatus ??
    (raw.shopifyProductId ? "SYNCED" : "NOT_SYNCED");

  return {
    id: raw.id ?? "",
    title: raw.title ?? raw.name ?? "Untitled Product",
    brand: raw.brand ?? "—",
    vendor,
    category: raw.category ?? "—",
    subcategory: raw.subcategory ?? "—",
    status: raw.status ?? "UNKNOWN",
    retailPrice,
    wholesalePrice,
    description: raw.description ?? raw.bodyHtml ?? "",
    images,
    variants,
    priceHistory,
    enrichmentScore: raw.enrichmentScore ?? 0,
    sku: raw.sku ?? raw.vendorSku ?? raw.retailerSku ?? "—",
    shopifyProductId: raw.shopifyProductId ?? null,
    syncStatus,
    lastSyncedAt: raw.lastSyncedAt ?? raw.publishedAt ?? null,
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Mock fallback data (used when API fails)                           */
/* ------------------------------------------------------------------ */

const MOCK_PRODUCT: any = {
  id: "mock-001",
  title: "Cashmere Double-Breasted Coat",
  brand: "Brunello Cucinelli",
  vendor: {
    id: "v1",
    name: "Julian Fashion S.p.A.",
    country: "IT",
  },
  category: "Women's Ready-to-Wear",
  subcategory: "Coats & Jackets",
  status: "PENDING_REVIEW",
  salesPrice: 4950,
  retailerCost: 2475,
  description:
    "Luxurious double-breasted cashmere coat with horn buttons, notched lapels, and a relaxed silhouette. Crafted in Italy from the finest Grade A cashmere. Features interior silk lining and hand-stitched finishing details.",
  images: [
    { url: "", altText: "Front view", position: 0 },
    { url: "", altText: "Back view", position: 1 },
    { url: "", altText: "Detail view", position: 2 },
  ],
  variants: [
    { id: "v1", size: "IT 38", color: "Camel", sku: "BC-COAT-38-CAM", barcode: "8051575012345", inventoryQuantity: 3, salesPrice: 4950 },
    { id: "v2", size: "IT 40", color: "Camel", sku: "BC-COAT-40-CAM", barcode: "8051575012346", inventoryQuantity: 5, salesPrice: 4950 },
    { id: "v3", size: "IT 42", color: "Camel", sku: "BC-COAT-42-CAM", barcode: "8051575012347", inventoryQuantity: 4, salesPrice: 4950 },
    { id: "v4", size: "IT 44", color: "Camel", sku: "BC-COAT-44-CAM", barcode: "8051575012348", inventoryQuantity: 2, salesPrice: 4950 },
    { id: "v5", size: "IT 40", color: "Charcoal", sku: "BC-COAT-40-CHR", barcode: "8051575012349", inventoryQuantity: 3, salesPrice: 4950 },
    { id: "v6", size: "IT 42", color: "Charcoal", sku: "BC-COAT-42-CHR", barcode: "8051575012350", inventoryQuantity: 2, salesPrice: 4950 },
  ],
  priceHistory: [
    { date: "2026-04-01", salesPrice: 4950, retailerCost: 2475 },
    { date: "2026-03-15", salesPrice: 4750, retailerCost: 2375 },
    { date: "2026-03-01", salesPrice: 4750, retailerCost: 2375 },
  ],
  enrichmentScore: 78,
  vendorSku: "BC-COAT-FW26",
  shopifyProductId: "gid://shopify/Product/8234567890",
  publishedAt: "2026-04-15T14:30:00Z",
  createdAt: "2026-03-01T10:00:00Z",
  updatedAt: "2026-04-15T14:30:00Z",
};

/* ------------------------------------------------------------------ */
/* Style maps                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  PENDING_REVIEW: "bg-amber-50 text-amber-700",
  NEEDS_REVIEW: "bg-amber-50 text-amber-700",
  QUALIFIED: "bg-teal-50 text-teal-700",
  APPROVED: "bg-green-50 text-green-700",
  PUBLISHED: "bg-blue-50 text-blue-700",
  PUSHED: "bg-blue-50 text-blue-700",
  REJECTED: "bg-red-50 text-red-700",
  ARCHIVED: "bg-gray-100 text-gray-500",
};

const SYNC_STYLES: Record<string, string> = {
  SYNCED: "bg-green-50 text-green-700",
  PENDING: "bg-amber-50 text-amber-700",
  FAILED: "bg-red-50 text-red-700",
  NOT_SYNCED: "bg-gray-100 text-gray-500",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ProductDetail() {
  const [, params] = useRoute("/products/:id");
  const [product, setProduct] = useState<NormalizedProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [activeTab, setActiveTab] = useState<"variants" | "pricing">("variants");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    api
      .getProduct(params.id)
      .then((data: any) => {
        setProduct(normalizeProduct(data));
        setLoading(false);
      })
      .catch(() => {
        // Fallback to mock data for development
        setProduct(normalizeProduct({ ...MOCK_PRODUCT, id: params.id }));
        setLoading(false);
      });
  }, [params?.id]);

  const handleAction = async (action: string) => {
    if (!product) return;
    setActionLoading(action);
    try {
      if (action === "approve") await api.approveProduct(product.id);
      else if (action === "reject") await api.rejectProduct(product.id);
      else if (action === "push") await api.pushProduct(product.id);
      // Reload
      const updated = await api.getProduct(product.id);
      setProduct(normalizeProduct(updated));
    } catch {
      // Mock status update
      const statusMap: Record<string, string> = {
        approve: "APPROVED",
        reject: "REJECTED",
        push: "PUBLISHED",
      };
      setProduct((p) =>
        p ? { ...p, status: statusMap[action] || p.status } : p
      );
    }
    setActionLoading(null);
    setConfirmAction(null);
  };

  // Derived values
  const margin = useMemo(() => {
    if (!product || product.retailPrice <= 0) return "0";
    if (product.retailPrice && product.wholesalePrice) {
      return (
        ((product.retailPrice - product.wholesalePrice) /
          product.retailPrice) *
        100
      ).toFixed(1);
    }
    return "0";
  }, [product]);

  const totalStock = useMemo(
    () =>
      product
        ? product.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0)
        : 0,
    [product]
  );

  /* Loading skeleton */
  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-64 bg-gray-200 rounded" />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-5 space-y-4">
            <div className="aspect-[3/4] bg-gray-100 rounded-lg" />
            <div className="h-20 bg-gray-100 rounded-lg" />
          </div>
          <div className="col-span-7 space-y-4">
            <div className="grid grid-cols-4 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-lg" />
              ))}
            </div>
            <div className="h-32 bg-gray-100 rounded-lg" />
            <div className="h-48 bg-gray-100 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6">
        <Link
          href="/products"
          className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4"
        >
          <ArrowLeft size={14} /> Back to Products
        </Link>
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  const canReview =
    product.status === "PENDING_REVIEW" || product.status === "NEEDS_REVIEW";

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Breadcrumb */}
      <nav
        className="flex items-center gap-1.5 text-xs font-body text-gray-400"
        aria-label="Breadcrumb"
      >
        <Link href="/products" className="hover:text-gray-600 transition-colors">
          Products
        </Link>
        <ChevronRight size={10} aria-hidden="true" />
        <span className="text-gray-700 font-medium">{product.title}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{product.title}</h1>
            <span
              className={cn(
                "text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase",
                STATUS_STYLES[product.status] || "bg-gray-100 text-gray-600"
              )}
            >
              {product.status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">
            {product.brand} — {product.category}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canReview && (
            <>
              {confirmAction === "reject" ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-red-700 font-body">
                    Confirm reject?
                  </span>
                  <button
                    onClick={() => handleAction("reject")}
                    className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmAction(null)}
                    className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs font-bold"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmAction("reject")}
                  disabled={!!actionLoading}
                  className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold font-body hover:bg-red-50 flex items-center gap-1.5 disabled:opacity-50"
                >
                  <XCircle size={12} /> Reject
                </button>
              )}
              <button
                onClick={() => handleAction("approve")}
                disabled={!!actionLoading}
                className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold font-body hover:bg-green-700 flex items-center gap-1.5 disabled:opacity-50"
              >
                {actionLoading === "approve" ? (
                  "Approving..."
                ) : (
                  <>
                    <CheckCircle size={12} /> Approve
                  </>
                )}
              </button>
            </>
          )}
          {product.status === "APPROVED" && (
            <button
              onClick={() => handleAction("push")}
              disabled={!!actionLoading}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold font-body hover:bg-blue-700 flex items-center gap-1.5 disabled:opacity-50"
            >
              {actionLoading === "push" ? (
                "Publishing..."
              ) : (
                <>
                  <Send size={12} /> Push to Shopify
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content — Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column — Gallery + Description */}
        <div className="lg:col-span-5 space-y-4">
          {/* Image Gallery */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center">
              {product.images[selectedImage]?.url ? (
                <img
                  src={product.images[selectedImage].url}
                  alt={product.images[selectedImage].alt || "Product image"}
                  className="w-full h-full object-cover"
                />
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
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={cn(
                      "w-14 h-14 rounded border-2 overflow-hidden flex-shrink-0",
                      i === selectedImage
                        ? "border-gray-900"
                        : "border-transparent opacity-60 hover:opacity-100"
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    {img.url ? (
                      <img
                        src={img.url}
                        alt={img.alt || `Thumbnail ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                        <ImageIcon size={12} className="text-gray-300" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-2">
              Description
            </h3>
            <p className="text-sm font-body text-gray-700 leading-relaxed">
              {product.description || "No description available."}
            </p>
          </div>
        </div>

        {/* Right Column — Details + Tabs */}
        <div className="lg:col-span-7 space-y-4">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <DollarSign size={12} className="text-green-500 mb-1" />
              <p className="text-lg font-bold font-body">
                ${product.retailPrice.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 font-body">
                Retail Price
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <Tag size={12} className="text-blue-500 mb-1" />
              <p className="text-lg font-bold font-body">
                ${product.wholesalePrice.toLocaleString()}
              </p>
              <p className="text-[10px] text-gray-400 font-body">Wholesale</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <BarChart3 size={12} className="text-purple-500 mb-1" />
              <p className="text-lg font-bold font-body">{margin}%</p>
              <p className="text-[10px] text-gray-400 font-body">Margin</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-3">
              <Package size={12} className="text-orange-500 mb-1" />
              <p className="text-lg font-bold font-body">{totalStock}</p>
              <p className="text-[10px] text-gray-400 font-body">
                Total Stock
              </p>
            </div>
          </div>

          {/* Product Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Vendor Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">
                Vendor
              </h3>
              <Link
                href={`/vendors/${product.vendor.id}`}
                className="flex items-center gap-2 group"
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                  {product.vendor.companyName.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors">
                    {product.vendor.companyName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-body flex items-center gap-1">
                    <Globe size={8} /> {product.vendor.country}
                  </p>
                </div>
                <ExternalLink
                  size={10}
                  className="text-gray-300 ml-auto group-hover:text-blue-500"
                />
              </Link>
            </div>

            {/* Sync Status Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">
                Shopify Sync
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full",
                    SYNC_STYLES[product.syncStatus] ||
                      "bg-gray-100 text-gray-500"
                  )}
                >
                  {product.syncStatus.replace(/_/g, " ")}
                </span>
              </div>
              {product.shopifyProductId && (
                <p className="text-[10px] text-gray-400 font-body font-mono">
                  {product.shopifyProductId}
                </p>
              )}
              {product.lastSyncedAt && (
                <p className="text-[10px] text-gray-400 font-body mt-1">
                  Last synced:{" "}
                  {new Date(product.lastSyncedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </p>
              )}
            </div>
          </div>

          {/* Enrichment Score */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide">
                Enrichment Score
              </h3>
              <span
                className={cn(
                  "text-xs font-bold font-body",
                  product.enrichmentScore >= 80
                    ? "text-green-600"
                    : product.enrichmentScore >= 50
                      ? "text-amber-600"
                      : "text-red-600"
                )}
              >
                {product.enrichmentScore}%
              </span>
            </div>
            <div
              className="w-full h-2 bg-gray-100 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={product.enrichmentScore}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Enrichment score"
            >
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  product.enrichmentScore >= 80
                    ? "bg-green-500"
                    : product.enrichmentScore >= 50
                      ? "bg-amber-500"
                      : "bg-red-500"
                )}
                style={{ width: `${product.enrichmentScore}%` }}
              />
            </div>
            <div className="flex justify-between mt-2">
              {[
                { label: "Images", filled: product.images.length > 0 },
                { label: "Description", filled: !!product.description },
                { label: "Variants", filled: product.variants.length > 0 },
                { label: "SEO", filled: product.enrichmentScore >= 60 },
                { label: "Compliance", filled: product.enrichmentScore >= 40 },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-1">
                  <div
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      item.filled ? "bg-green-500" : "bg-gray-300"
                    )}
                  />
                  <span className="text-[9px] text-gray-400 font-body">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Tabs: Variants / Pricing */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="flex border-b border-gray-100" role="tablist">
              {[
                {
                  key: "variants" as const,
                  label: "Variants",
                  icon: Layers,
                  count: product.variants.length,
                },
                {
                  key: "pricing" as const,
                  label: "Price History",
                  icon: History,
                  count: product.priceHistory.length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={activeTab === tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-4 py-3 text-xs font-semibold font-body flex items-center gap-1.5 border-b-2 transition-colors",
                    activeTab === tab.key
                      ? "border-gray-900 text-gray-900"
                      : "border-transparent text-gray-400 hover:text-gray-600"
                  )}
                >
                  <tab.icon size={12} /> {tab.label}
                  <span className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-full ml-1">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {activeTab === "variants" && (
              <div role="tabpanel" aria-label="Variants">
                {product.variants.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Size</th>
                        <th>Color</th>
                        <th>SKU</th>
                        <th>Barcode</th>
                        <th className="text-right">Stock</th>
                        <th className="text-right">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.variants.map((v) => (
                        <tr key={v.id}>
                          <td className="text-xs font-body font-medium">
                            {v.size}
                          </td>
                          <td className="text-xs font-body">{v.color}</td>
                          <td className="text-xs font-body font-mono text-gray-500">
                            {v.sku}
                          </td>
                          <td className="text-xs font-body font-mono text-gray-400">
                            {v.barcode}
                          </td>
                          <td className="text-xs font-body text-right">
                            <span
                              className={cn(
                                v.stock <= 2
                                  ? "text-red-600 font-bold"
                                  : "text-gray-700"
                              )}
                            >
                              {v.stock}
                            </span>
                          </td>
                          <td className="text-xs font-body text-right font-medium">
                            ${v.price.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <Layers
                      size={24}
                      className="mx-auto mb-2 text-gray-300"
                    />
                    <p className="text-xs font-body">No variants defined</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "pricing" && (
              <div role="tabpanel" aria-label="Price History">
                {product.priceHistory.length > 0 ? (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th className="text-right">Retail</th>
                        <th className="text-right">Wholesale</th>
                        <th className="text-right">Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {product.priceHistory.map((entry, i) => (
                        <tr key={i}>
                          <td className="text-xs font-body">
                            {entry.date
                              ? new Date(entry.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : "—"}
                          </td>
                          <td className="text-xs font-body text-right font-medium">
                            ${entry.retailPrice.toLocaleString()}
                          </td>
                          <td className="text-xs font-body text-right">
                            ${entry.wholesalePrice.toLocaleString()}
                          </td>
                          <td className="text-xs font-body text-right">
                            {typeof entry.margin === "number"
                              ? `${entry.margin.toFixed(1)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="p-8 text-center text-gray-400">
                    <History
                      size={24}
                      className="mx-auto mb-2 text-gray-300"
                    />
                    <p className="text-xs font-body">
                      No price history available
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata Footer */}
          <div className="flex items-center gap-4 text-[10px] text-gray-400 font-body flex-wrap">
            <span>SKU: {product.sku}</span>
            <span>
              Created:{" "}
              {product.createdAt
                ? new Date(product.createdAt).toLocaleDateString()
                : "—"}
            </span>
            <span>
              Updated:{" "}
              {product.updatedAt
                ? new Date(product.updatedAt).toLocaleDateString()
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Confirm Dialog Overlay */}
      {confirmAction && confirmAction !== "reject" && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Confirm action"
        >
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-bold font-heading mb-2">
              Confirm Action
            </h3>
            <p className="text-xs text-gray-500 font-body mb-4">
              Are you sure you want to {confirmAction} this product?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmAction)}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
