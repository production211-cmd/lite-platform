/**
 * VendorPortalShell — VENDOR (Portal-Only) Layout
 * =================================================
 * Stripped layout: NO sidebar, minimal top bar only.
 * Used for portal-only vendors (Link2Lux, Eleonora Bonucci).
 * Routes: /vendor/portal/*
 *
 * Per Perplexity critique (Mistake 4A):
 * This is a separate layout component, NOT a conditional check.
 * All routes under /vendor/portal/* are children of this shell.
 */

import { Route, Switch, Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import PortalOrders from "@/pages/vendor/PortalOrders";
import VendorProducts from "@/pages/vendor/VendorProducts";
import VendorFinance from "@/pages/vendor/VendorFinance";
import { LogOut, Package, ShoppingCart, DollarSign, HelpCircle } from "lucide-react";
import { withErrorBoundary } from "@/components/RouteErrorBoundary";

// ============================================================
// Minimal Top Bar (no sidebar toggle, no search)
// ============================================================

function PortalTopBar() {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  const portalLinks = [
    { label: "Orders", href: "/vendor/portal/orders", icon: ShoppingCart },
    { label: "Products", href: "/vendor/portal/products", icon: Package },
    { label: "Payouts", href: "/vendor/portal/payouts", icon: DollarSign },
    { label: "Help", href: "/vendor/portal/help", icon: HelpCircle },
  ];

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
      {/* Left: Brand + Navigation */}
      <div className="flex items-center gap-8">
        <Link href="/vendor/portal" className="flex items-center gap-2">
          <h1 className="font-heading text-lg tracking-[0.15em] text-gray-800">LITE</h1>
          <span className="text-[10px] tracking-[0.15em] text-gray-400 uppercase">Portal</span>
        </Link>

        <nav className="flex items-center gap-1">
          {portalLinks.map((link) => {
            const Icon = link.icon;
            const active = location.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-gray-100 text-gray-900 font-medium"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <Icon size={16} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Right: User info + Logout */}
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-semibold text-gray-800">
            {user?.vendorName || "Vendor"}
          </p>
          <p className="text-[11px] text-gray-400">
            {user?.firstName} {user?.lastName}
          </p>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-red-500 transition-colors"
          title="Sign out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}

// ============================================================
// Portal Home — Quick action cards
// ============================================================

function PortalHome() {
  const { user } = useAuth();

  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-8">
        <h2 className="font-heading text-2xl text-gray-800 mb-1">
          Welcome, {user?.vendorName || "Vendor"}
        </h2>
        <p className="text-gray-500">Manage your orders, products, and payouts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/vendor/portal/orders">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <ShoppingCart size={24} className="text-gray-400 mb-3" />
            <p className="font-semibold text-gray-800 mb-1">Orders</p>
            <p className="text-sm text-gray-500">View and manage your orders</p>
          </div>
        </Link>
        <Link href="/vendor/portal/products">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <Package size={24} className="text-gray-400 mb-3" />
            <p className="font-semibold text-gray-800 mb-1">Products</p>
            <p className="text-sm text-gray-500">View your product catalog</p>
          </div>
        </Link>
        <Link href="/vendor/portal/payouts">
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
            <DollarSign size={24} className="text-gray-400 mb-3" />
            <p className="font-semibold text-gray-800 mb-1">Payouts</p>
            <p className="text-sm text-gray-500">Track your settlements</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

function PortalPlaceholder({ title }: { title: string }) {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <h2 className="font-heading text-2xl text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">This portal page is under development.</p>
    </div>
  );
}

// ============================================================
// VendorPortalShell Layout — NO SIDEBAR
// ============================================================

export function VendorPortalShell() {
  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <PortalTopBar />
      <main className="flex-1">
        <Switch>
          <Route path="/vendor/portal" component={withErrorBoundary(PortalHome, "Portal Home")} />
          <Route path="/vendor/portal/orders" component={withErrorBoundary(PortalOrders, "Portal Orders")} />
          <Route path="/vendor/portal/products" component={withErrorBoundary(VendorProducts, "Portal Products")} />
          <Route path="/vendor/portal/payouts" component={withErrorBoundary(VendorFinance, "Portal Finance")} />
          <Route path="/vendor/portal/help">{() => <PortalPlaceholder title="Help & Support" />}</Route>
          <Route>
            <div className="flex items-center justify-center h-[60vh]">
              <p className="text-gray-500">Page not found</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}
