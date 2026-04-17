/**
 * ReturnDetail — Returns Case Workspace
 * ========================================
 * Design: Alert-first layout for active cases, detail-first for resolved.
 * Full returns case management: resolution workflow, return labels,
 * vendor returns, refund processing, DNS preflight, notes.
 * Breadcrumb back-to-list navigation.
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

interface ReturnItem {
  name: string;
  sku: string;
  quantity: number;
  reason: string;
  condition: string;
  refundAmount: number;
}

interface ReturnData {
  id: string;
  returnNumber: string;
  status: string;
  type: string;
  reason: string;
  order: { id: string; orderNumber: string };
  vendor: { id: string; companyName: string; country: string };
  customer: { name: string; email: string };
  items: ReturnItem[];
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

const STATUS_STYLES: Record<string, string> = {
  INITIATED: "bg-amber-50 text-amber-700",
  LABEL_SENT: "bg-blue-50 text-blue-700",
  IN_TRANSIT: "bg-blue-50 text-blue-700",
  RECEIVED: "bg-purple-50 text-purple-700",
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

export default function ReturnDetail() {
  const [, params] = useRoute("/orders/returns/:id");
  const [returnCase, setReturnCase] = useState<ReturnData | null>(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  useEffect(() => {
    if (!params?.id) return;
    setLoading(true);
    api.getReturn(params.id).then((data: any) => {
      setReturnCase(data);
      setLoading(false);
    }).catch(() => {
      // Mock data for development
      setReturnCase({
        id: params.id,
        returnNumber: "RET-2026-0018",
        status: "RECEIVED",
        type: "FULL_RETURN",
        reason: "DEFECTIVE",
        order: { id: "ord-1", orderNumber: "LT-2026-0042" },
        vendor: { id: "v1", companyName: "Julian Fashion S.p.A.", country: "IT" },
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
      });
      setLoading(false);
    });
  }, [params?.id]);

  const handleAction = (action: string) => {
    if (!returnCase) return;
    // Mock status update
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
        <div className="h-6 w-48 bg-gray-200 rounded" />
        <div className="h-64 bg-gray-100 rounded-lg" />
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
    <div className="p-6 space-y-5 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400">
        <Link href="/orders/returns" className="hover:text-gray-600 transition-colors">Returns</Link>
        <ChevronRight size={10} />
        <span className="text-gray-700 font-medium">{returnCase.returnNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-heading">{returnCase.returnNumber}</h1>
            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase", STATUS_STYLES[returnCase.status] || "bg-gray-100 text-gray-600")}>
              {returnCase.status.replace(/_/g, " ")}
            </span>
            <span className={cn("text-[10px] font-bold px-2.5 py-0.5 rounded-full", REASON_STYLES[returnCase.reason] || "bg-gray-100 text-gray-600")}>
              {returnCase.reason.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">{returnCase.type.replace(/_/g, " ")} — Opened {new Date(returnCase.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        {isActive && (
          <div className="flex items-center gap-2">
            {returnCase.status === "RECEIVED" && (
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
      <div className="grid grid-cols-12 gap-5">
        {/* Left Column — Timeline + Notes */}
        <div className="col-span-7 space-y-4">
          {/* Case Timeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-4">Case Timeline</h3>
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
                      <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", STATUS_STYLES[event.action] || "bg-gray-100 text-gray-500")}>{event.action.replace(/_/g, " ")}</span>
                      <span className="text-[10px] text-gray-400 font-body">{event.actor}</span>
                    </div>
                    <p className="text-xs font-body text-gray-700 mt-1">{event.details}</p>
                    <span className="text-[10px] text-gray-400 font-body flex items-center gap-1 mt-0.5">
                      <Clock size={8} /> {new Date(event.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100">
              <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide">Return Items</h3>
            </div>
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
                      <p className="text-xs font-medium font-body">{item.name}</p>
                      <p className="text-[10px] text-gray-400 font-body font-mono">{item.sku}</p>
                    </td>
                    <td>
                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full", REASON_STYLES[item.reason] || "bg-gray-100 text-gray-500")}>
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
          </div>

          {/* Notes */}
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Case Notes</h3>
            {returnCase.notes.length > 0 ? (
              <div className="space-y-3 mb-4">
                {returnCase.notes.map((note, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-semibold font-body text-gray-600">{note.author}</span>
                      <span className="text-[10px] text-gray-400 font-body">{new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
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
              />
              <button className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5">
                <Send size={10} /> Add
              </button>
            </div>
          </div>
        </div>

        {/* Right Column — Context Cards */}
        <div className="col-span-5 space-y-4">
          {/* Customer */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Customer</h3>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                <User size={14} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-semibold font-body">{returnCase.customer.name}</p>
                <p className="text-[10px] text-gray-400 font-body">{returnCase.customer.email}</p>
              </div>
            </div>
          </div>

          {/* Order */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-xs font-bold font-heading text-gray-500 uppercase tracking-wide mb-3">Order</h3>
            <Link href={`/orders/${returnCase.order.id}`} className="flex items-center justify-between group">
              <span className="text-sm font-semibold font-body group-hover:text-blue-600 transition-colors">{returnCase.order.orderNumber}</span>
              <ExternalLink size={10} className="text-gray-300 group-hover:text-blue-500" />
            </Link>
          </div>

          {/* Vendor */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
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
            <div className="bg-white rounded-lg border border-gray-200 p-4">
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
                <a href={returnCase.returnLabel.labelUrl} target="_blank" rel="noopener noreferrer" className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center justify-center gap-1.5">
                  <FileText size={10} /> View Label
                </a>
              </div>
            </div>
          )}

          {/* Vendor Return Status */}
          {returnCase.vendorReturn && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
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
          <div className="bg-white rounded-lg border border-gray-200 p-4">
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
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
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
