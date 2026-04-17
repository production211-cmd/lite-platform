import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react";

interface TopBarProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function TopBar({ title, subtitle, actions }: TopBarProps) {
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <header className="h-16 border-b border-[var(--border)] bg-white flex items-center justify-between px-6 sticky top-0 z-40">
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-lg font-semibold text-[var(--foreground)]">{title}</h1>
          {subtitle && (
            <p className="text-xs text-[var(--muted-foreground)]">{subtitle}</p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {actions}

        {/* Search */}
        <button
          onClick={() => setSearchOpen(!searchOpen)}
          className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
        >
          <Search size={18} />
        </button>

        {/* Notifications */}
        <button className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* Help */}
        <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors">
          <HelpCircle size={18} />
        </button>

        {/* View Toggle */}
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 ml-2">
          <button className="px-3 py-1.5 text-xs font-medium rounded-md bg-white shadow-sm text-slate-900">
            Retailer
          </button>
          <button className="px-3 py-1.5 text-xs font-medium rounded-md text-slate-500 hover:text-slate-700">
            Vendor
          </button>
        </div>
      </div>

      {/* Search overlay */}
      {searchOpen && (
        <div className="absolute top-full left-0 right-0 bg-white border-b border-[var(--border)] p-4 shadow-lg animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search orders, products, vendors..."
                className="w-full pl-10 pr-4 py-3 border border-[var(--border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
                autoFocus
              />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
