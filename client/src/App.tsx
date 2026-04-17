/**
 * App.tsx — Layout Route Pattern
 * ===============================
 * Three separate layout components as nested route parents.
 */

import React from "react";
import { Route, Switch, useLocation, Redirect } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminShell } from "@/layouts/AdminShell";
import { VendorShell } from "@/layouts/VendorShell";
import { VendorPortalShell } from "@/layouts/VendorPortalShell";
import Login from "@/pages/Login";

// Error Boundary to catch silent React crashes
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, fontFamily: "monospace" }}>
          <h1 style={{ color: "red" }}>Something went wrong</h1>
          <pre style={{ whiteSpace: "pre-wrap", color: "#333" }}>
            {this.state.error?.message}
          </pre>
          <pre style={{ whiteSpace: "pre-wrap", color: "#666", fontSize: 12 }}>
            {this.state.error?.stack}
          </pre>
          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            style={{ marginTop: 20, padding: "8px 16px", cursor: "pointer" }}
          >
            Clear session & reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function getHomeRoute(isRetailer: boolean, isVendorFull: boolean, isVendorPortal: boolean): string {
  if (isVendorPortal) return "/vendor/portal";
  if (isVendorFull) return "/vendor";
  return "/";
}

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

  // Role-based shell rendering
  if (isVendorPortal) {
    return <VendorPortalShell />;
  }

  if (isVendorFull) {
    return <VendorShell />;
  }

  // Default: RETAILER_LT → AdminShell
  return <AdminShell />;
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </ErrorBoundary>
  );
}
