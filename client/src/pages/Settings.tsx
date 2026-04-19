/**
 * Settings — Grouped Subsections with Role Gating
 * ==================================================
 * Design: Left-nav with 3 groups (Organization / Integrations / Security).
 * Role-gated: Security group only visible to admins.
 * Persists settings to localStorage with toast feedback.
 */

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Settings as SettingsIcon, Store, Truck, CreditCard, Bell,
  Users, Shield, Globe, Palette, Save, CheckCircle,
  AlertTriangle, ExternalLink, RefreshCw, Lock, ChevronRight,
  Key, Database,
} from "lucide-react";

// Simple toast helper
const showToast = (msg: string, type: "success" | "error" = "success") => {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = `fixed bottom-6 right-6 z-50 ${type === "success" ? "bg-gray-900" : "bg-red-600"} text-white px-5 py-3 rounded-lg shadow-lg text-sm font-body`;
  el.style.animation = "fadeIn 0.2s ease-out";
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; }, 2000);
  setTimeout(() => el.remove(), 2500);
};

// Settings storage helpers
const SETTINGS_KEY = "lite_platform_settings";

interface PlatformSettings {
  general: {
    platformName: string;
    supportEmail: string;
    defaultCurrency: string;
    timezone: string;
    commissionRate: number;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
  };
  shopify: {
    autoSyncOrders: boolean;
    autoSyncProducts: boolean;
    autoSyncInventory: boolean;
    autoFulfillOrders: boolean;
  };
  notifications: {
    [key: string]: { email: boolean; slack: boolean };
  };
  security: {
    twoFactor: boolean;
    sessionTimeout: boolean;
    ipWhitelist: boolean;
    auditLogging: boolean;
  };
}

const DEFAULT_SETTINGS: PlatformSettings = {
  general: {
    platformName: "Lord & Taylor Marketplace",
    supportEmail: "marketplace@lordandtaylor.com",
    defaultCurrency: "GBP",
    timezone: "Europe/London",
    commissionRate: 18,
  },
  branding: {
    primaryColor: "#1a1a2e",
    accentColor: "#c8a45c",
  },
  shopify: {
    autoSyncOrders: true,
    autoSyncProducts: true,
    autoSyncInventory: false,
    autoFulfillOrders: true,
  },
  notifications: {
    newOrder: { email: true, slack: true },
    orderShipped: { email: true, slack: false },
    returnRequested: { email: true, slack: true },
    slaBreach: { email: true, slack: true },
    settlementCompleted: { email: true, slack: false },
    vendorOnboarding: { email: true, slack: false },
    lowStock: { email: false, slack: true },
  },
  security: {
    twoFactor: true,
    sessionTimeout: true,
    ipWhitelist: false,
    auditLogging: true,
  },
};

function loadSettings(): PlatformSettings {
  try {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } catch {}
  return DEFAULT_SETTINGS;
}

