import { useState } from "react";
import { useLocation, Link } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard, Store, Package, ShoppingCart, Truck,
  MessageSquare, DollarSign, Megaphone, CalendarDays,
  Settings, ChevronLeft, ChevronRight, LogOut, RotateCcw,
  AlertTriangle, BarChart3, FileText, Users, Tag,
  ChevronDown, ChevronUp,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  children?: { label: string; href: string }[];
}

const retailerNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Vendors", href: "/vendors", icon: Store },
  {
    label: "Products",
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
    label: "Shipping",
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
    label: "Finance",
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
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(["Products", "Orders", "Shipping", "Finance"]);

  const nav = retailerNav;

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
      className={cn(
        "fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300",
        collapsed ? "w-[72px]" : "w-[260px]"
      )}
      style={{ backgroundColor: "var(--sidebar-bg)" }}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#c8a45c] flex items-center justify-center">
              <span className="text-white font-bold text-sm">LT</span>
            </div>
            <div>
              <h1 className="text-white font-semibold text-sm tracking-wide">LITE</h1>
              <p className="text-[10px] text-slate-400 tracking-widest uppercase">Marketplace</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-[#c8a45c] flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-sm">LT</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);
          const expanded = expandedItems.includes(item.label);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.label} className="mb-0.5">
              {hasChildren ? (
                <button
                  onClick={() => toggleExpanded(item.label)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <Icon size={18} className={active ? "text-[#c8a45c]" : ""} />
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </>
                  )}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all",
                    active
                      ? "bg-white/10 text-white"
                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <Icon size={18} className={active ? "text-[#c8a45c]" : ""} />
                  {!collapsed && <span>{item.label}</span>}
                  {!collapsed && item.badge && (
                    <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )}

              {/* Sub-items */}
              {hasChildren && expanded && !collapsed && (
                <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-4">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className={cn(
                        "block px-3 py-2 rounded-md text-xs transition-all",
                        location === child.href
                          ? "text-[#c8a45c] bg-white/5 font-medium"
                          : "text-slate-500 hover:text-slate-300 hover:bg-white/5"
                      )}
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
      <div className="border-t border-white/10 p-3">
        {!collapsed && user && (
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center text-white text-xs font-medium">
              {user.firstName?.[0]}{user.lastName?.[0]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">
                {user.firstName} {user.lastName}
              </p>
              <p className="text-slate-500 text-[10px] truncate">
                {user.role === "RETAILER_LT" ? "Retailer Admin" : "Vendor"}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-xs transition-all"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            {!collapsed && <span>Collapse</span>}
          </button>
          {!collapsed && (
            <button
              onClick={logout}
              className="px-3 py-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-white/5 transition-all"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
