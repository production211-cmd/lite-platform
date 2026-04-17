import { useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, User, LogOut } from "lucide-react";
import NotificationDropdown from "@/components/NotificationDropdown";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function TopBar({ title = "Marketplace", subtitle = "Marketplace Management", actions }: TopBarProps) {
  const { user, logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 border-b border-gray-200 bg-white flex items-center justify-between px-8 sticky top-0 z-40 shrink-0">
      {/* Left: Page title */}
      <div className="flex items-center gap-4">
        <div>
          <h2 className="font-heading text-lg tracking-wide small-caps">{title}</h2>
          <p className="text-[11px] text-gray-400 font-body">{subtitle}</p>
        </div>
        {actions && <div className="flex items-center gap-2 ml-4">{actions}</div>}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Search size={20} />
        </button>

        {/* Notifications */}
        <NotificationDropdown />

        {/* User */}
        <div className="flex items-center gap-3 ml-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "#3a3a3a" }}
          >
            <User size={16} className="text-white" />
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 font-body">
              {user?.firstName || "L&T"} {user?.lastName || "Admin"}
            </p>
            <p className="text-[11px] text-gray-400 font-body">
              {user?.role === "RETAILER_LT" ? "Admin" : "Vendor"}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-red-500 transition-colors ml-1"
            title="Sign out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-200 p-4 shadow-lg animate-fade-in z-50">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders, products, vendors..."
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-300 focus:border-transparent font-body"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
