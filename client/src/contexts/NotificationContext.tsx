/**
 * NotificationContext — Global Notification State
 * =================================================
 * Manages notification list, unread count, mark-as-read,
 * and toast triggers. Wired to /api/notifications backend
 * with graceful fallback to demo data when API unavailable.
 */
import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from "react";
import { api } from "@/lib/api";

export type NotificationType = "order" | "shipment" | "return" | "vendor" | "product" | "finance" | "system" | "alert";
export type NotificationPriority = "low" | "medium" | "high" | "critical";

export interface Notification {
  id: string;
  type: NotificationType;
  priority: NotificationPriority;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, string>;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  dismissNotification: (id: string) => void;
  addNotification: (n: Omit<Notification, "id" | "timestamp" | "read">) => void;
  clearAll: () => void;
  loading: boolean;
  refresh: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

// Demo notifications — used as fallback when API is unavailable
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: "n1", type: "order", priority: "high", title: "New Order Received",
    message: "Order LT-2024-8901 — $2,450.00 from Sarah Mitchell. Requires acceptance within 24h.",
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(), read: false,
    actionUrl: "/orders/LT-2024-8901", actionLabel: "View Order",
  },
  {
    id: "n2", type: "shipment", priority: "critical", title: "Shipment Exception",
    message: "Shipment SHP-4521 held at customs — missing commercial invoice. Vendor: Eleonora Bonucci.",
    timestamp: new Date(Date.now() - 22 * 60000).toISOString(), read: false,
    actionUrl: "/shipping/SHP-4521", actionLabel: "Resolve",
  },
  {
    id: "n3", type: "return", priority: "medium", title: "Return Request",
    message: "Return RET-1187 filed for Order LT-2024-8756. Reason: Wrong size. Value: $385.00.",
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(), read: false,
    actionUrl: "/orders/returns/RET-1187", actionLabel: "Review",
  },
  {
    id: "n4", type: "vendor", priority: "low", title: "Vendor Onboarding Complete",
    message: "Maison Kitsuné has completed onboarding. 47 products pending review.",
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: false,
    actionUrl: "/vendors/maison-kitsune", actionLabel: "View Vendor",
  },
  {
    id: "n5", type: "product", priority: "medium", title: "Products Ready for Review",
    message: "12 new products from Urban Threads are pending enrichment review.",
    timestamp: new Date(Date.now() - 3 * 3600000).toISOString(), read: true,
    actionUrl: "/products/pending", actionLabel: "Review Products",
  },
  {
    id: "n6", type: "finance", priority: "low", title: "Payout Processed",
    message: "Weekly payout of $45,230.00 processed for 8 vendors. Settlement ID: SET-2024-0315.",
    timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), read: true,
    actionUrl: "/finance/payouts", actionLabel: "View Details",
  },
  {
    id: "n7", type: "system", priority: "low", title: "Shopify Sync Complete",
    message: "Catalog sync completed — 1,247 products updated, 3 errors detected.",
    timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), read: true,
    actionUrl: "/settings", actionLabel: "View Sync Log",
  },
  {
    id: "n8", type: "alert", priority: "high", title: "Low Inventory Alert",
    message: "5 SKUs from Link2Lux are below reorder threshold. Auto-deactivation in 48h.",
    timestamp: new Date(Date.now() - 12 * 3600000).toISOString(), read: true,
    actionUrl: "/products", actionLabel: "View Products",
  },
  {
    id: "n9", type: "order", priority: "medium", title: "Order Cancellation",
    message: "Order LT-2024-8823 cancelled by customer. Refund of $675.00 initiated.",
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(), read: true,
  },
  {
    id: "n10", type: "shipment", priority: "low", title: "Delivery Confirmed",
    message: "12 shipments delivered today. All within SLA. On-time rate: 98.2%.",
    timestamp: new Date(Date.now() - 26 * 3600000).toISOString(), read: true,
  },
];

/** Map API response fields to our Notification interface */
function mapApiNotification(n: any): Notification {
  return {
    id: n.id,
    type: (n.type || "system").toLowerCase(),
    priority: (n.priority || "low").toLowerCase(),
    title: n.title || "",
    message: n.message || "",
    timestamp: n.createdAt || n.timestamp || new Date().toISOString(),
    read: n.isRead ?? n.read ?? false,
    actionUrl: n.actionUrl,
    actionLabel: n.actionLabel,
    metadata: n.metadata,
  };
}

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>(DEMO_NOTIFICATIONS);
  const [loading, setLoading] = useState(false);
  const [useApi, setUseApi] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!useApi) return;
    setLoading(true);
    try {
      const data = await api.getNotifications({ page: "1", limit: "100" });
      if (data.notifications && data.notifications.length > 0) {
        setNotifications(data.notifications.map(mapApiNotification));
      }
      // If API returns empty, keep demo data for better UX
    } catch {
      // API not available — fall back to demo data silently
      setUseApi(false);
    }
    setLoading(false);
  }, [useApi]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const markAsRead = useCallback(async (id: string) => {
    const prev = notifications;
    setNotifications((p) => p.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (useApi) {
      try { await api.markNotificationRead(id); } catch { setNotifications(prev); }
    }
  }, [useApi, notifications]);

  const markAllAsRead = useCallback(async () => {
    const prev = notifications;
    setNotifications((p) => p.map((n) => ({ ...n, read: true })));
    if (useApi) {
      try { await api.markAllNotificationsRead(); } catch { setNotifications(prev); }
    }
  }, [useApi, notifications]);

  const dismissNotification = useCallback(async (id: string) => {
    const prev = notifications;
    setNotifications((p) => p.filter((n) => n.id !== id));
    if (useApi) {
      try { await api.dismissNotification(id); } catch { setNotifications(prev); }
    }
  }, [useApi, notifications]);

  const addNotification = useCallback((n: Omit<Notification, "id" | "timestamp" | "read">) => {
    const newNotif: Notification = {
      ...n,
      id: `n-${Date.now()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = useMemo(() => ({
    notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification,
    addNotification, clearAll, loading, refresh: fetchNotifications,
  }), [notifications, unreadCount, markAsRead, markAllAsRead, dismissNotification,
    addNotification, clearAll, loading, fetchNotifications]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationProvider");
  return ctx;
}
