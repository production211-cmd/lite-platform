/**
 * VendorShell — VENDOR_USER Layout (Full Access)
 * ================================================
 * Full sidebar navigation for vendor users with full portal access.
 * E.g., Urban Threads — gets sidebar, all vendor pages.
 * Routes: /vendor/*
 */

import { useState } from "react";
import { Route, Switch, useLocation, Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { TopBar } from "@/components/TopBar";
import { withErrorBoundary, RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import VendorDashboard from "@/pages/vendor/VendorDashboard";
import VendorProducts from "@/pages/vendor/VendorProducts";
import VendorOrders from "@/pages/vendor/VendorOrders";
import VendorShipments from "@/pages/vendor/VendorShipments";
import VendorFinance from "@/pages/vendor/VendorFinance";
import ProductSubmission from "@/pages/vendor/ProductSubmission";
import OrderFulfillment from "@/pages/vendor/OrderFulfillment";
import PayoutHistory from "@/pages/vendor/PayoutHistory";
import VendorSettings from "@/pages/vendor/VendorSettings";
import {
  House, Package, ShoppingCart, Truck, DollarSign,
  MessageSquare, Settings, ChevronRight, ChevronDown,
  ChevronLeft, LogOut, User, BarChart3,
} from "lucide-react";

// ============================================================
// Vendor Navigation Items
// ============================================================

interface NavChild { label: string; href: string; }
interface NavItem { label: string; href: string; icon: React.ElementType; children?: NavChild[]; }

const vendorNav: NavItem[] = [
  { label: "Dashboard", href: "/vendor", icon: House },
  {
    label: "My Products",
    href: "/vendor/products",
    icon: Package,
    children: [
      { label: "All Products", href: "/vendor/products" },
      { label: "Add Product", href: "/vendor/products/new" },
    ],
  },
  {
    label: "Orders",
    href: "/vendor/orders",
    icon: ShoppingCart,
    children: [
      { label: "All Orders", href: "/vendor/orders" },
      { label: "Pending", href: "/vendor/orders/pending" },
      { label: "Returns", href: "/vendor/orders/returns" },
    ],
  },
  {
    label: "Shipments",
    href: "/vendor/shipments",
    icon: Truck,
  },
  { label: "Messages", href: "/vendor/messages", icon: MessageSquare },
  {
    label: "Finance",
    href: "/vendor/finance",
    icon: DollarSign,
    children: [
      { label: "Overview", href: "/vendor/finance" },
      { label: "Payouts", href: "/vendor/finance/payouts" },
    ],
  },
  { label: "Analytics", href: "/vendor/analytics", icon: BarChart3 },
  { label: "Settings", href: "/vendor/settings", icon: Settings },
];

// ============================================================
// Vendor Sidebar
// ============================================================

function VendorSidebar() {
  const [location] = useLocation();
  const { collapsed, toggle } = useSidebar();
  const { user, logout } = useAuth();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const toggleExpanded = (label: string) => {
    setExpandedItems((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const isActive = (href: string) => {
    if (href === "/vendor") return location === "/vendor";
    return location.startsWith(href);
  };

  return (
    <aside
      className="fixed left-0 top-0 h-screen flex flex-col z-50 transition-all duration-300 text-white"
      style={{
        width: collapsed ? "var(--sidebar-collapsed-width)" : "var(--sidebar-width)",
        backgroundColor: "#1a2332",
      }}
    >
      {/* Logo */}
      <div className="flex flex-col items-center py-6 px-4 border-b border-white/10">
        {!collapsed ? (
          <>
            <h1 className="font-heading text-xl tracking-[0.2em] text-white">VENDOR</h1>
            <p className="text-[10px] tracking-[0.2em] text-gray-400 mt-1 uppercase">
              {user?.vendorName || "Portal"}
            </p>
          </>
        ) : (
          <span className="text-white font-heading text-lg">V</span>
        )}
      </div>

      {/* Vendor Badge */}
      {!collapsed && (
        <div className="px-6 py-3 flex items-center gap-2">
          <span className="px-3 py-1 rounded text-xs font-bold tracking-wide text-white bg-blue-600">
            {user?.vendorName || "Vendor"}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {vendorNav.map((item) => {
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
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent" }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <span className="flex items-center gap-3">
                    <Icon size={20} />
                    {!collapsed && <span>{item.label}</span>}
                  </span>
                  {!collapsed && (expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />)}
                </button>
              ) : (
                <Link
                  href={item.href}
                  className="w-full px-6 py-3 flex items-center gap-3 transition-colors text-sm"
                  style={{ backgroundColor: active ? "rgba(255,255,255,0.1)" : "transparent" }}
                  onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)"; }}
                  onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
                >
                  <Icon size={20} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              )}

              {hasChildren && expanded && !collapsed && (
                <div className="bg-black/20">
                  {item.children!.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      className="block px-6 py-2.5 pl-14 text-sm transition-colors"
                      style={{
                        color: location === child.href ? "#ffffff" : "#9ca3af",
                        backgroundColor: location === child.href ? "rgba(255,255,255,0.1)" : "transparent",
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
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10">
            <User size={18} />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-xs text-gray-400 truncate">{user?.vendorName}</p>
            </div>
          )}
          {!collapsed && (
            <button onClick={logout} className="text-gray-400 hover:text-white transition-colors" title="Sign out">
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

// ============================================================
// Placeholder for pages not yet implemented
// ============================================================

function VendorPlaceholder({ title }: { title: string }) {
  return (
    <div className="p-8">
      <h2 className="font-heading small-caps text-2xl">{title}</h2>
      <p className="text-gray-500 mt-2">This vendor page is under development.</p>
    </div>
  );
}

// ============================================================
// VendorShell Layout
// ============================================================

function VendorContent() {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? 72 : 288;

  return (
    <div className="flex h-screen bg-[#F5F6F7]">
      <VendorSidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/vendor" component={withErrorBoundary(VendorDashboard, "Vendor Dashboard")} />
            <Route path="/vendor/products" component={withErrorBoundary(VendorProducts, "Vendor Products")} />
            <Route path="/vendor/products/new" component={withErrorBoundary(ProductSubmission, "Product Submission")} />
            <Route path="/vendor/orders" component={withErrorBoundary(VendorOrders, "Vendor Orders")} />
            <Route path="/vendor/orders/pending">{() => <RouteErrorBoundary pageName="Pending Orders"><VendorOrders /></RouteErrorBoundary>}</Route>
            <Route path="/vendor/orders/returns">{() => <RouteErrorBoundary pageName="Returns"><VendorPlaceholder title="Returns" /></RouteErrorBoundary>}</Route>
            <Route path="/vendor/orders/:id" component={withErrorBoundary(OrderFulfillment, "Order Fulfillment")} />
            <Route path="/vendor/shipments" component={withErrorBoundary(VendorShipments, "Vendor Shipments")} />
            <Route path="/vendor/messages">{() => <RouteErrorBoundary pageName="Messages"><VendorPlaceholder title="Messages" /></RouteErrorBoundary>}</Route>
            <Route path="/vendor/finance" component={withErrorBoundary(VendorFinance, "Vendor Finance")} />
            <Route path="/vendor/finance/payouts" component={withErrorBoundary(PayoutHistory, "Payout History")} />
            <Route path="/vendor/analytics">{() => <RouteErrorBoundary pageName="Analytics"><VendorPlaceholder title="Analytics" /></RouteErrorBoundary>}</Route>
            <Route path="/vendor/settings" component={withErrorBoundary(VendorSettings, "Vendor Settings")} />
            <Route>
              <RouteErrorBoundary pageName="Not Found">
                <div className="flex items-center justify-center h-[60vh]">
                  <p className="text-gray-500">Page not found</p>
                </div>
              </RouteErrorBoundary>
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export function VendorShell() {
  return (
    <SidebarProvider>
      <VendorContent />
    </SidebarProvider>
  );
}
