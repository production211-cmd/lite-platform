import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import { api } from "@/lib/api";
import { formatCurrency, cn } from "@/lib/utils";
import {
  ArrowLeft, Package, Truck, Clock, CheckCircle, AlertTriangle,
  MapPin, User, CreditCard, Eye, Copy, ExternalLink, XCircle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

const formatAddress = (addr: any): string => {
  if (!addr) return "—";
  if (typeof addr === "string") return addr;
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip, addr.country].filter(Boolean);
  return parts.join(", ") || "—";
};

const statusColor = (status: string) => {
  const s = status?.toUpperCase();
  if (s === "DELIVERED" || s === "COMPLETED") return "status-delivered";
  if (s === "SHIPPED" || s === "IN_TRANSIT") return "status-shipped";
  if (s === "PROCESSING" || s === "VENDOR_ACCEPT") return "status-processing";
  if (s === "PLACED" || s === "PENDING") return "status-pending";
  if (s === "CANCELLED" || s === "REFUNDED") return "status-danger";
  return "status-neutral";
};

const formatDate = (d: string) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
};

export default function OrderDetail() {
  const [, params] = useRoute("/orders/:id");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    api.getOrder(params.id).then((data: any) => {
      setOrder(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [params?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4 font-body">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6">
        <Link href="/orders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 mb-4 font-body">
          <ArrowLeft size={16} /> Back to Orders
        </Link>
        <div className="text-center py-20 text-gray-400">
          <Package size={48} className="mx-auto mb-4 opacity-30" />
          <p className="font-body">Order not found</p>
        </div>
      </div>
    );
  }

  const vendorOrders = order.vendorOrders || [];

  /* Commission & earnings totals computed from vendor orders */
  const totalCommission = vendorOrders.reduce((sum: number, vo: any) => sum + (vo.commission || 0), 0);
  const totalVendorEarnings = vendorOrders.reduce((sum: number, vo: any) => sum + (vo.vendorEarnings || vo.subtotal || 0), 0);

  const timeline = [
    { label: "Order Placed", date: order.placedAt || order.createdAt, icon: CreditCard, done: true },
    { label: "Vendor Accepted", date: vendorOrders[0]?.acceptedAt, icon: CheckCircle, done: vendorOrders.some((vo: any) => vo.status !== "PLACED") },
    { label: "Shipped", date: vendorOrders[0]?.shippedAt, icon: Truck, done: vendorOrders.some((vo: any) => ["SHIPPED", "IN_TRANSIT", "DELIVERED"].includes(vo.status)) },
    { label: "Delivered", date: vendorOrders[0]?.deliveredAt, icon: MapPin, done: vendorOrders.some((vo: any) => vo.status === "DELIVERED") },
  ];

  return (
    <div className="p-6 space-y-6 page-enter">
      {/* Back + Header */}
      <Link href="/orders" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-body">
        <ArrowLeft size={16} /> Back to Orders
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold font-heading">{order.orderNumber || order.shopifyOrderId || order.id}</h1>
            <span className={`status-badge ${statusColor(order.status)}`}>{order.status?.replace(/_/g, " ")}</span>
            {order.fraudStatus && (
              <span className="status-badge status-danger flex items-center gap-1">
                <AlertTriangle size={10} /> {order.fraudStatus}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 font-body mt-1">
            Placed {formatDate(order.placedAt || order.createdAt)}
            {order.shopifyOrderId && <span className="ml-2 text-gray-400">· Shopify #{order.shopifyOrderId}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { navigator.clipboard.writeText(order.id); }}
            className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5"
          >
            <Copy size={12} /> Copy ID
          </button>
          {order.shopifyOrderId && (
            <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
              <ExternalLink size={12} /> Shopify
            </button>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
        <h3 className="text-sm font-bold font-heading mb-4">Order Timeline</h3>
        <div className="flex items-center justify-between">
          {timeline.map((step, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={cn("w-8 h-8 rounded-full flex items-center justify-center", step.done ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400")}>
                  <step.icon size={14} />
                </div>
                <p className={cn("text-[10px] font-semibold font-body mt-1.5", step.done ? "text-gray-800" : "text-gray-400")}>{step.label}</p>
                {step.date && <p className="text-[9px] text-gray-400 font-body">{formatDate(step.date)}</p>}
              </div>
              {i < timeline.length - 1 && (
                <div className={cn("flex-1 h-0.5 mx-2", step.done ? "bg-green-300" : "bg-gray-200")} />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Order Summary */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
          <h3 className="text-sm font-bold font-heading mb-3">Order Summary</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-500">Order Total</span>
              <span className="font-semibold">{formatCurrency(order.totalAmount || 0, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-500">Commission ({vendorOrders[0]?.commissionRate || 0}%)</span>
              <span className="text-green-600 font-semibold">{formatCurrency(totalCommission, order.currency)}</span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-500">Vendor Earnings</span>
              <span>{formatCurrency(totalVendorEarnings, order.currency)}</span>
            </div>
            <div className="border-t border-gray-100 pt-2 flex justify-between text-sm font-body">
              <span className="text-gray-500">Items</span>
              <span className="font-semibold">{vendorOrders.reduce((sum: number, vo: any) => sum + (vo.items?.length || 0), 0)}</span>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
          <h3 className="text-sm font-bold font-heading mb-3">Customer</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <User size={14} className="text-gray-400" />
              <p className="text-sm font-semibold font-body">{order.customerName || "—"}</p>
            </div>
            {order.customerEmail && (
              <p className="text-xs text-gray-500 font-body ml-5">{order.customerEmail}</p>
            )}
            <div className="flex items-start gap-2">
              <MapPin size={14} className="text-gray-400 mt-0.5" />
              <p className="text-xs text-gray-500 font-body">{formatAddress(order.shippingAddress)}</p>
            </div>
            {order.billingAddress && (
              <div className="flex items-start gap-2">
                <CreditCard size={14} className="text-gray-400 mt-0.5" />
                <p className="text-xs text-gray-400 font-body">Billing: {formatAddress(order.billingAddress)}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Info */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-5">
          <h3 className="text-sm font-bold font-heading mb-3">Payment</h3>
          <div className="space-y-2.5">
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-500">Status</span>
              <span className={cn("font-semibold", order.paymentStatus === "paid" ? "text-green-600" : "text-amber-600")}>
                {order.paymentStatus ? order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1) : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sm font-body">
              <span className="text-gray-500">Currency</span>
              <span>{order.currency || "USD"}</span>
            </div>
            {order.fraudStatus && (
              <div className="flex justify-between text-sm font-body">
                <span className="text-gray-500">Fraud Check</span>
                <span className="text-red-600 font-semibold flex items-center gap-1">
                  <AlertTriangle size={12} /> {order.fraudStatus}
                </span>
              </div>
            )}
            {order.notes && (
              <div className="border-t border-gray-100 pt-2">
                <p className="text-xs text-gray-400 font-body">Notes: {order.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vendor Orders */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="text-sm font-bold font-heading">Vendor Orders ({vendorOrders.length})</h3>
        </div>
        {vendorOrders.length > 0 ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Commission</th>
                <th>Vendor Earnings</th>
                <th>Status</th>
                <th>Tracking</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {vendorOrders.map((vo: any) => {
                const trackingNumber = vo.shipments?.[0]?.trackingNumber;
                return (
                  <tr key={vo.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {vo.vendor?.logoUrl && (
                          <img src={vo.vendor.logoUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                        )}
                        <span className="text-sm font-semibold font-body">{vo.vendor?.name || "—"}</span>
                      </div>
                    </td>
                    <td className="text-sm font-body">{vo.items?.length || 0}</td>
                    <td className="text-sm font-semibold font-body">{formatCurrency(vo.subtotal || 0, vo.currency)}</td>
                    <td className="text-sm text-green-600 font-body">{formatCurrency(vo.commission || 0, vo.currency)}</td>
                    <td className="text-sm font-body">{formatCurrency(vo.vendorEarnings || 0, vo.currency)}</td>
                    <td><span className={`status-badge ${statusColor(vo.status)}`}>{vo.status?.replace(/_/g, " ")}</span></td>
                    <td className="text-xs font-mono font-body">{trackingNumber || "—"}</td>
                    <td>
                      <Link href={`/shipping/${vo.shipments?.[0]?.id || ""}`}>
                        <button className="btn-view" disabled={!vo.shipments?.[0]?.id}>
                          <Eye size={12} /> View
                        </button>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="p-8 text-center text-gray-400 font-body text-sm">No vendor orders</div>
        )}
      </div>

      {/* Line Items */}
      {vendorOrders.some((vo: any) => vo.items?.length > 0) && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="text-sm font-bold font-heading">Line Items</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>Total</th>
                <th>Vendor</th>
              </tr>
            </thead>
            <tbody>
              {vendorOrders.flatMap((vo: any) =>
                (vo.items || []).map((item: any) => (
                  <tr key={item.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        {item.product?.images?.[0]?.url && (
                          <img src={item.product.images[0].url} alt="" className="w-8 h-8 rounded object-cover" />
                        )}
                        <div>
                          <p className="text-sm font-semibold font-body">{item.product?.title || "Unknown Product"}</p>
                          {item.variant?.title && item.variant.title !== "Default Title" && (
                            <p className="text-[10px] text-gray-400 font-body">{item.variant.title}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="text-xs font-mono text-gray-500">{item.product?.retailerSku || item.product?.vendorSku || "—"}</td>
                    <td className="text-sm font-body">{item.quantity}</td>
                    <td className="text-sm font-body">{formatCurrency(item.unitPrice || 0, item.currency || vo.currency)}</td>
                    <td className="text-sm font-semibold font-body">{formatCurrency(item.totalPrice || 0, item.currency || vo.currency)}</td>
                    <td className="text-xs text-gray-500 font-body">{vo.vendor?.name || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
