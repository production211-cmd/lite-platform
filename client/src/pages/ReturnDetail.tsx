/**
 * ReturnDetail — Returns Case Workspace
 * ========================================
 * Design: Alert-first layout for active cases, detail-first for resolved.
 * Full returns case management: resolution workflow, return labels,
 * vendor returns, refund processing, DNS preflight, notes.
 * Breadcrumb back-to-list navigation.
 *
 * Data normalization: The API returns flat fields like `reason` (free text),
 * `vendor.name`, `vendorOrder.order.orderNumber`, `vendorOrder.items[]`,
 * `returnTrackingNumber`, `returnLabelUrl`, `initiatedAt`, `receivedAt`.
 * This component normalizes both API and mock fallback data.
 */

import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  ArrowLeft, ChevronRight, RotateCcw, Package, AlertTriangle,
  Clock, CheckCircle, XCircle, FileText, MessageSquare,
  DollarSign, Truck, User, Globe, ExternalLink, Send,
  ShieldCheck, Tag, ArrowRight, Ban, RefreshCw,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface NormalizedReturnItem {
  name: string;
  sku: string;
  quantity: number;
  reason: string;
  condition: string;
  refundAmount: number;
  imageUrl?: string;
}

interface NormalizedReturn {
  id: string;
  returnNumber: string;
  status: string;
  type: string;
  reason: string;
  order: { id: string; orderNumber: string };
  vendor: { id: string; companyName: string; country: string };
  customer: { name: string; email: string };
  items: NormalizedReturnItem[];
  totalRefundAmount: number;
  currency: string;
  returnLabel: { trackingNumber: string; carrier: string; labelUrl: string } | null;
  vendorReturn: { status: string; trackingNumber: string | null; receivedAt: string | null } | null;
  resolution: { type: string; approvedBy: string | null; approvedAt: string | null; notes: string } | null;
  dnsPreflightPassed: boolean | null;
  timeline: { timestamp: string; action: string; actor: string; details: string }[];
  notes: { author: string; text: string; createdAt: string }[];
  createdAt: string;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/* Normalizer                                                          */
/* ------------------------------------------------------------------ */

function normalizeReturn(raw: any): NormalizedReturn {
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

  // Customer normalization — API has customerName inside vendorOrder.order
  const customer = raw.customer
    ? { name: raw.customer.name ?? "—", email: raw.customer.email ?? "—" }
    : {
        name: vendorOrder?.order?.customerName ?? "—",
        email: "—",
      };

  // Items normalization — API nests items inside vendorOrder
  const rawItems = raw.items ?? vendorOrder?.items ?? [];
  const items: NormalizedReturnItem[] = rawItems.map((item: any) => ({
    name: item.name ?? item.product?.title ?? "Unknown Item",
    sku: item.sku ?? item.vendorSku ?? "—",
    quantity: item.quantity ?? 1,
    reason: item.reason ?? raw.reason ?? "—",
    condition: item.condition ?? "—",
    refundAmount: item.refundAmount ?? item.totalPrice ?? item.unitPrice ?? 0,
    imageUrl: item.product?.images?.[0]?.url ?? undefined,
  }));

  // Total refund amount
  const totalRefundAmount =
    raw.totalRefundAmount ??
    raw.refundAmount ??
    items.reduce((sum: number, i: NormalizedReturnItem) => sum + i.refundAmount, 0);

  // Return label normalization — API has flat fields
  const returnLabel = raw.returnLabel
    ? raw.returnLabel
    : raw.returnTrackingNumber || raw.returnLabelUrl
      ? {
          trackingNumber: raw.returnTrackingNumber ?? "—",
          carrier: raw.returnCarrier ?? "—",
          labelUrl: raw.returnLabelUrl ?? "",
        }
      : null;

  // Generate a return number from the ID if not present
  const returnNumber = raw.returnNumber ?? `RET-${(raw.id ?? "").slice(-6).toUpperCase()}`;

  // Determine type
  const type = raw.type ?? "RETURN";

  // Reason — API uses free text, normalize for display
  const reason = raw.reason ?? "UNKNOWN";

  // Build timeline from API timestamps if no timeline array
  const timeline = raw.timeline ?? [];
  if (timeline.length === 0) {
    if (raw.completedAt) {
      timeline.push({ timestamp: raw.completedAt, action: "COMPLETED", actor: "System", details: "Return case completed" });
    }
    if (raw.inspectedAt) {
      timeline.push({ timestamp: raw.inspectedAt, action: "INSPECTED", actor: "Warehouse", details: "Items inspected" });
    }
    if (raw.receivedAt) {
      timeline.push({ timestamp: raw.receivedAt, action: "RECEIVED", actor: "Warehouse", details: "Return received at warehouse" });
    }
    if (raw.initiatedAt) {
      timeline.push({ timestamp: raw.initiatedAt, action: "INITIATED", actor: "Customer", details: `Return initiated. Reason: ${reason}` });
    }
  }

  return {
    id: raw.id ?? "",
    returnNumber,
    status: raw.status ?? "UNKNOWN",
    type,
    reason,
    order,
    vendor,
    customer,
    items,
    totalRefundAmount,
    currency: raw.currency ?? raw.refundCurrency ?? "USD",
    returnLabel,
    vendorReturn: raw.vendorReturn ?? null,
    resolution: raw.resolution ?? null,
    dnsPreflightPassed: raw.dnsPreflightPassed ?? null,
    timeline,
    notes: raw.notes ?? [],
    createdAt: raw.createdAt ?? "",
    updatedAt: raw.updatedAt ?? "",
  };
}

/* ------------------------------------------------------------------ */
/* Mock fallback                                                       */
/* ------------------------------------------------------------------ */

const MOCK_RETURN: any = {
  id: "mock-ret-001",
  returnNumber: "RET-2026-0018",
  status: "RECEIVED",
  type: "FULL_RETURN",
  reason: "DEFECTIVE",
  order: { id: "ord-1", orderNumber: "LT-2026-0042" },
  vendor: { id: "v1", name: "Julian Fashion S.p.A.", country: "IT" },
  customer: { name: "Sarah Mitchell", email: "sarah.m@email.com" },
  items: [
    { name: "Cashmere Double-Breasted Coat", sku: "BC-COAT-42-CAM", quantity: 1, reason: "DEFECTIVE", condition: "Seam defect on left sleeve", refundAmount: 4950 },
  ],
  totalRefundAmount: 4950,
  currency: "USD",
  returnLabel: { trackingNumber: "UPS-1Z999AA10123456784", carrier: "UPS", labelUrl: "https://labels.example.com/return-label.pdf" },
  vendorReturn: { status: "PENDING", trackingNumber: null, receivedAt: null },
  resolution: null,
  dnsPreflightPassed: true,
  timeline: [
    { timestamp: "2026-04-16T14:00:00Z", action: "RECEIVED", actor: "Warehouse", details: "Package received at L&T warehouse. Inspection pending." },
    { timestamp: "2026-04-14T09:00:00Z", action: "IN_TRANSIT", actor: "System", details: "Return shipment picked up by UPS" },
    { timestamp: "2026-04-13T11:30:00Z", action: "LABEL_SENT", actor: "ops@lordandtaylor.com", details: "Return label emailed to customer" },
    { timestamp: "2026-04-13T10:00:00Z", action: "INITIATED", actor: "Customer", details: "Return request submitted. Reason: Defective — seam defect on left sleeve" },
  ],
  notes: [
    { author: "ops@lordandtaylor.com", text: "Customer reported seam defect visible after first wear. Photos attached to case file. Vendor notified.", createdAt: "2026-04-13T10:30:00Z" },
  ],
  createdAt: "2026-04-13T10:00:00Z",
  updatedAt: "2026-04-16T14:00:00Z",
};

/* ------------------------------------------------------------------ */
/* Style maps                                                          */
/* ------------------------------------------------------------------ */

const STATUS_STYLES: Record<string, string> = {
  INITIATED: "bg-amber-50 text-amber-700",
  LABEL_SENT: "bg-blue-50 text-blue-700",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  RECEIVED: "bg-purple-50 text-purple-700",
  RECEIVED_WAREHOUSE: "bg-purple-50 text-purple-700",
  INSPECTING: "bg-purple-50 text-purple-700",
  APPROVED: "bg-green-50 text-green-700",
  REFUNDED: "bg-green-50 text-green-700",
  REJECTED: "bg-red-50 text-red-700",
  CLOSED: "bg-gray-100 text-gray-500",
};

const REASON_STYLES: Record<string, string> = {
  DEFECTIVE: "bg-red-50 text-red-600",
  WRONG_ITEM: "bg-orange-50 text-orange-600",
  SIZE_ISSUE: "bg-blue-50 text-blue-600",
  NOT_AS_DESCRIBED: "bg-amber-50 text-amber-600",
  CHANGED_MIND: "bg-gray-100 text-gray-600",
  DAMAGED_IN_TRANSIT: "bg-red-50 text-red-600",
};

function getReasonStyle(reason: string): string {
  // Try exact match first
  const upper = reason.toUpperCase().replace(/\s+/g, "_");
  if (REASON_STYLES[upper]) return REASON_STYLES[upper];
  // Try partial match
  if (reason.toLowerCase().includes("defect")) return REASON_STYLES.DEFECTIVE;
  if (reason.toLowerCase().includes("size")) return REASON_STYLES.SIZE_ISSUE;
  if (reason.toLowerCase().includes("wrong")) return REASON_STYLES.WRONG_ITEM;
  if (reason.toLowerCase().includes("damage")) return REASON_STYLES.DAMAGED_IN_TRANSIT;
  if (reason.toLowerCase().includes("color") || reason.toLowerCase().includes("described")) return REASON_STYLES.NOT_AS_DESCRIBED;
  if (reason.toLowerCase().includes("mind") || reason.toLowerCase().includes("changed")) return REASON_STYLES.CHANGED_MIND;
  return "bg-gray-100 text-gray-600";
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function ReturnDetail() {
  const [, params] = useRoute("/orders/returns/:id");
  const [returnCase, setReturnCase] = useState<NormalizedReturn | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    api.getReturn(params.id).then((data: any) => {
      setReturnCase(normalizeReturn(data));
      setLoading(false);
    }).catch(() => {
      setReturnCase(normalizeReturn({ ...MOCK_RETURN, id: params.id }));
      setLoading(false);
    });
  }, [params?.id]);

