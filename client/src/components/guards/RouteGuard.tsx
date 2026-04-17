/**
 * RouteGuard — Role-Based Route Protection
 * ==========================================
 * Wraps routes to enforce role-based access.
 * Redirects unauthorized users to their appropriate landing page.
 */

import { useAuth, type UserRole } from "@/contexts/AuthContext";
import { Redirect } from "wouter";

interface RouteGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
  fallbackPath?: string;
}

export function RouteGuard({ allowedRoles, children, fallbackPath }: RouteGuardProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Redirect to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect to appropriate landing page based on role
    const redirectPath = fallbackPath || getDefaultPath(user.role);
    return <Redirect to={redirectPath} />;
  }

  return <>{children}</>;
}

function getDefaultPath(role: UserRole): string {
  switch (role) {
    case "RETAILER_LT":
      return "/";
    case "VENDOR_USER":
      return "/vendor";
    case "VENDOR":
      return "/vendor/portal";
    default:
      return "/";
  }
}

/**
 * Convenience wrappers for common guard patterns
 */
export function RetailerOnly({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={["RETAILER_LT"]}>{children}</RouteGuard>;
}

export function VendorOnly({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={["VENDOR_USER", "VENDOR"]}>{children}</RouteGuard>;
}

export function AnyAuthenticated({ children }: { children: React.ReactNode }) {
  return <RouteGuard allowedRoles={["RETAILER_LT", "VENDOR_USER", "VENDOR"]}>{children}</RouteGuard>;
}
