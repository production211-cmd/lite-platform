import { TopBar } from "@/components/TopBar";
import { Construction } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle?: string;
}

export function PlaceholderPage({ title, subtitle }: PlaceholderPageProps) {
  return (
    <div>
      <TopBar title={title} subtitle={subtitle} />
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Construction size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-700 mb-2">{title}</h2>
          <p className="text-sm text-slate-500 max-w-md">
            This section is under development. The full {title.toLowerCase()} management interface
            will be available in the next release.
          </p>
        </div>
      </div>
    </div>
  );
}

export function Ads() {
  return <PlaceholderPage title="Ads Management" subtitle="Sponsored placements & ad campaigns" />;
}

export function Marketing() {
  return <PlaceholderPage title="Marketing & Events" subtitle="Event pricing, promotions, and vendor offers" />;
}

export function SettingsPage() {
  return <PlaceholderPage title="Settings" subtitle="Platform configuration and preferences" />;
}

export function OrderAnalytics() {
  return <PlaceholderPage title="Order Analytics" subtitle="Order trends, conversion rates, and performance metrics" />;
}

export function Issues() {
  return <PlaceholderPage title="Issues & Disputes" subtitle="Manage customer complaints and vendor disputes" />;
}

export function PendingOrders() {
  return <PlaceholderPage title="Pending Acceptance" subtitle="Orders awaiting vendor confirmation" />;
}

export function ProductPricing() {
  return <PlaceholderPage title="Pricing Strategies" subtitle="Dynamic pricing, competitive analysis, and margin management" />;
}

export function ProductEnrichment() {
  return <PlaceholderPage title="Product Enrichment" subtitle="AI-powered description, SEO, and attribute scoring" />;
}

export function PendingProducts() {
  return <PlaceholderPage title="Pending Review" subtitle="Products awaiting catalog team approval" />;
}

export function ShippingCosts() {
  return <PlaceholderPage title="Shipping Costs" subtitle="Carrier rate analysis and cost optimization" />;
}

export function ShippingSettings() {
  return <PlaceholderPage title="Shipping Settings" subtitle="Carrier accounts, label templates, and routing rules" />;
}

export function Payouts() {
  return <PlaceholderPage title="Payouts" subtitle="Vendor payment schedules and disbursements" />;
}

export function Deductions() {
  return <PlaceholderPage title="Deductions" subtitle="Returns, chargebacks, and vendor penalties" />;
}

export function VendorBalances() {
  return <PlaceholderPage title="Vendor Balances" subtitle="Outstanding balances and settlement tracking" />;
}
