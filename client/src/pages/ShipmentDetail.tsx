/**
 * ShipmentDetail — Shipment Exception Workspace
 * ================================================
 * Design: Workflow-first layout (not quick-stats + tab-bar).
 * Focused on tracking timeline, exception handling, customs holds,
 * notes, and related order/vendor context.
 * Breadcrumb back-to-list navigation.
 *
 * Data normalization: The API returns fields like `shippingCost`,
 * `costCurrency`, `vendor.name`, `vendorOrder.order.orderNumber`.
 * This component normalizes both API and mock fallback data.
 */

import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ChevronRight, Truck, Package, AlertTriangle,
  MapPin, Clock, CheckCircle, XCircle, FileText, MessageSquare,
  Globe, ExternalLink, RefreshCw, Ban, Navigation, Plane,
  Building2, ShieldAlert, Send,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface NormalizedTrackingEvent {
  id: string;
  timestamp: string;
  status: string;
  location: string;
  description: string;
  isException: boolean;
}

interface NormalizedShipment {
  id: string;
  trackingNumber: string;
  carrier: string;
  status: string;
  leg: string;
  shippingModel: string;
  cost: number;
  currency: string;
  vendor: { id: string; companyName: string; country: string };
  order: { id: string; orderNumber: string };
  items: { name: string; sku: string; quantity: number }[];
  trackingEvents: NormalizedTrackingEvent[];
  exceptions: { type: string; description: string; severity: string; resolvedAt: string | null }[];
  labelUrl: string | null;
  labelGeneratedAt: string | null;
  labelVoidedAt: string | null;
  estimatedDelivery: string | null;
  parentShipment: { id: string; trackingNumber: string } | null;
  childShipments: { id: string; trackingNumber: string; status: string }[];
  notes: { author: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Normalizer                                                          */
/* ------------------------------------------------------------------ */

function normalizeShipment(raw: any): NormalizedShipment {
  // Vendor normalization
  const vendor = raw.vendor
    ? {
        id: raw.vendor.id ?? "",
        companyName: raw.vendor.companyName ?? raw.vendor.name ?? "Unknown Vendor",
        country: raw.vendor.country ?? raw.vendor.location ?? "—",
      }
    : { id: "", companyName: "Unknown Vendor", country: "—" };

  // Order normalization — API nests order inside vendorOrder
  const vendorOrder = raw.vendorOrder;
  const order = raw.order
    ? { id: raw.order.id ?? "", orderNumber: raw.order.orderNumber ?? "—" }
    : vendorOrder?.order
      ? { id: vendorOrder.order.id ?? "", orderNumber: vendorOrder.order.orderNumber ?? "—" }
      : { id: "", orderNumber: "—" };

  // Items normalization — API nests items inside vendorOrder
  const rawItems = raw.items ?? vendorOrder?.items ?? [];
  const items = rawItems.map((item: any) => ({
    name: item.name ?? item.product?.title ?? "Unknown Item",
    sku: item.sku ?? item.vendorSku ?? "—",
    quantity: item.quantity ?? 1,
  }));

  // Tracking events normalization
  const trackingEvents: NormalizedTrackingEvent[] = (raw.trackingEvents ?? []).map((e: any, i: number) => ({
    id: e.id ?? `te-${i}`,
    timestamp: e.timestamp ?? e.createdAt ?? "",
    status: e.status ?? "UNKNOWN",
    location: e.location ?? "—",
    description: e.description ?? e.message ?? e.status ?? "—",
    isException: e.isException ?? e.status === "EXCEPTION",
  }));

  // Child shipments
  const childShipments = (raw.childShipments ?? []).map((c: any) => ({
    id: c.id ?? "",
    trackingNumber: c.trackingNumber ?? "—",
    status: c.status ?? "UNKNOWN",
  }));

  // Parent shipment
  const parentShipment = raw.parentShipment
    ? { id: raw.parentShipment.id ?? "", trackingNumber: raw.parentShipment.trackingNumber ?? "—" }
    : raw.parentShipmentId
      ? { id: raw.parentShipmentId, trackingNumber: "—" }
      : null;

  return {
    id: raw.id ?? "",
    trackingNumber: raw.trackingNumber ?? "—",
    carrier: raw.carrier ?? "—",
    status: raw.status ?? "UNKNOWN",
    leg: raw.leg ?? "—",
    shippingModel: raw.shippingModel ?? "—",
    cost: raw.cost ?? raw.shippingCost ?? 0,
    currency: raw.currency ?? raw.costCurrency ?? "USD",
    vendor,
    order,
    items,
    trackingEvents,
    exceptions: raw.exceptions ?? [],
    labelUrl: raw.labelUrl ?? null,
    labelGeneratedAt: raw.labelGeneratedAt ?? null,
    labelVoidedAt: raw.labelVoidedAt ?? null,
    estimatedDelivery: raw.estimatedDelivery ?? null,
    parentShipment,
    childShipments,
    notes: raw.notes ?? [],
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Mock fallback                                                       */
/* ------------------------------------------------------------------ */

const MOCK_SHIPMENT: any = {
  id: "mock-ship-001",
  trackingNumber: "FX-9284756103",
  carrier: "FedEx",
  status: "CUSTOMS_HOLD",
  leg: "INTERNATIONAL",
  shippingModel: "MARKETPLACE",
  shippingCost: 45.80,
  costCurrency: "USD",
  vendor: { id: "v1", name: "Julian Fashion S.p.A.", country: "IT" },
  vendorOrder: {
    order: { id: "ord-1", orderNumber: "LT-2026-0042" },
    items: [
      { product: { title: "Cashmere Double-Breasted Coat" }, sku: "BC-COAT-42-CAM", quantity: 1 },
      { product: { title: "Silk Pocket Square Set" }, sku: "BC-SQ-SET-01", quantity: 2 },
    ],
  },
  trackingEvents: [
    { id: "e1", timestamp: "2026-04-16T18:30:00Z", status: "CUSTOMS_HOLD", location: "JFK International, NY", description: "Package held at customs — documentation review required", isException: true },
    { id: "e2", timestamp: "2026-04-16T06:15:00Z", status: "IN_TRANSIT", location: "Paris CDG Hub", description: "Departed Paris hub, en route to JFK", isException: false },
    { id: "e3", timestamp: "2026-04-15T14:00:00Z", status: "IN_TRANSIT", location: "Milan MXP", description: "Package arrived at Milan sorting facility", isException: false },
    { id: "e4", timestamp: "2026-04-15T09:30:00Z", status: "PICKED_UP", location: "Milan, Italy", description: "Package picked up from vendor warehouse", isException: false },
    { id: "e5", timestamp: "2026-04-14T16:00:00Z", status: "LABEL_CREATED", location: "System", description: "Shipping label generated", isException: false },
  ],
  exceptions: [
    { type: "CUSTOMS_HOLD", description: "Missing commercial invoice for luxury goods declaration. Customs requires itemized invoice with HS codes.", severity: "HIGH", resolvedAt: null },
  ],
  labelUrl: "https://labels.example.com/FX-9284756103.pdf",
  estimatedDelivery: "2026-04-19",
  notes: [
    { author: "ops@lordandtaylor.com", text: "Contacted FedEx customs team. They need commercial invoice with HS codes for each item.", createdAt: "2026-04-16T19:00:00Z" },
  ],
  createdAt: "2026-04-14T16:00:00Z",
  updatedAt: "2026-04-16T18:30:00Z",
};

/* ------------------------------------------------------------------ */
/* Style maps                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  LABEL_CREATED: "bg-gray-100 text-gray-600",
  PICKED_UP: "bg-blue-50 text-blue-700",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  CUSTOMS_HOLD: "bg-amber-50 text-amber-700",
  OUT_FOR_DELIVERY: "bg-green-50 text-green-700",
  DELIVERED: "bg-green-50 text-green-700",
  EXCEPTION: "bg-red-50 text-red-700",
  LABEL_VOIDED: "bg-gray-100 text-gray-500",
  RETURNED: "bg-purple-50 text-purple-700",
};

const SEVERITY_STYLES: Record<string, string> = {
  LOW: "bg-blue-50 text-blue-600 border-blue-200",
  MEDIUM: "bg-amber-50 text-amber-600 border-amber-200",
  HIGH: "bg-red-50 text-red-600 border-red-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-300",
};

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ShipmentDetail() {
  const [, params] = useRoute("/shipping/:id");
  const [shipment, setShipment] = useState<NormalizedShipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [confirmVoid, setConfirmVoid] = useState(false);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    api.getShipment(params.id).then((data: any) => {
      setShipment(normalizeShipment(data));
      setLoading(false);
    }).catch(() => {
      setShipment(normalizeShipment({ ...MOCK_SHIPMENT, id: params.id }));
      setLoading(false);
    });
  }, [params?.id]);

  if (loading) {
    return (
      <div className="p-6 animate-pulse space-y-4">
        <div className="h-4 w-32 bg-gray-200 rounded" />
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="grid grid-cols-12 gap-5">
          <div className="col-span-7 h-64 bg-gray-100 rounded-lg" />
          <div className="col-span-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-100 rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div className="p-6">
        <Link href="/shipping" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Back to Shipping
        </Link>
        <p className="text-gray-500">Shipment not found.</p>
      </div>
    );
  }

  const hasExceptions = shipment.exceptions.some((e) => !e.resolvedAt);

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400" aria-label="Breadcrumb">
        <Link href="/shipping" className="hover:text-gray-600 transition-colors">Shipping</Link>
        <ChevronRight size={10} aria-hidden="true" />
        <span className="text-gray-700 font-medium">{shipment.trackingNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{shipment.trackingNumber}</h1>
            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase", STATUS_STYLES[shipment.status] || "bg-gray-100 text-gray-600")}>
              {shipment.status.replace(/_/g, " ")}
            </span>
            {hasExceptions && (
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <AlertTriangle size={9} /> EXCEPTION
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">{shipment.carrier} — {shipment.leg.replace(/_/g, " ")} — {shipment.shippingModel.replace(/_/g, " ")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
            <RefreshCw size={12} /> Refresh Tracking
          </button>
          {shipment.labelUrl && !shipment.labelVoidedAt && (
            <>
              <a href={shipment.labelUrl} target="_blank" rel="noopener noreferrer" className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
                <FileText size={12} /> View Label
              </a>
              {confirmVoid ? (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <span className="text-xs text-red-700 font-body">Void label?</span>
                  <button className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Yes</button>
                  <button onClick={() => setConfirmVoid(false)} className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs font-bold">No</button>
                </div>
              ) : (
                <button onClick={() => setConfirmVoid(true)} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold font-body hover:bg-red-50 flex items-center gap-1.5">
                  <Ban size={12} /> Void Label
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Exception Alert Banner */}
      {hasExceptions && (
        <div className="space-y-2">
          {shipment.exceptions.filter((e) => !e.resolvedAt).map((exc, i) => (
            <div key={i} className={cn("border rounded-lg p-4 flex items-start gap-3", SEVERITY_STYLES[exc.severity] || "bg-gray-50 text-gray-600 border-gray-200")}>
              <ShieldAlert size={16} className="flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold uppercase">{exc.type.replace(/_/g, " ")}</span>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/50">{exc.severity}</span>
                </div>
                <p className="text-xs font-body">{exc.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Content — Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column — Tracking Timeline */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-4">Tracking Timeline</h3>
            {shipment.trackingEvents.length > 0 ? (
              <div className="space-y-0">
                {shipment.trackingEvents.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 flex-shrink-0",
                        event.isException ? "bg-red-500 border-red-500" :
                        i === 0 ? "bg-blue-500 border-blue-500" :
                        "bg-white border-gray-300"
                      )} />
                      {i < shipment.trackingEvents.length - 1 && (
                        <div className={cn("w-0.5 flex-1 min-h-[32px]", event.isException ? "bg-red-200" : "bg-gray-200")} />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("text-xs font-semibold font-body", event.isException ? "text-red-700" : "text-gray-800")}>{event.description}</p>
                        {event.isException && <AlertTriangle size={10} className="text-red-500" />}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-body flex items-center gap-1"><MapPin size={8} /> {event.location}</span>
                        <span className="text-[10px] text-gray-400 font-body flex items-center gap-1">
                          <Clock size={8} /> {event.timestamp ? new Date(event.timestamp).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Truck size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-body">No tracking events yet</p>
              </div>
            )}
          </div>

          {/* Notes Section */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Notes & Communication</h3>
            {shipment.notes.length > 0 ? (
              <div className="space-y-3 mb-4">
                {shipment.notes.map((note, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold font-body text-gray-600">{note.author}</span>
                      <span className="text-[10px] text-gray-400 font-body">{note.createdAt ? new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}</span>
                    </div>
                    <p className="text-xs font-body text-gray-700">{note.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-body mb-4">No notes yet.</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Add a note"
              />
              <button className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5">
                <Send size={10} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Column — Context Cards */}
        <div className="lg:col-span-5 space-y-4">
          {/* Shipment Info */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Shipment Details</h3>
            <div className="space-y-2">
              {[
                { label: "Carrier", value: shipment.carrier, icon: Truck },
                { label: "Leg", value: shipment.leg.replace(/_/g, " "), icon: Plane },
                { label: "Model", value: shipment.shippingModel.replace(/_/g, " "), icon: Navigation },
                { label: "Cost", value: `$${shipment.cost.toFixed(2)} ${shipment.currency}`, icon: FileText },
                { label: "Est. Delivery", value: shipment.estimatedDelivery ? new Date(shipment.estimatedDelivery).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—", icon: Clock },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between py-1.5">
                  <span className="text-[10px] text-gray-400 font-body flex items-center gap-1.5"><item.icon size={10} /> {item.label}</span>
                  <span className="text-xs font-medium font-body">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Order Context */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Order</h3>
            {shipment.order.id ? (
              <Link href={`/orders/${shipment.order.id}`} className="flex items-center justify-between group">
                <span className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors">{shipment.order.orderNumber}</span>
                <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-500" />
              </Link>
            ) : (
              <p className="text-xs text-gray-400 font-body">No linked order</p>
            )}
          </div>

          {/* Vendor Context */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Vendor</h3>
            <Link href={`/vendors/${shipment.vendor.id}`} className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                {shipment.vendor.companyName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors">{shipment.vendor.companyName}</p>
                <p className="text-[10px] text-gray-400 font-body flex items-center gap-1"><Globe size={8} /> {shipment.vendor.country}</p>
              </div>
              <ExternalLink size={10} className="text-gray-300 ml-auto group-hover:text-blue-500" />
            </Link>
          </div>

          {/* Items */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Items ({shipment.items.length})</h3>
            {shipment.items.length > 0 ? (
              <div className="space-y-2">
                {shipment.items.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-xs font-medium font-body">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-body font-mono">{item.sku}</p>
                    </div>
                    <span className="text-xs font-body text-gray-500">&times;{item.quantity}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-400 font-body">No items listed</p>
            )}
          </div>

          {/* Related Shipments */}
          {(shipment.parentShipment || shipment.childShipments.length > 0) && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Related Shipments</h3>
              {shipment.parentShipment && (
                <Link href={`/shipping/${shipment.parentShipment.id}`} className="flex items-center justify-between py-1.5 group">
                  <span className="text-xs font-body text-gray-500">Parent:</span>
                  <span className="text-xs font-semibold font-body group-hover:text-blue-600">{shipment.parentShipment.trackingNumber}</span>
                </Link>
              )}
              {shipment.childShipments.map((child) => (
                <Link key={child.id} href={`/shipping/${child.id}`} className="flex items-center justify-between py-1.5 group">
                  <span className="text-xs font-body text-gray-500">Split:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold font-body group-hover:text-blue-600">{child.trackingNumber}</span>
                    <span className={cn("text-[9px] font-bold px-1.5 py-0.5 rounded-full", STATUS_STYLES[child.status] || "bg-gray-100 text-gray-500")}>{child.status.replace(/_/g, " ")}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
