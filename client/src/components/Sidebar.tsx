import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { useSidebar } from "@/contexts/SidebarContext";
import { useAuth } from "@/contexts/AuthContext";
import {
  House, Store, ShoppingCart, ClipboardList, Truck,
  DollarSign, ChevronRight, ChevronDown, LogOut, User,
  Package, BarChart3, AlertTriangle, RotateCcw,
  Megaphone, CalendarDays, Settings, MessageSquare,
  ChevronLeft, Activity, UserPlus,
} from "lucide-react";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavChild[];
}

const retailerNav: NavItem[] = [
  { label: "Home - Dashboard", href: "/", icon: House },
  {
    label: "Vendors",
    href: "/vendors",
    icon: Store,
    children: [
      { label: "All Vendors", href: "/vendors" },
      { label: "Onboard New Vendor", href: "/vendors/onboard" },
    ],
  },
  {
    label: "Products / Catalog",
    href: "/products",
    icon: Package,
    children: [
      { label: "All Products", href: "/products" },
    ],
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", href: "/orders" },
      { label: "Returns", href: "/orders/returns" },
      { label: "Issues & Disputes", href: "/orders/issues" },
      { label: "Order Analytics", href: "/orders/analytics" },
    ],
  },
  {
    label: "Shipping View",
    href: "/shipping",
    icon: Truck,
  },
  {
    label: "Messages",
    href: "/messages",
    icon: MessageSquare,
    badge: 3,
  },
  {
    label: "Finance - Accounting",
    href: "/finance",
    icon: DollarSign,
    children: [
      { label: "Overview", href: "/finance" },
      { label: "Payouts", href: "/finance/payouts" },
      { label: "Deductions", href: "/finance/deductions" },
      { label: "Vendor Balances", href: "/finance/balances" },
    ],
  },
  { label: "Ads", href: "/ads", icon: Megaphone },
  { label: "Marketing / Events", href: "/marketing", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
  { label: "Queue Monitor", href: "/admin/queues", icon: Activity },
];

export function Sidebar() {
  const [location] = useLocation();
  const { collapsed, toggle } = useSidebar();
  const { logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Auto-expand the parent nav item based on current location
  useEffect(() => {
    retailerNav.forEach((item) => {
      if (item.children) {
        const isChildActive = item.children.some((c) => location === c.href || location.startsWith(c.href + "/"));
        if (isChildActive && !expandedItems.includes(item.label)) {
          setExpandedItems((prev) => [...prev, item.label]);
        }
      }
    });
  }, [location]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location === href || location.startsWith(href + "/");
  };

  const isParentActive = (item: NavItem) => {
    if (item.children) {
      return item.children.some((c) => location === c.href || location.startsWith(c.href + "/"));
    }
    return isActive(item.href);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 text-white"
      style={{
        width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
        backgroundColor: "var(--sidebar-bg)",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center py-5 px-4">
        {!collapsed ? (
          <>
            <h1 className="font-heading text-[1.75rem] tracking-[0.3em] text-white font-normal leading-tight">LITE</h1>
            <p className="text-[10px] tracking-[0.25em] text-gray-500 mt-0.5 uppercase font-body">Marketplace</p>
          </>
        ) : (
          <span className="text-white font-heading text-lg">LT</span>
        )}
      </div>

      {/* Store Badge — Green pill with green dot (matching reference) */}
      {!collapsed && (
        <div className="px-5 pb-4 flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold tracking-wide text-white bg-green-600">
            LORD & TAYLOR
          </span>
          <span className="w-2 h-2 rounded-full bg-green-400" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {retailerNav.map((item) => {
          const Icon = item.icon;
          const active = isParentActive(item);
          const expanded = expandedItems.includes(item.label);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className="w-full px-5 py-2.5 text-left flex items-center justify-between transition-colors text-[0.8125rem] font-body"
                  style={{
                    backgroundColor: active ? "var(--sidebar-active)" : "transparent",
                    color: active ? "#ffffff" : "#9ca3af",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#9ca3af";
                    }
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={18} strokeWidth={1.75} />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && (
                    expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="w-full px-5 py-2.5 flex items-center gap-3 transition-colors text-[0.8125rem] font-body"
                  style={{
                    backgroundColor: active ? "var(--sidebar-active)" : "transparent",
                    color: active ? "#ffffff" : "#9ca3af",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.style.color = "#ffffff";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = "transparent";
                      e.currentTarget.style.color = "#9ca3af";
                    }
                  }}
                >
                  <Icon size={18} strokeWidth={1.75} />
                  {!collapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {!collapsed && item.badge && (
                    <span className="bg-green-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub-items */}
              {hasChildren && expanded && !collapsed && (
                <div className="bg-black/20">
                  {item.children!.map((child) => {
                    const childActive = location === child.href;
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className="block px-5 py-2 pl-12 text-[0.8125rem] transition-colors font-body"
                        style={{
                          color: childActive ? "#ffffff" : "#6b7280",
                          backgroundColor: childActive ? "var(--sidebar-active)" : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.color = "#ffffff";
                            e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!childActive) {
                            e.currentTarget.style.color = "#6b7280";
                            e.currentTarget.style.backgroundColor = "transparent";
                          }
                        }}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-4 py-3">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: "var(--sidebar-active)" }}
          >
            <User size={16} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate font-body">L&T Admin</p>
              <p className="text-xs text-gray-500 truncate font-body">L&T Admin</p>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={() => logout()}
              className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