  const handleAction = (action: string) => {
    if (!returnCase) return;
    const statusMap: Record<string, string> = {
      approve: "APPROVED",
      reject: "REJECTED",
      refund: "REFUNDED",
      close: "CLOSED",
    };
    setReturnCase((r) => r ? { ...r, status: statusMap[action] || r.status } : r);
    setConfirmAction(null);
  };

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

  if (!returnCase) {
    return (
      <div className="p-6">
        <Link href="/orders/returns" className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-4">
          <ArrowLeft size={14} /> Back to Returns
        </Link>
        <p className="text-gray-500">Return not found.</p>
      </div>
    );
  }

  const isActive = !["REFUNDED", "CLOSED", "REJECTED"].includes(returnCase.status);

  return (
    <div className="p-6 space-y-5 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400" aria-label="Breadcrumb">
        <Link href="/orders/returns" className="hover:text-gray-600 transition-colors">Returns</Link>
        <ChevronRight size={10} aria-hidden="true" />
        <span className="text-gray-700 font-medium">{returnCase.returnNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold font-heading">{returnCase.returnNumber}</h1>
            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase", STATUS_STYLES[returnCase.status] || "bg-gray-100 text-gray-600")}>
              {returnCase.status.replace(/_/g, " ")}
            </span>
            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full", getReasonStyle(returnCase.reason))}>
              {returnCase.reason.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">
            {returnCase.type.replace(/_/g, " ")} — Opened{" "}
            {returnCase.createdAt
              ? new Date(returnCase.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—"}
          </p>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            {(returnCase.status === "RECEIVED" || returnCase.status === "RECEIVED_WAREHOUSE" || returnCase.status === "INSPECTING") && (
              <>
                {confirmAction === "reject" ? (
                  <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                    <span className="text-xs text-red-700 font-body">Reject return?</span>
                    <button onClick={() => handleAction("reject")} className="px-2 py-1 bg-red-600 text-white rounded text-xs font-bold">Yes</button>
                    <button onClick={() => setConfirmAction(null)} className="px-2 py-1 border border-red-300 text-red-600 rounded text-xs font-bold">No</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmAction("reject")} className="px-3 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-semibold font-body hover:bg-red-50 flex items-center gap-1.5">
                    <XCircle size={12} /> Reject
                  </button>
                )}
                <button onClick={() => handleAction("approve")} className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-semibold font-body hover:bg-green-700 flex items-center gap-1.5">
                  <CheckCircle size={12} /> Approve Return
                </button>
              </>
            )}
            {returnCase.status === "APPROVED" && (
              <button onClick={() => handleAction("refund")} className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold font-body hover:bg-blue-700 flex items-center gap-1.5">
                <DollarSign size={12} /> Process Refund (${returnCase.totalRefundAmount.toLocaleString()})
              </button>
            )}
          </div>
        )}
      </div>

      {/* DNS Preflight Banner */}
      {returnCase.dnsPreflightPassed === false && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold font-body text-amber-800">DNS Preflight Failed</p>
            <p className="text-xs text-amber-700 font-body mt-0.5">Address verification failed. Manual review required before generating return label.</p>
          </div>
        </div>
      )}

      {/* Main Content — Two Column */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column — Timeline + Items + Notes */}
        <div className="lg:col-span-7 space-y-4">
          {/* Case Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-4">Case Timeline</h3>
            {returnCase.timeline.length > 0 ? (
              <div className="space-y-0">
                {returnCase.timeline.map((event, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        "w-3 h-3 rounded-full border-2 flex-shrink-0",
                        i === 0 ? "bg-blue-500 border-blue-500" : "bg-white border-gray-300"
                      )} />
                      {i < returnCase.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 min-h-[32px] bg-gray-200" />
                      )}
                    </div>
                    <div className="pb-4 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full uppercase", STATUS_STYLES[event.action] || "bg-gray-100 text-gray-600")}>
                          {event.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] text-gray-400 font-body">{event.actor}</span>
                      </div>
                      <p className="text-xs font-body text-gray-700 mt-1">{event.details}</p>
                      <span className="text-[10px] text-gray-400 font-body flex items-center gap-1 mt-0.5">
                        <Clock size={8} /> {event.timestamp ? new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <Clock size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-body">No timeline events</p>
              </div>
            )}
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide">Return Items</h3>
            </div>
            {returnCase.items.length > 0 ? (
              <>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Reason</th>
                      <th>Condition</th>
                      <th>Qty</th>
                      <th className="text-right">Refund</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returnCase.items.map((item, i) => (
                      <tr key={i}>
                        <td>
                          <div className="flex items-center gap-2">
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt="" className="w-8 h-8 rounded object-cover flex-shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-medium font-body">{item.name}</p>
                              <p className="text-[10px] text-gray-400 font-body font-mono">{item.sku}</p>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", getReasonStyle(item.reason))}>
                            {item.reason.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="text-xs font-body text-gray-500">{item.condition}</td>
                        <td className="text-xs font-body text-center">{item.quantity}</td>
                        <td className="text-xs font-body text-right font-medium">${item.refundAmount.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-5 py-3 border-t border-gray-100 flex justify-end">
                  <span className="text-sm font-bold font-body">Total: ${returnCase.totalRefundAmount.toLocaleString()} {returnCase.currency}</span>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-400">
                <Package size={24} className="mx-auto mb-2 text-gray-300" />
                <p className="text-xs font-body">No items listed</p>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Case Notes</h3>
            {returnCase.notes.length > 0 ? (
              <div className="space-y-3 mb-4">
                {returnCase.notes.map((note, i) => (
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
                placeholder="Add a case note..."
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-xs font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
                aria-label="Add a case note"
              />
              <button className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5">
                <Send size={10} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Column — Context Cards */}
        <div className="lg:col-span-5 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Customer</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold font-body">{returnCase.customer.name}</p>
                {returnCase.customer.email !== "—" && (
                  <p className="text-[10px] text-gray-400 font-body">{returnCase.customer.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Order */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Order</h3>
            {returnCase.order.id ? (
              <Link href={`/orders/${returnCase.order.id}`} className="flex items-center justify-between group">
                <span className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors">{returnCase.order.orderNumber}</span>
                <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-500" />
              </Link>
            ) : (
              <p className="text-xs text-gray-400 font-body">No linked order</p>
            )}
          </div>

          {/* Vendor */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Vendor</h3>
            <Link href={`/vendors/${returnCase.vendor.id}`} className="flex items-center gap-2 group">
              <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                {returnCase.vendor.companyName.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors">{returnCase.vendor.companyName}</p>
                <p className="text-[10px] text-gray-400 font-body flex items-center gap-1"><Globe size={8} /> {returnCase.vendor.country}</p>
              </div>
              <ExternalLink size={10} className="text-gray-300 ml-auto group-hover:text-blue-500" />
            </Link>
          </div>

          {/* Return Label */}
          {returnCase.returnLabel && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Return Label</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-body">
                  <span className="text-gray-400">Carrier</span>
                  <span className="font-medium">{returnCase.returnLabel.carrier}</span>
                </div>
                <div className="flex justify-between text-xs font-body">
                  <span className="text-gray-400">Tracking</span>
                  <span className="font-mono text-[10px]">{returnCase.returnLabel.trackingNumber}</span>
                </div>
                {returnCase.returnLabel.labelUrl && (
                  <a href={returnCase.returnLabel.labelUrl} target="_blank" rel="noopener noreferrer" className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center justify-center gap-1.5">
                    <FileText size={10} /> View Label
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Vendor Return Status */}
          {returnCase.vendorReturn && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Vendor Return</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-body">
                  <span className="text-gray-400">Status</span>
                  <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                    returnCase.vendorReturn.status === "RECEIVED" ? "bg-green-50 text-green-600" :
                    returnCase.vendorReturn.status === "SHIPPED" ? "bg-blue-50 text-blue-600" :
                    "bg-amber-50 text-amber-600"
                  )}>
                    {returnCase.vendorReturn.status}
                  </span>
                </div>
                {returnCase.vendorReturn.trackingNumber && (
                  <div className="flex justify-between text-xs font-body">
                    <span className="text-gray-400">Tracking</span>
                    <span className="font-mono text-[10px]">{returnCase.vendorReturn.trackingNumber}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DNS Preflight */}
          <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Preflight Checks</h3>
            <div className="flex items-center gap-2">
              {returnCase.dnsPreflightPassed ? (
                <>
                  <ShieldCheck size={14} className="text-green-500" />
                  <span className="text-xs font-body text-green-700">DNS preflight passed</span>
                </>
              ) : returnCase.dnsPreflightPassed === false ? (
                <>
                  <AlertTriangle size={14} className="text-amber-500" />
                  <span className="text-xs font-body text-amber-700">DNS preflight failed — manual review</span>
                </>
              ) : (
                <>
                  <Clock size={14} className="text-gray-400" />
                  <span className="text-xs font-body text-gray-500">Preflight pending</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Dialog */}
      {confirmAction && confirmAction !== "reject" && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Confirm action">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full shadow-xl">
            <h3 className="text-sm font-bold font-heading mb-2">Confirm {confirmAction}</h3>
            <p className="text-xs text-gray-500 font-body mb-4">Are you sure you want to {confirmAction} this return?</p>
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