function saveSettings(settings: PlatformSettings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/** Attempt to load settings from API, merge with defaults */
async function loadSettingsFromApi(): Promise<PlatformSettings | null> {
  try {
    const data = await api.getSettings();
    if (data.settings && data.settings.length > 0) {
      const result = { ...DEFAULT_SETTINGS };
      for (const s of data.settings) {
        try {
          const parsed = JSON.parse(s.value);
          if (s.category && (result as any)[s.category]) {
            (result as any)[s.category] = { ...(result as any)[s.category], ...parsed };
          }
        } catch {
          // Single value — try to place by key
          const parts = s.key.split(".");
          if (parts.length === 2 && (result as any)[parts[0]]) {
            (result as any)[parts[0]][parts[1]] = s.value;
          }
        }
      }
      return result;
    }
  } catch { /* API unavailable — fall back to localStorage */ }
  return null;
}

/** Persist settings to API (best-effort) + localStorage */
async function saveSettingsToApi(settings: PlatformSettings) {
  // Always save to localStorage as fallback
  saveSettings(settings);
  // Best-effort API persist
  try {
    const entries = Object.entries(settings).map(([category, data]) => ({
      key: category,
      value: JSON.stringify(data),
      category,
    }));
    await api.updateSettingsBulk(entries);
  } catch { /* API unavailable — localStorage already saved */ }
}

interface SettingsGroup {
  label: string;
  sections: { key: string; label: string; icon: any; adminOnly?: boolean }[];
}

export default function Settings() {
  const { user, isRetailer } = useAuth();
  const [activeSection, setActiveSection] = useState("general");
  const [settings, setSettings] = useState<PlatformSettings>(loadSettings);
  const [saving, setSaving] = useState(false);

  // Attempt to load from API on mount
  useEffect(() => {
    loadSettingsFromApi().then((apiSettings) => {
      if (apiSettings) setSettings(apiSettings);
    });
  }, []);

  const isValidHex = (v: string) => /^#[0-9a-fA-F]{0,6}$/.test(v);

  const updateSettings = useCallback((section: keyof PlatformSettings, data: any) => {
    // B4 fix: validate color hex values before applying
    if (section === 'branding') {
      if (data.primaryColor !== undefined && !isValidHex(data.primaryColor)) return;
      if (data.accentColor !== undefined && !isValidHex(data.accentColor)) return;
    }
    setSettings((prev) => {
      const updated = { ...prev, [section]: { ...prev[section], ...data } };
      return updated;
    });
  }, []);

  const handleSave = useCallback(async (section: string) => {
    setSaving(true);
    try {
      await saveSettingsToApi(settings);
      showToast(`${section} settings saved successfully`);
    } catch {
      saveSettings(settings);
      showToast(`${section} settings saved locally`, "error");
    }
    setSaving(false);
  }, [settings]);

  const groups: SettingsGroup[] = [
    {
      label: "Organization",
      sections: [
        { key: "general", label: "General", icon: SettingsIcon },
        { key: "team", label: "Team & Roles", icon: Users },
        { key: "branding", label: "Branding", icon: Palette },
      ],
    },
    {
      label: "Integrations",
      sections: [
        { key: "shopify", label: "Shopify", icon: Store },
        { key: "shipping", label: "Carriers", icon: Truck },
        { key: "payments", label: "Payments", icon: CreditCard },
        { key: "notifications", label: "Notifications", icon: Bell },
      ],
    },
    {
      label: "Security",
      sections: [
        { key: "security", label: "Security", icon: Shield, adminOnly: true },
        { key: "api-keys", label: "API Keys", icon: Key, adminOnly: true },
      ],
    },
  ];

  return (
    <div className="p-6 page-enter">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs font-body text-gray-400 mb-5">
        <span className="text-gray-700 font-medium">Settings</span>
        <ChevronRight size={10} />
        <span className="text-gray-500">{groups.flatMap((g) => g.sections).find((s) => s.key === activeSection)?.label}</span>
      </nav>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold font-heading">Settings</h1>
          <p className="text-sm text-gray-500 font-body mt-1">Configure your marketplace platform</p>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Left Nav — Grouped */}
        <div className="w-56 flex-shrink-0 space-y-5">
          {groups.map((group) => {
            const visibleSections = group.sections.filter((s) => !s.adminOnly || isRetailer);
            if (visibleSections.length === 0) return null;
            return (
              <div key={group.label}>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-3 mb-1.5">{group.label}</p>
                <nav className="space-y-0.5">
                  {visibleSections.map((s) => (
                    <button
                      key={s.key}
                      onClick={() => setActiveSection(s.key)}
                      className={cn(
                        "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-body transition-colors",
                        activeSection === s.key
                          ? "bg-gray-900 text-white font-semibold"
                          : "text-gray-600 hover:bg-gray-50"
                      )}
                    >
                      <s.icon size={14} />
                      {s.label}
                      {s.adminOnly && (
                        <Lock size={9} className={cn("ml-auto", activeSection === s.key ? "text-gray-400" : "text-gray-300")} />
                      )}
                    </button>
                  ))}
                </nav>
              </div>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* ===== ORGANIZATION: General ===== */}
          {activeSection === "general" && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">Platform Information</h3>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="settings-platform-name" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Platform Name</label>
                    <input id="settings-platform-name"
                      type="text"
                      value={settings.general.platformName}
                      onChange={(e) => updateSettings("general", { platformName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div>
                    <label htmlFor="settings-support-email" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Support Email</label>
                    <input id="settings-support-email"
                      type="email"
                      value={settings.general.supportEmail}
                      onChange={(e) => updateSettings("general", { supportEmail: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="settings-currency" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Default Currency</label>
                      <select id="settings-currency"
                        value={settings.general.defaultCurrency}
                        onChange={(e) => updateSettings("general", { defaultCurrency: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body bg-white"
                      >
                        <option value="GBP">GBP (£)</option>
                        <option value="USD">USD ($)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="settings-timezone" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Timezone</label>
                      <select id="settings-timezone"
                        value={settings.general.timezone}
                        onChange={(e) => updateSettings("general", { timezone: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body bg-white"
                      >
                        <option value="Europe/London">Europe/London (GMT)</option>
                        <option value="America/New_York">America/New_York (EST)</option>
                        <option value="Europe/Paris">Europe/Paris (CET)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-commission" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Default Commission Rate (%)</label>
                    <input id="settings-commission"
                      type="number"
                      value={settings.general.commissionRate}
                      onChange={(e) => updateSettings("general", { commissionRate: parseFloat(e.target.value) || 0 })}
                      className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>
                <button
                  onClick={() => handleSave("General")}
                  disabled={saving}
                  className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {/* ===== ORGANIZATION: Team ===== */}
          {activeSection === "team" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold font-heading">Team Members</h3>
                <button
                  onClick={() => showToast("Team management coming soon")}
                  className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800"
                >
                  + Invite Member
                </button>
              </div>
              <div className="space-y-3">
                {[
                  { name: "Sarah Mitchell", email: "ops@lordandtaylor.com", role: "Admin", status: "Active" },
                  { name: "James Chen", email: "james@lordandtaylor.com", role: "Operations", status: "Active" },
                  { name: "Emily Ross", email: "emily@lordandtaylor.com", role: "Finance", status: "Active" },
                  { name: "David Park", email: "david@lordandtaylor.com", role: "Catalog", status: "Invited" },
                ].map((member) => (
                  <div key={member.email} className="flex items-center justify-between py-3 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                        {member.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-semibold font-body">{member.name}</p>
                        <p className="text-xs text-gray-400 font-body">{member.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-body text-gray-500">{member.role}</span>
                      <span className={cn("text-xs font-semibold font-body", member.status === "Active" ? "text-green-600" : "text-amber-600")}>{member.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== ORGANIZATION: Branding ===== */}
          {activeSection === "branding" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
              <h3 className="text-sm font-bold font-heading mb-4">Branding & Appearance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Logo</label>
                  <div
                    onClick={() => showToast("Logo upload coming soon")}
                    className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-body cursor-pointer hover:border-gray-400"
                  >
                    Upload Logo
                  </div>
                </div>
                <div>
                  <label htmlFor="settings-primary-color" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: settings.branding.primaryColor }} />
                    <input
                      id="settings-primary-color"
                      type="text"
                      value={settings.branding.primaryColor}
                      onChange={(e) => updateSettings("branding", { primaryColor: e.target.value })}
                      className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="settings-accent-color" className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg border border-gray-200" style={{ backgroundColor: settings.branding.accentColor }} />
                    <input
                      id="settings-accent-color"
                      type="text"
                      value={settings.branding.accentColor}
                      onChange={(e) => updateSettings("branding", { accentColor: e.target.value })}
                      className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-300"
                    />
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleSave("Branding")}
                disabled={saving}
                className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? "Saving..." : "Save Branding"}
              </button>
            </div>
          )}

          {/* ===== INTEGRATIONS: Shopify ===== */}
          {activeSection === "shopify" && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-heading">Shopify Store Connection</h3>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 font-body">
                    <CheckCircle size={12} /> Connected
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Store URL", value: "lordandtaylor.myshopify.com" },
                    { label: "API Version", value: "2026-01" },
                    { label: "Last Sync", value: "2 minutes ago" },
                    { label: "Webhooks", value: "Active (12 topics)" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm font-body py-2 border-b border-gray-50">
                      <span className="text-gray-500">{item.label}</span>
                      <span className={cn("font-medium", item.label === "Webhooks" && "text-green-600")}>{item.value}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => showToast("Shopify sync initiated")}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <RefreshCw size={12} /> Sync Now
                  </button>
                  <button
                    onClick={() => showToast("Shopify admin link coming soon")}
                    className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5"
                  >
                    <ExternalLink size={12} /> Open Shopify Admin
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">Sync Settings</h3>
                <div className="space-y-3">
                  {([
                    { key: "autoSyncOrders", label: "Auto-sync orders", desc: "Automatically import new Shopify orders" },
                    { key: "autoSyncProducts", label: "Auto-sync products", desc: "Push product changes to Shopify" },
                    { key: "autoSyncInventory", label: "Auto-sync inventory", desc: "Real-time inventory level updates" },
                    { key: "autoFulfillOrders", label: "Auto-fulfill orders", desc: "Mark orders as fulfilled when shipped" },
                  ] as const).map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold font-body">{item.label}</p>
                        <p className="text-xs text-gray-500 font-body">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          updateSettings("shopify", { [item.key]: !settings.shopify[item.key] });
                          setTimeout(() => {
                            saveSettings({ ...settings, shopify: { ...settings.shopify, [item.key]: !settings.shopify[item.key] } });
                            showToast(`${item.label} ${!settings.shopify[item.key] ? "enabled" : "disabled"}`);
                          }, 100);
                        }}
                        className={cn("w-10 h-5 rounded-full cursor-pointer transition-colors relative", settings.shopify[item.key] ? "bg-green-500" : "bg-gray-300")}
                      >
                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform absolute top-0.5", settings.shopify[item.key] ? "left-5" : "left-0.5")} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== INTEGRATIONS: Carriers ===== */}
          {activeSection === "shipping" && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">Carrier Integrations</h3>
                <div className="space-y-3">
                  {[
                    { name: "FedEx", status: "Connected", account: "****7842" },
                    { name: "DHL Express", status: "Connected", account: "****3156" },
                    { name: "UPS", status: "Not Connected", account: null },
                    { name: "Royal Mail", status: "Connected", account: "****9021" },
                  ].map((carrier) => (
                    <div key={carrier.name} className="flex items-center justify-between py-3 border-b border-gray-50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                          <Truck size={14} className="text-gray-500" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold font-body">{carrier.name}</p>
                          {carrier.account && <p className="text-xs text-gray-400 font-body">Account: {carrier.account}</p>}
                        </div>
                      </div>
                      <span className={cn("text-xs font-semibold font-body", carrier.status === "Connected" ? "text-green-600" : "text-gray-400")}>
                        {carrier.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">Shipping Rules</h3>
                <div className="space-y-3">
                  {[
                    { label: "Default Carrier", value: "FedEx International Priority" },
                    { label: "SLA: Ship Within", value: "48 hours" },
                    { label: "Label Format", value: "PDF (4x6 inch)" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm font-body py-2 border-b border-gray-50">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== INTEGRATIONS: Payments ===== */}
          {activeSection === "payments" && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold font-heading">Revolut Business</h3>
                  <span className="flex items-center gap-1.5 text-xs font-semibold text-green-600 font-body">
                    <CheckCircle size={12} /> Connected
                  </span>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Account", value: "Lord & Taylor Ltd — ****4521" },
                    { label: "Settlement Frequency", value: "Weekly (Monday)" },
                    { label: "Minimum Payout", value: "£100.00" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between text-sm font-body py-2 border-b border-gray-50">
                      <span className="text-gray-500">{item.label}</span>
                      <span className="font-medium">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== INTEGRATIONS: Notifications ===== */}
          {activeSection === "notifications" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
              <h3 className="text-sm font-bold font-heading mb-4">Notification Preferences</h3>
              <div className="space-y-3">
                {([
                  { key: "newOrder", label: "New order received" },
                  { key: "orderShipped", label: "Order shipped" },
                  { key: "returnRequested", label: "Return requested" },
                  { key: "slaBreach", label: "SLA breach warning" },
                  { key: "settlementCompleted", label: "Settlement completed" },
                  { key: "vendorOnboarding", label: "Vendor onboarding complete" },
                  { key: "lowStock", label: "Low stock alert" },
                ] as const).map((item) => {
                  const pref = settings.notifications[item.key] || { email: false, slack: false };
                  return (
                    <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <span className="text-sm font-body">{item.label}</span>
                      <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 text-xs font-body cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.email}
                            onChange={(e) => {
                              const updated = { ...settings.notifications, [item.key]: { ...pref, email: e.target.checked } };
                              updateSettings("notifications", updated);
                            }}
                            className="rounded"
                          />
                          Email
                        </label>
                        <label className="flex items-center gap-1.5 text-xs font-body cursor-pointer">
                          <input
                            type="checkbox"
                            checked={pref.slack}
                            onChange={(e) => {
                              const updated = { ...settings.notifications, [item.key]: { ...pref, slack: e.target.checked } };
                              updateSettings("notifications", updated);
                            }}
                            className="rounded"
                          />
                          Slack
                        </label>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={() => handleSave("Notification")}
                disabled={saving}
                className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          )}

          {/* ===== SECURITY: Security Settings ===== */}
          {activeSection === "security" && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Shield size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold font-body text-amber-800">Admin-Only Section</p>
                  <p className="text-xs text-amber-700 font-body mt-0.5">Changes to security settings affect all users. All modifications are logged in the audit trail.</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">Security Settings</h3>
                <div className="space-y-3">
                  {([
                    { key: "twoFactor", label: "Two-Factor Authentication", desc: "Require 2FA for all admin accounts" },
                    { key: "sessionTimeout", label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity" },
                    { key: "ipWhitelist", label: "IP Whitelisting", desc: "Restrict API access to specific IPs" },
                    { key: "auditLogging", label: "Audit Logging", desc: "Log all admin actions for compliance" },
                  ] as const).map((item) => (
                    <div key={item.key} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold font-body">{item.label}</p>
                        <p className="text-xs text-gray-500 font-body">{item.desc}</p>
                      </div>
                      <button
                        onClick={() => {
                          updateSettings("security", { [item.key]: !settings.security[item.key] });
                          setTimeout(() => {
                            saveSettings({ ...settings, security: { ...settings.security, [item.key]: !settings.security[item.key] } });
                            showToast(`${item.label} ${!settings.security[item.key] ? "enabled" : "disabled"}`);
                          }, 100);
                        }}
                        className={cn("w-10 h-5 rounded-full cursor-pointer transition-colors relative", settings.security[item.key] ? "bg-green-500" : "bg-gray-300")}
                      >
                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform absolute top-0.5", settings.security[item.key] ? "left-5" : "left-0.5")} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ===== SECURITY: API Keys ===== */}
          {activeSection === "api-keys" && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <Lock size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold font-body text-amber-800">Sensitive Credentials</p>
                  <p className="text-xs text-amber-700 font-body mt-0.5">API key regeneration is irreversible. All active integrations using the old key will stop working immediately.</p>
                </div>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">API Keys</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-semibold font-body">Production API Key</p>
                      <p className="text-xs text-gray-400 font-mono">sk_live_****************************7f3a</p>
                    </div>
                    <button
                      onClick={() => showToast("API key regeneration coming soon")}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold font-body"
                    >
                      Regenerate
                    </button>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-semibold font-body">Webhook Secret</p>
                      <p className="text-xs text-gray-400 font-mono">whsec_****************************9b2e</p>
                    </div>
                    <button
                      onClick={() => showToast("Webhook secret regeneration coming soon")}
                      className="text-xs text-red-500 hover:text-red-700 font-semibold font-body"
                    >
                      Regenerate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
