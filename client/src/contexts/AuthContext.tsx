import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";

export type UserRole = "RETAILER_LT" | "VENDOR_USER" | "VENDOR";
export type PortalType = "FULL" | "PORTAL";

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  vendorId?: string | null;
  vendorName?: string | null;
  portalType?: PortalType | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isRetailer: boolean;
  isVendorFull: boolean;
  isVendorPortal: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadUser = useCallback(async () => {
    const token = api.getToken();
    if (!token) {
      setIsLoading(false);
      return;
    }
    try {
      const userData = await api.getMe();
      if (userData && !userData.error) {
        setUser(userData);
      } else {
        api.setToken(null);
      }
    } catch {
      api.setToken(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    api.setToken(response.token);
    setUser(response.user);
  };

  const logout = () => {
    api.setToken(null);
    setUser(null);
  };

  const isRetailer = user?.role === "RETAILER_LT";
  const isVendorFull = user?.role === "VENDOR_USER" || (user?.role === "VENDOR" && user?.portalType === "FULL");
  const isVendorPortal = user?.role === "VENDOR" && user?.portalType === "PORTAL";

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isRetailer,
        isVendorFull,
        isVendorPortal,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
