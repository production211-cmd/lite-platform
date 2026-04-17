/**
 * NotificationDropdown — Bell Icon Dropdown
 * ==========================================
 * Renders in TopBar. Shows unread count badge, dropdown list
 * with priority indicators, mark-as-read, and link to full center.
 */
import { useState, useRef, useEffect } from "react";
import { useNotifications, type Notification, type NotificationType } from "@/contexts/NotificationContext";
import { Link } from "wouter";
import {
  Bell, Check, CheckCheck, X, ShoppingCart, Truck, RotateCcw,
  Users, Package, DollarSign, Settings, AlertTriangle,
  ChevronRight, Clock,
} from "lucide-react";

const TYPE_ICONS: Record<NotificationType, React.ElementType> = {
  order: ShoppingCart,
  shipment: Truck,
  return: RotateCcw,
  vendor: Users,
  product: Package,
  finance: DollarSign,
  system: Settings,
  alert: AlertTriangle,
};

const TYPE_COLORS: Record<NotificationType, string> = {
  order: "bg-blue-50 text-blue-600",
  shipment: "bg-indigo-50 text-indigo-600",
  return: "bg-orange-50 text-orange-600",
  vendor: "bg-purple-50 text-purple-600",
  product: "bg-teal-50 text-teal-600",
  finance: "bg-green-50 text-green-600",
  system: "bg-gray-100 text-gray-600",
  alert: "bg-red-50 text-red-600",
};

const PRIORITY_INDICATOR: Record<string, string> = {
  critical: "bg-red-500",
  high: "bg-amber-500",
  medium: "bg-blue-400",
  low: "bg-gray-300",
};

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationDropdown() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  const recent = notifications.slice(0, 8);

  return (
    <div ref={ref} className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ""}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl border border-gray-200 shadow-elevated z-50 overflow-hidden"
          style={{ animation: "fadeInUp 0.2s ease-out" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900">Notifications</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <CheckCheck size={14} />
                  Mark all read
                </button>
              )}
            </div>
          </div>

          {/* Notification List */}
          <div className="max-h-[420px] overflow-y-auto">
            {recent.length === 0 ? (
              <div className="py-12 text-center">
                <Bell size={24} className="mx-auto text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">No notifications</p>
              </div>
            ) : (
              recent.map((n) => {
                const Icon = TYPE_ICONS[n.type];
                return (
                  <div
                    key={n.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group ${
                      !n.read ? "bg-blue-50/30" : ""
                    }`}
                    onClick={() => {
                      markAsRead(n.id);
                      if (n.actionUrl) {
                        setOpen(false);
                        window.location.hash = n.actionUrl;
                      }
                    }}
                  >
                    {/* Priority dot */}
                    <div className="flex flex-col items-center gap-1 pt-1">
                      <div className={`w-2 h-2 rounded-full ${PRIORITY_INDICATOR[n.priority]}`} />
                    </div>

                    {/* Icon */}
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${TYPE_COLORS[n.type]}`}>
                      <Icon size={14} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm truncate ${!n.read ? "font-medium text-gray-900" : "text-gray-700"}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                          <Clock size={10} />
                          {timeAgo(n.timestamp)}
                        </span>
                        {n.actionLabel && (
                          <span className="text-[10px] text-blue-600 font-medium">{n.actionLabel}</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!n.read && (
                        <button
                          onClick={(e) => { e.stopPropagation(); markAsRead(n.id); }}
                          className="p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          aria-label="Mark as read"
                        >
                          <Check size={12} />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); dismissNotification(n.id); }}
                        className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        aria-label="Dismiss notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 px-4 py-2.5">
            <Link
              href="/activity"
              onClick={() => setOpen(false)}
              className="flex items-center justify-center gap-1 text-xs text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              View all notifications
              <ChevronRight size={12} />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
