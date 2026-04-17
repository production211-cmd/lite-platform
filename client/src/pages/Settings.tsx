/**
 * Settings — Grouped Subsections with Role Gating
 * ==================================================
 * Design: Left-nav with 3 groups (Organization / Integrations / Security).
 * Role-gated: Security group only visible to admins.
 * Avoids junk-drawer anti-pattern.
 */

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Settings as SettingsIcon, Store, Truck, CreditCard, Bell,
  Users, Shield, Globe, Palette, Save, CheckCircle,
  AlertTriangle, ExternalLink, RefreshCw, Lock, ChevronRight,
  Key, Database,
} from "lucide-react";

interface SettingsGroup {
  label: string;
  sections: { key: string; label: string; icon: any; adminOnly?: boolean }[];
}

export default function Settings() {
  const { user, isRetailer } = useAuth();
  const [activeSection, setActiveSection] = useState("general");

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
                    <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Platform Name</label>
                    <input type="text" defaultValue="Lord & Taylor Marketplace" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Support Email</label>
                    <input type="email" defaultValue="marketplace@lordandtaylor.com" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Default Currency</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body bg-white">
                        <option>GBP (£)</option>
                        <option>USD ($)</option>
                        <option>EUR (€)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Timezone</label>
                      <select className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm font-body bg-white">
                        <option>Europe/London (GMT)</option>
                        <option>America/New_York (EST)</option>
                        <option>Europe/Paris (CET)</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Default Commission Rate (%)</label>
                    <input type="number" defaultValue="18" className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-body focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
                <button className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5">
                  <Save size={12} /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* ===== ORGANIZATION: Team ===== */}
          {activeSection === "team" && (
            <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold font-heading">Team Members</h3>
                <button className="px-3 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800">+ Invite Member</button>
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
                  <div className="w-32 h-32 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-xs font-body cursor-pointer hover:border-gray-400">
                    Upload Logo
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Primary Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-900 border border-gray-200" />
                    <input type="text" defaultValue="#1a1a2e" className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold font-body text-gray-500 mb-1.5">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#c8a45c] border border-gray-200" />
                    <input type="text" defaultValue="#c8a45c" className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-gray-300" />
                  </div>
                </div>
              </div>
              <button className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5">
                <Save size={12} /> Save Branding
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
                  <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
                    <RefreshCw size={12} /> Sync Now
                  </button>
                  <button className="px-3 py-2 border border-gray-200 rounded-lg text-xs font-semibold font-body hover:bg-gray-50 flex items-center gap-1.5">
                    <ExternalLink size={12} /> Open Shopify Admin
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 shadow-soft p-6">
                <h3 className="text-sm font-bold font-heading mb-4">Sync Settings</h3>
                <div className="space-y-3">
                  {[
                    { label: "Auto-sync orders", desc: "Automatically import new Shopify orders", enabled: true },
                    { label: "Auto-sync products", desc: "Push product changes to Shopify", enabled: true },
                    { label: "Auto-sync inventory", desc: "Real-time inventory level updates", enabled: false },
                    { label: "Auto-fulfill orders", desc: "Mark orders as fulfilled when shipped", enabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold font-body">{item.label}</p>
                        <p className="text-xs text-gray-500 font-body">{item.desc}</p>
                      </div>
                      <div className={cn("w-10 h-5 rounded-full cursor-pointer transition-colors", item.enabled ? "bg-green-500" : "bg-gray-300")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5", item.enabled ? "translate-x-5 ml-0.5" : "translate-x-0.5")} />
                      </div>
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
                {[
                  { label: "New order received", email: true, slack: true },
                  { label: "Order shipped", email: true, slack: false },
                  { label: "Return requested", email: true, slack: true },
                  { label: "SLA breach warning", email: true, slack: true },
                  { label: "Settlement completed", email: true, slack: false },
                  { label: "Vendor onboarding complete", email: true, slack: false },
                  { label: "Low stock alert", email: false, slack: true },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <span className="text-sm font-body">{item.label}</span>
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs font-body">
                        <input type="checkbox" defaultChecked={item.email} className="rounded" /> Email
                      </label>
                      <label className="flex items-center gap-1.5 text-xs font-body">
                        <input type="checkbox" defaultChecked={item.slack} className="rounded" /> Slack
                      </label>
                    </div>
                  </div>
                ))}
              </div>
              <button className="mt-5 px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold font-body hover:bg-gray-800 flex items-center gap-1.5">
                <Save size={12} /> Save Preferences
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
                  {[
                    { label: "Two-Factor Authentication", desc: "Require 2FA for all admin accounts", enabled: true },
                    { label: "Session Timeout", desc: "Auto-logout after 30 minutes of inactivity", enabled: true },
                    { label: "IP Whitelisting", desc: "Restrict API access to specific IPs", enabled: false },
                    { label: "Audit Logging", desc: "Log all admin actions for compliance", enabled: true },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between py-2.5 border-b border-gray-50">
                      <div>
                        <p className="text-sm font-semibold font-body">{item.label}</p>
                        <p className="text-xs text-gray-500 font-body">{item.desc}</p>
                      </div>
                      <div className={cn("w-10 h-5 rounded-full cursor-pointer transition-colors", item.enabled ? "bg-green-500" : "bg-gray-300")}>
                        <div className={cn("w-4 h-4 bg-white rounded-full shadow-sm transition-transform mt-0.5", item.enabled ? "translate-x-5 ml-0.5" : "translate-x-0.5")} />
                      </div>
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
                    <button className="text-xs text-red-500 hover:text-red-700 font-semibold font-body">Regenerate</button>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b border-gray-50">
                    <div>
                      <p className="text-sm font-semibold font-body">Webhook Secret</p>
                      <p className="text-xs text-gray-400 font-mono">whsec_****************************9b2e</p>
                    </div>
                    <button className="text-xs text-red-500 hover:text-red-700 font-semibold font-body">Regenerate</button>
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
