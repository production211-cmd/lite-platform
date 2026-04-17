export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
}

export function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    // Orders
    PLACED: "status-info",
    SPLIT: "status-info",
    VENDOR_ACCEPT: "status-success",
    FRAUD_HOLD: "status-danger",
    VENDOR_REJECTED: "status-danger",
    GENERATE_LABEL: "status-warning",
    SHIPPED: "status-info",
    IN_TRANSIT: "status-info",
    DELIVERED: "status-success",
    SETTLED: "status-success",
    CANCELLED: "status-danger",
    // Products
    PENDING_REVIEW: "status-warning",
    APPROVED: "status-success",
    QUALIFIED: "status-info",
    NEEDS_REVIEW: "status-warning",
    PUSHED: "status-success",
    REJECTED: "status-danger",
    ARCHIVED: "status-neutral",
    // Shipments
    LABEL_CREATED: "status-info",
    LABEL_VOIDED: "status-danger",
    PICKED_UP: "status-info",
    OUT_FOR_DELIVERY: "status-info",
    EXCEPTION: "status-danger",
    RETURNED: "status-warning",
    // Returns
    INITIATED: "status-warning",
    RECEIVED_WAREHOUSE: "status-info",
    INSPECTING: "status-info",
    REFUNDED: "status-success",
    FORWARDED_TO_VENDOR: "status-info",
    COMPLETED: "status-success",
    // Messages
    OPEN: "status-warning",
    PENDING: "status-info",
    RESOLVED: "status-success",
    CLOSED: "status-neutral",
    // Payouts
    PROCESSING: "status-info",
  };
  return map[status] || "status-neutral";
}

export function getStatusLabel(status: string): string {
  return status
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "...";
}
