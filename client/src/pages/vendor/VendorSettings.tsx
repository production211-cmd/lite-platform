/**
 * VendorSettings — Vendor Account Settings
 * ==========================================
 * Business info, payment settings, notification preferences,
 * shipping defaults, and API keys.
 */
import { useState, useEffect, useRef, useCallback } from "react";
// Simple toast helper (no external dependency)
const showToast = (msg: string) => {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className = "fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-lg shadow-lg text-sm animate-fade-in";
  document.body.appendChild(el);
  setTimeout(() => { el.style.opacity = "0"; el.style.transition = "opacity 0.3s"; setTimeout(() => el.remove(), 300); }, 3000);
};
import { useAuth } from "@/contexts/AuthContext";
import {
  Building2, CreditCard, Bell, Truck, Key, Save,
  Check, AlertTriangle, Eye, EyeOff, Globe, Mail,
  Phone, MapPin, User,
} from "lucide-react";

type SettingsTab = "business" | "payment" | "notifications" | "shipping" | "api";

const TABS: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
  { id: "business", label: "Business Info", icon: Building2 },
  { id: "payment", label: "Payment", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "shipping", label: "Shipping", icon: Truck },
  { id: "api", label: "API & Integrations", icon: Key },
];

export default function VendorSettings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>("business");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const initialState = useRef<string>("");

  // Fetch API key from server (never hardcode secrets in source)
  useEffect(() => {
    let cancelled = false;
    const fetchApiKey = async () => {
      try {
        // In production: const res = await api.get('/vendor/api-key');
        // Simulating server response with masked key
        await new Promise(r => setTimeout(r, 500));
        if (!cancelled) setApiKey("[fetched from server]");
      } catch { if (!cancelled) setApiKey(null); }
    };
    fetchApiKey();
    return () => { cancelled = true; };
  }, []);

  const [business, setBusiness] = useState({
    name: user?.vendorName || "Urban Threads",
    legalName: "Urban Threads LLC",
    email: "operations@urbanthreads.com",
    phone: "+1 (212) 555-0199",
    website: "https://urbanthreads.com",
    address: "450 Broadway, Suite 300",
    city: "New York",
    state: "NY",
    zip: "10013",
    country: "US",
    taxId: "XX-XXXXXXX",
  });

  const [payment, setPayment] = useState({
    method: "ach",
    bankName: "Chase Bank",
    accountLast4: "4567",
    routingLast4: "8901",
    payoutSchedule: "weekly",
    minimumPayout: "100",
  });

  const [notifications, setNotifications] = useState({
    newOrder: true,
    orderShipped: true,
    returnRequest: true,
    payoutProcessed: true,
    lowInventory: true,
    productApproved: true,
    weeklyDigest: true,
    marketingUpdates: false,
  });

  const [shipping, setShipping] = useState({
    defaultCarrier: "UPS",
    defaultService: "Ground",
    handlingTime: "2",
    returnAddress: "same",
    freeShippingThreshold: "200",
    signatureRequired: "over500",
  });

  // Track unsaved changes (must be after state declarations)
  useEffect(() => {
    const current = JSON.stringify({ business, payment, notifications, shipping });
    if (!initialState.current) initialState.current = current;
    setIsDirty(current !== initialState.current);
  }, [business, payment, notifications, shipping]);

  // Warn on navigation away with unsaved changes
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) { e.preventDefault(); e.returnValue = ""; }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    setSaving(false);
    setSaved(true);
    setIsDirty(false);
    initialState.current = JSON.stringify({ business, payment, notifications, shipping });
    showToast("Settings saved successfully");
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="page-enter p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-heading text-2xl tracking-wide text-gray-900">Settings</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your vendor account preferences</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
        >
          {saved ? <Check size={16} /> : <Save size={16} />}
          {saving ? "Saving..." : saved ? "Saved" : isDirty ? "Save Changes *" : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Tab Navigation */}
        <nav className="md:w-56 shrink-0" aria-label="Settings sections">
          <div className="bg-white rounded-xl border border-gray-200 shadow-soft overflow-hidden" role="tablist" aria-orientation="vertical">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  role="tab"
                  aria-selected={activeTab === tab.id}
                  aria-controls={`tabpanel-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors ${
                    activeTab === tab.id
                      ? "bg-gray-900 text-white font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-soft p-6" role="tabpanel" id={`tabpanel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {/* Business Info */}
          {activeTab === "business" && (
            <div className="space-y-6">
              <h2 className="font-heading text-lg tracking-wide text-gray-900">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                  <input type="text" value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Legal Name</label>
                  <input type="text" value={business.legalName} onChange={(e) => setBusiness({ ...business, legalName: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" value={business.email} onChange={(e) => setBusiness({ ...business, email: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" value={business.phone} onChange={(e) => setBusiness({ ...business, phone: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input type="url" value={business.website} onChange={(e) => setBusiness({ ...business, website: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tax ID</label>
                  <input type="text" value={business.taxId} onChange={(e) => setBusiness({ ...business, taxId: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input type="text" value={business.address} onChange={(e) => setBusiness({ ...business, address: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input type="text" value={business.city} onChange={(e) => setBusiness({ ...business, city: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                    <input type="text" value={business.state} onChange={(e) => setBusiness({ ...business, state: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ZIP</label>
                    <input type="text" value={business.zip} onChange={(e) => setBusiness({ ...business, zip: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input type="text" value={business.country} onChange={(e) => setBusiness({ ...business, country: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment */}
          {activeTab === "payment" && (
            <div className="space-y-6">
              <h2 className="font-heading text-lg tracking-wide text-gray-900">Payment Settings</h2>
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <Check size={16} className="text-green-600" />
                <span className="text-sm text-green-800">Bank account verified — {payment.bankName} ending in {payment.accountLast4}</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payout Schedule</label>
                  <select value={payment.payoutSchedule} onChange={(e) => setPayment({ ...payment, payoutSchedule: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
                    <option value="weekly">Weekly (every Friday)</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Payout ($)</label>
                  <input type="number" min="0" max="10000" step="1" value={payment.minimumPayout} onChange={(e) => setPayment({ ...payment, minimumPayout: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <CreditCard size={16} />
                Update Bank Account
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <h2 className="font-heading text-lg tracking-wide text-gray-900">Notification Preferences</h2>
              <div className="space-y-4">
                {Object.entries(notifications).map(([key, value]) => (
                  <label key={key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                    <span className="text-sm text-gray-700">{key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase())}</span>
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Shipping */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              <h2 className="font-heading text-lg tracking-wide text-gray-900">Shipping Defaults</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Carrier</label>
                  <select value={shipping.defaultCarrier} onChange={(e) => setShipping({ ...shipping, defaultCarrier: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
                    <option>UPS</option><option>FedEx</option><option>USPS</option><option>DHL</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Default Service</label>
                  <select value={shipping.defaultService} onChange={(e) => setShipping({ ...shipping, defaultService: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
                    <option>Ground</option><option>2-Day</option><option>Overnight</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Handling Time (days)</label>
                  <input type="number" min="0" max="30" step="1" value={shipping.handlingTime} onChange={(e) => setShipping({ ...shipping, handlingTime: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Free Shipping Threshold ($)</label>
                  <input type="number" min="0" max="99999" step="1" value={shipping.freeShippingThreshold} onChange={(e) => setShipping({ ...shipping, freeShippingThreshold: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Signature Required</label>
                  <select value={shipping.signatureRequired} onChange={(e) => setShipping({ ...shipping, signatureRequired: e.target.value })} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900">
                    <option value="never">Never</option>
                    <option value="over500">Orders over $500</option>
                    <option value="always">Always</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* API & Integrations */}
          {activeTab === "api" && (
            <div className="space-y-6">
              <h2 className="font-heading text-lg tracking-wide text-gray-900">API & Integrations</h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-2">API Key</label>
                <div className="flex items-center gap-2">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={apiKey ? (showApiKey ? apiKey : "••••••••••••••••••••") : "Loading..."}
                    readOnly
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-mono bg-white"
                  />
                  <button onClick={() => setShowApiKey(!showApiKey)} className="p-2.5 border border-gray-300 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors">
                    {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Use this key to integrate with your inventory management system.</p>
              </div>
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800">Webhook Endpoint</p>
                  <p className="text-xs text-amber-700 mt-1">Configure your webhook URL to receive real-time order and inventory updates.</p>
                  <input type="url" placeholder="https://your-server.com/webhooks/lite" className="mt-2 w-full px-4 py-2 border border-amber-300 rounded-lg text-sm focus:ring-2 focus:ring-gray-900 focus:border-gray-900 bg-white" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
