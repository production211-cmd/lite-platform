/**
 * OrderFulfillment — Vendor Order Detail + Fulfillment Actions
 * =============================================================
 * Accept/reject orders, print packing slips, create shipments,
 * upload tracking, and manage order lifecycle.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { formatCurrency, timeAgo } from "@/lib/utils";
import { StatusBadge } from "@/components/ui-components";
import { Link, useParams } from "wouter";
import {
  ArrowLeft, Check, X, Truck, Package, Printer,
  AlertTriangle, Clock, MapPin, User, Phone, Mail,
  ChevronRight, FileText, Send, Copy, ExternalLink,
  CheckCircle2, XCircle, MessageSquare,
} from "lucide-react";

type FulfillmentStatus = "pending_acceptance" | "accepted" | "processing" | "shipped" | "delivered" | "rejected" | "cancelled";

interface OrderItem {
  id: string;
  name: string;
  sku: string;
  variant: string;
  qty: number;
  price: number;
  image: string;
}

interface FulfillmentOrder {
  id: string;
  orderNumber: string;
  status: FulfillmentStatus;
  customer: { name: string; email: string; phone: string; };
  shippingAddress: { line1: string; line2?: string; city: string; state: string; zip: string; country: string; };
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  commission: number;
  netPayout: number;
  placedAt: string;
  acceptDeadline: string;
  shippingDeadline: string;
  trackingNumber?: string;
  carrier?: string;
  notes: string[];
}

// Demo data
const DEMO_ORDER: FulfillmentOrder = {
  id: "ORD-2024-8847",
  orderNumber: "LT-2024-8847",
  status: "pending_acceptance",
  customer: { name: "Sarah Mitchell", email: "sarah.m@example.com", phone: "+1 (212) 555-0147" },
  shippingAddress: { line1: "245 Park Avenue", line2: "Apt 12B", city: "New York", state: "NY", zip: "10167", country: "US" },
  items: [
    { id: "1", name: "Cashmere Wrap Coat", sku: "CWC-BLK-M", variant: "Black / M", qty: 1, price: 1295.00, image: "https://images.unsplash.com/photo-1539533018447-63fcce2678e3?w=100" },
    { id: "2", name: "Silk Scarf — Paisley", sku: "SS-PAI-OS", variant: "Paisley / One Size", qty: 2, price: 185.00, image: "https://images.unsplash.com/photo-1601924994987-69e26d50dc64?w=100" },
  ],
  subtotal: 1665.00,
  shipping: 0,
  commission: 249.75,
  netPayout: 1415.25,
  placedAt: "2024-03-15T14:30:00Z",
  acceptDeadline: "2024-03-16T14:30:00Z",
  shippingDeadline: "2024-03-18T14:30:00Z",
  notes: [],
};

export default function OrderFulfillment() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<FulfillmentOrder>(DEMO_ORDER);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [trackingNumber, setTrackingNumber] = useState("");
  const [carrier, setCarrier] = useState("UPS");
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [trackingError, setTrackingError] = useState("");
  const rejectTriggerRef = useRef<HTMLButtonElement>(null);
  const shipTriggerRef = useRef<HTMLButtonElement>(null);
  const rejectDialogRef = useRef<HTMLDivElement>(null);
  const shipDialogRef = useRef<HTMLDivElement>(null);

  // Focus trap + return focus for dialogs
  useEffect(() => {
    if (showRejectDialog && rejectDialogRef.current) {
      const first = rejectDialogRef.current.querySelector<HTMLElement>("textarea, input, button, [tabindex]");
      first?.focus();
    }
  }, [showRejectDialog]);

  useEffect(() => {
    if (showShipDialog && shipDialogRef.current) {
      const first = shipDialogRef.current.querySelector<HTMLElement>("select, input, button, [tabindex]");
      first?.focus();
    }
  }, [showShipDialog]);

  // Close dialogs on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showRejectDialog) { setShowRejectDialog(false); rejectTriggerRef.current?.focus(); }
        if (showShipDialog) { setShowShipDialog(false); shipTriggerRef.current?.focus(); }
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [showRejectDialog, showShipDialog]);

  // Tracking number validation
  const validateTracking = (val: string) => {
    setTrackingNumber(val);
    if (val.trim() && !/^[A-Za-z0-9]{8,40}$/.test(val.trim())) {
      setTrackingError("Tracking number should be 8-40 alphanumeric characters");
    } else {
      setTrackingError("");
    }
  };

  const handleAccept = async () => {
    setActionLoading("accept");
    await new Promise((r) => setTimeout(r, 1000));
    setOrder((prev) => ({ ...prev, status: "accepted" }));
    setActionLoading(null);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading("reject");
    await new Promise((r) => setTimeout(r, 1000));
    setOrder((prev) => ({ ...prev, status: "rejected", notes: [...prev.notes, `Rejected: ${rejectReason}`] }));
    setShowRejectDialog(false);
    setActionLoading(null);
  };

  const handleMarkProcessing = async () => {
    setActionLoading("processing");
    await new Promise((r) => setTimeout(r, 800));
    setOrder((prev) => ({ ...prev, status: "processing" }));
    setActionLoading(null);
  };

  const handleShip = async () => {
    if (!trackingNumber.trim()) return;
    setActionLoading("ship");
    await new Promise((r) => setTimeout(r, 1000));
    setOrder((prev) => ({
      ...prev,
      status: "shipped",
      trackingNumber,
      carrier,
      notes: [...prev.notes, `Shipped via ${carrier}: ${trackingNumber}`],
    }));
    setShowShipDialog(false);
    setActionLoading(null);
  };

  const addNote = () => {
    if (!noteInput.trim()) return;
    setOrder((prev) => ({ ...prev, notes: [...prev.notes, noteInput.trim()] }));
    setNoteInput("");
  };

  const statusFlow: { status: FulfillmentStatus; label: string; icon: React.ElementType }[] = [
    { status: "pending_acceptance", label: "Pending", icon: Clock },
    { status: "accepted", label: "Accepted", icon: Check },
    { status: "processing", label: "Processing", icon: Package },
    { status: "shipped", label: "Shipped", icon: Truck },
    { status: "delivered", label: "Delivered", icon: CheckCircle2 },
  ];

  const currentIdx = statusFlow.findIndex((s) => s.status === order.status);

  return (
    <div className="page-enter p-6 lg:p-8 max-w-6xl mx-auto">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/vendor/orders" className="hover:text-gray-700 transition-colors">Orders</Link>
        <ChevronRight size={14} />
        <span className="text-gray-900 font-medium">{order.orderNumber}</span>
      </nav>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-heading text-2xl tracking-wide text-gray-900">{order.orderNumber}</h1>
            <StatusBadge status={order.status.replace(/_/g, " ")} />
          </div>
          <p className="text-sm text-gray-500 mt-1">Placed {timeAgo(order.placedAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {order.status === "pending_acceptance" && (
            <>
              <button
                onClick={handleAccept}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                <Check size={16} />
                {actionLoading === "accept" ? "Accepting..." : "Accept Order"}
              </button>
              <button
                ref={rejectTriggerRef}
                onClick={() => setShowRejectDialog(true)}
                disabled={actionLoading !== null}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg text-sm hover:bg-red-100 transition-colors disabled:opacity-50"
              >
                <X size={16} />
                Reject
              </button>
            </>
          )}
          {order.status === "accepted" && (
            <button
              onClick={handleMarkProcessing}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              <Package size={16} />
              {actionLoading === "processing" ? "Updating..." : "Mark Processing"}
            </button>
          )}
          {(order.status === "accepted" || order.status === "processing") && (
            <button
              ref={shipTriggerRef}
              onClick={() => setShowShipDialog(true)}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              <Truck size={16} />
              Ship Order
            </button>
          )}
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer size={16} />
            Packing Slip
          </button>
        </div>
      </div>

      {/* Status Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6 mb-6">
        <div className="flex items-center justify-between">
          {statusFlow.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === currentIdx;
            const isComplete = i < currentIdx;
            const isRejected = order.status === "rejected" || order.status === "cancelled";
            return (
              <div key={s.status} className="flex items-center flex-1">
                <div className={`flex items-center gap-2 ${isActive ? "text-gray-900 font-medium" : isComplete ? "text-green-600" : "text-gray-300"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    isActive ? "bg-gray-900 text-white" : isComplete ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
                  }`}>
                    <Icon size={16} />
                  </div>
                  <span className="text-xs hidden sm:inline">{s.label}</span>
                </div>
                {i < statusFlow.length - 1 && (
                  <div className={`flex-1 h-px mx-3 ${isComplete ? "bg-green-300" : "bg-gray-200"}`} />
                )}
              </div>
            );
          })}
        </div>
        {order.status === "pending_acceptance" && (
          <div className="mt-4 flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <AlertTriangle size={16} />
            Accept deadline: {new Date(order.acceptDeadline).toLocaleString()} — auto-cancels if not accepted
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Items + Financials */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-4">Order Items</h3>
            <div className="space-y-4">
              {order.items.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                  <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.variant} — SKU: {item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(item.price)}</p>
                    <p className="text-xs text-gray-500">Qty: {item.qty}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-4">Financial Summary</h3>
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between"><dt className="text-gray-500">Subtotal</dt><dd className="text-gray-900">{formatCurrency(order.subtotal)}</dd></div>
              <div className="flex justify-between"><dt className="text-gray-500">Shipping</dt><dd className="text-gray-900">{order.shipping === 0 ? "Free" : formatCurrency(order.shipping)}</dd></div>
              <div className="flex justify-between text-red-600"><dt>Commission (15%)</dt><dd>-{formatCurrency(order.commission)}</dd></div>
              <div className="border-t border-gray-200 pt-3 flex justify-between font-medium">
                <dt className="text-gray-900">Net Payout</dt>
                <dd className="text-green-700 text-base">{formatCurrency(order.netPayout)}</dd>
              </div>
            </dl>
          </div>

          {/* Tracking Info */}
          {order.trackingNumber && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
              <h3 className="font-heading text-base tracking-wide text-gray-900 mb-4">Tracking</h3>
              <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Truck size={20} className="text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{order.carrier}</p>
                  <p className="text-sm text-gray-600 font-mono">{order.trackingNumber}</p>
                </div>
                <button className="p-2 text-gray-500 hover:text-gray-700 transition-colors">
                  <Copy size={16} />
                </button>
                <button className="p-2 text-blue-600 hover:text-blue-700 transition-colors">
                  <ExternalLink size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Customer + Notes */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-4">Customer</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <User size={18} className="text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{order.customer.name}</p>
                  <p className="text-xs text-gray-500">Customer</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Mail size={14} className="text-gray-400" />
                {order.customer.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Phone size={14} className="text-gray-400" />
                {order.customer.phone}
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-4">Ship To</h3>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="text-gray-400 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p>{order.shippingAddress.line1}</p>
                {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zip}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft p-6">
            <h3 className="font-heading text-base tracking-wide text-gray-900 mb-4">Notes</h3>
            <div className="space-y-2 mb-4 max-h-40 overflow-y-auto">
              {order.notes.length === 0 && <p className="text-sm text-gray-400">No notes yet</p>}
              {order.notes.map((note, i) => (
                <div key={i} className="p-2 bg-gray-50 rounded-lg text-sm text-gray-700">{note}</div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                placeholder="Add a note..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
              />
              <button onClick={addNote} className="px-3 py-2 bg-gray-100 rounded-lg text-gray-700 hover:bg-gray-200 transition-colors">
                <Send size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Dialog */}
      {showRejectDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowRejectDialog(false); rejectTriggerRef.current?.focus(); }}>
          <div ref={rejectDialogRef} role="dialog" aria-modal="true" aria-labelledby="reject-dialog-title" className="bg-white rounded-xl shadow-elevated w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="reject-dialog-title" className="font-heading text-lg text-gray-900 mb-4">Reject Order</h3>
            <p className="text-sm text-gray-600 mb-4">Please provide a reason for rejecting this order. The retailer will be notified.</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="e.g., Item out of stock, cannot fulfill by deadline..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 resize-none mb-4"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => { setShowRejectDialog(false); rejectTriggerRef.current?.focus(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleReject}
                disabled={!rejectReason.trim() || actionLoading === "reject"}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === "reject" ? "Rejecting..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ship Dialog */}
      {showShipDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => { setShowShipDialog(false); shipTriggerRef.current?.focus(); }}>
          <div ref={shipDialogRef} role="dialog" aria-modal="true" aria-labelledby="ship-dialog-title" className="bg-white rounded-xl shadow-elevated w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 id="ship-dialog-title" className="font-heading text-lg text-gray-900 mb-4">Ship Order</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Carrier</label>
                <select
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900"
                >
                  <option>UPS</option>
                  <option>FedEx</option>
                  <option>USPS</option>
                  <option>DHL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tracking Number *</label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => validateTracking(e.target.value)}
                  placeholder="e.g., 1Z999AA10123456784"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 ${trackingError ? "border-red-300" : "border-gray-300"}`}
                />
                {trackingError && <p className="text-xs text-red-600 mt-1">{trackingError}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => { setShowShipDialog(false); shipTriggerRef.current?.focus(); }} className="px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
              <button
                onClick={handleShip}
                disabled={!trackingNumber.trim() || !!trackingError || actionLoading === "ship"}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === "ship" ? "Shipping..." : "Confirm Shipment"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
