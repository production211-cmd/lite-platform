import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useSidebar } from "@/contexts/SidebarContext";
import {
  House, Store, ShoppingCart, ClipboardList, Truck,
  DollarSign, ChevronRight, ChevronDown, LogOut, User,
  Package, BarChart3, AlertTriangle, RotateCcw,
  Megaphone, CalendarDays, Settings, MessageSquare,
  ChevronLeft,
} from "lucide-react";

interface NavChild {
  label: string;
  href: string;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
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
      { label: "Vendor Performance", href: "/vendors/performance" },
    ],
  },
  {
    label: "Products / Catalog",
    href: "/products",
    icon: Package,
    children: [
      { label: "All Products", href: "/products" },
      { label: "Pending Review", href: "/products/pending" },
      { label: "Pricing", href: "/products/pricing" },
      { label: "Enrichment", href: "/products/enrichment" },
    ],
  },
  {
    label: "Orders",
    href: "/orders",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", href: "/orders" },
      { label: "Pending Acceptance", href: "/orders/pending" },
      { label: "Returns", href: "/orders/returns" },
      { label: "Issues & Disputes", href: "/orders/issues" },
      { label: "Analytics", href: "/orders/analytics" },
    ],
  },
  {
    label: "Shipping View",
    href: "/shipping",
    icon: Truck,
    children: [
      { label: "All Shipments", href: "/shipping" },
      { label: "Shipping Costs", href: "/shipping/costs" },
      { label: "Settings", href: "/shipping/settings" },
    ],
  },
  { label: "Messages", href: "/messages", icon: MessageSquare },
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
  { label: "Marketing", href: "/marketing", icon: CalendarDays },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const [location] = useLocation();
  const { collapsed, toggle } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label)
        ? prev.filter((l) => l !== label)
        : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/") return location === "/";
    return location.startsWith(href);
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
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/10">
        {!collapsed ? (
          <>
            <h1 className="font-heading text-2xl tracking-[0.3em] text-white">LITE</h1>
            <p className="text-[11px] tracking-[0.25em] text-gray-400 mt-1 uppercase">Marketplace</p>
          </>
        ) : (
          <span className="text-white font-heading text-lg">LT</span>
        )}
      </div>

      {/* Store Badge */}
      {!collapsed && (
        <div className="px-6 py-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs font-bold tracking-wide text-white" style={{ backgroundColor: "var(--brand-blue)" }}>
            LORD & TAYLOR
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {retailerNav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const expanded = expandedItems.includes(item.label);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.label}>
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className="w-full px-6 py-3 text-left flex items-center justify-between transition-colors text-sm"
                  style={{
                    backgroundColor: active ? "var(--sidebar-active)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "var(--sidebar-active)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && (
                    expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="w-full px-6 py-3 flex items-center gap-3 transition-colors text-sm"
                  style={{
                    backgroundColor: active ? "var(--sidebar-active)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "var(--sidebar-active)";
                  }}
                  onMouseLeave={(e) => {
                    if (!active) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <Icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}

              {/* Sub-items */}
              {hasChildren && expanded && !collapsed && (
                <div className="bg-black/20">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-6 py-2.5 pl-14 text-sm transition-colors"
                      style={{
                        color: location === child.href ? "#ffffff" : "#9ca3af",
                        backgroundColor: location === child.href ? "var(--sidebar-active)" : "transparent",
                      }}
                      onMouseEnter={(e) => {
                        if (location !== child.href) {
                          e.currentTarget.style.color = "#ffffff";
                          e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)";
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (location !== child.href) {
                          e.currentTarget.style.color = "#9ca3af";
                          e.currentTarget.style.backgroundColor = "transparent";
                        }
                      }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/10 px-4 py-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--sidebar-active)" }}
          >
            <User size={18} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">L&T Admin</p>
              <p className="text-xs text-gray-400 truncate">L&T Admin</p>
            </div>
          )}
          {!collapsed && (
            <button className="text-gray-400 hover:text-white transition-colors" title="Sign out">
              <LogOut size={18} />
            </button>
          )}
        </div>
        <button
          onClick={toggle}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded text-xs text-gray-400 hover:text-white hover:bg-white/5 transition-all"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
