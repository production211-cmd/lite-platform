/**
 * App.tsx — Layout Route Pattern
 * ===============================
 * Per Perplexity critique (Mistake 4A):
 * Three separate layout components as nested route parents.
 * NO conditional layout checks — each shell is its own route tree.
 *
 * - /             → AdminShell (RETAILER_LT)
 * - /vendor/*     → VendorShell (VENDOR_USER, full sidebar)
 * - /vendor/portal/* → VendorPortalShell (VENDOR, stripped layout)
 * - /login        → Login page (public)
 */

import { Route, Switch, useLocation, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "@/layouts/AdminShell";
import { VendorShell } from "@/layouts/VendorShell";
import { VendorPortalShell } from "@/layouts/VendorPortalShell";
import Login from "@/pages/Login";

function AppRouter() {
  const { user, isAuthenticated, isLoading, isRetailer, isVendorFull, isVendorPortal } = useAuth();
  const [location] = useLocation();

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F5F6F7]">
        <div className="text-center">
          <h1 className="font-heading text-3xl tracking-[0.3em] text-gray-800 mb-2">LITE</h1>
          <p className="text-xs tracking-[0.25em] text-gray-400 uppercase mb-6">Marketplace</p>
          <div className="w-8 h-8 border-2 border-gray-200 border-t-gray-800 rounded-full animate-spin mx-auto" />
          <p className="text-sm text-gray-500 mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated → show login
  if (!isAuthenticated) {
    return <Login />;
  }

  // Authenticated → route to appropriate shell based on role
  // Vendor portal-only users trying to access non-portal routes → redirect
  if (isVendorPortal && !location.startsWith("/vendor/portal")) {
    return <Redirect to="/vendor/portal" />;
  }

  // Vendor full users trying to access admin routes → redirect
  if (isVendorFull && !location.startsWith("/vendor")) {
    return <Redirect to="/vendor" />;
  }

  // Retailer users trying to access vendor routes → redirect
  if (isRetailer && location.startsWith("/vendor")) {
    return <Redirect to="/" />;
  }

  return (
    <Switch>
      {/* Vendor Portal Shell — stripped layout, no sidebar */}
      {/* MUST be before /vendor/* to match first */}
      <Route path="/vendor/portal/:rest*">
        <VendorPortalShell />
      </Route>
      <Route path="/vendor/portal">
        <VendorPortalShell />
      </Route>

      {/* Vendor Shell — full sidebar */}
      <Route path="/vendor/:rest*">
        <VendorShell />
      </Route>
      <Route path="/vendor">
        <VendorShell />
      </Route>

      {/* Admin Shell — full sidebar (default for RETAILER_LT) */}
      <Route path="/:rest*">
        <AdminShell />
      </Route>
    </Switch>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
}
