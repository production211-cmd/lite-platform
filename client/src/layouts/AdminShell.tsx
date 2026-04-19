/**
 * AdminShell — RETAILER_LT Layout
 * =================================
 * Full sidebar navigation + top bar.
 * Used for Lord & Taylor admin users.
 * All retailer routes are children of this shell.
 * Each route is wrapped in a RouteErrorBoundary for isolation.
 */

import { Route, Switch } from "wouter";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
import { withErrorBoundary } from "@/components/RouteErrorBoundary";
import Dashboard from "@/pages/Dashboard";
import Vendors from "@/pages/Vendors";
import VendorDetail from "@/pages/VendorDetail";
import VendorOnboarding from "@/pages/VendorOnboarding";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Orders from "@/pages/Orders";
import OrderDetail from "@/pages/OrderDetail";
import Shipping from "@/pages/Shipping";
import ShipmentDetail from "@/pages/ShipmentDetail";
import Messages from "@/pages/Messages";
import Finance from "@/pages/Finance";
import Returns from "@/pages/Returns";
import ReturnDetail from "@/pages/ReturnDetail";
import PendingOrders from "@/pages/PendingOrders";
import OrderAnalytics from "@/pages/OrderAnalytics";
import PendingProducts from "@/pages/PendingProducts";
import Payouts from "@/pages/Payouts";
import Deductions from "@/pages/Deductions";
import VendorBalances from "@/pages/VendorBalances";
import Settings from "@/pages/Settings";
import QueueMonitor from "@/pages/QueueMonitor";
import Issues from "@/pages/Issues";
import ActivityLog from "@/pages/ActivityLog";
import UserManagement from "@/pages/UserManagement";
import Analytics from "@/pages/Analytics";
import NotificationCenter from "@/pages/NotificationCenter";
import {
  Ads, Marketing,
  ProductPricing, ProductEnrichment,
  ShippingCosts, ShippingSettings,
} from "@/pages/Placeholder";

// Wrap each page component with per-route error boundaries
const SafeDashboard = withErrorBoundary(Dashboard, "Dashboard");
const SafeVendors = withErrorBoundary(Vendors, "Vendors");
const SafeVendorDetail = withErrorBoundary(VendorDetail, "Vendor Detail");
const SafeVendorOnboarding = withErrorBoundary(VendorOnboarding, "Vendor Onboarding");
const SafeProducts = withErrorBoundary(Products, "Products");
const SafeProductDetail = withErrorBoundary(ProductDetail, "Product Detail");
const SafeOrders = withErrorBoundary(Orders, "Orders");
const SafeOrderDetail = withErrorBoundary(OrderDetail, "Order Detail");
const SafeShipping = withErrorBoundary(Shipping, "Shipping");
const SafeShipmentDetail = withErrorBoundary(ShipmentDetail, "Shipment Detail");
const SafeMessages = withErrorBoundary(Messages, "Messages");
const SafeFinance = withErrorBoundary(Finance, "Finance");
const SafeReturns = withErrorBoundary(Returns, "Returns");
const SafeReturnDetail = withErrorBoundary(ReturnDetail, "Return Detail");
const SafePendingOrders = withErrorBoundary(PendingOrders, "Pending Orders");
const SafeOrderAnalytics = withErrorBoundary(OrderAnalytics, "Order Analytics");
const SafePendingProducts = withErrorBoundary(PendingProducts, "Pending Products");
const SafePayouts = withErrorBoundary(Payouts, "Payouts");
const SafeDeductions = withErrorBoundary(Deductions, "Deductions");
const SafeVendorBalances = withErrorBoundary(VendorBalances, "Vendor Balances");
const SafeSettings = withErrorBoundary(Settings, "Settings");
const SafeQueueMonitor = withErrorBoundary(QueueMonitor, "Queue Monitor");
const SafeIssues = withErrorBoundary(Issues, "Issues");
const SafeActivityLog = withErrorBoundary(ActivityLog, "Activity Log");
const SafeUserManagement = withErrorBoundary(UserManagement, "User Management");
const SafeAnalytics = withErrorBoundary(Analytics, "Analytics");
const SafeNotificationCenter = withErrorBoundary(NotificationCenter, "Notification Center");
const SafeAds = withErrorBoundary(Ads, "Ads");
const SafeMarketing = withErrorBoundary(Marketing, "Marketing");
const SafeProductPricing = withErrorBoundary(ProductPricing, "Product Pricing");
const SafeProductEnrichment = withErrorBoundary(ProductEnrichment, "Product Enrichment");
const SafeShippingCosts = withErrorBoundary(ShippingCosts, "Shipping Costs");
const SafeShippingSettings = withErrorBoundary(ShippingSettings, "Shipping Settings");

function AdminContent() {
  const { collapsed } = useSidebar();
  const sidebarWidth = collapsed ? 72 : 288;

  return (
    <div className="flex h-screen bg-[#F5F6F7]">
      <Sidebar />
      <div
        className="flex-1 flex flex-col overflow-hidden transition-all duration-300"
        style={{ marginLeft: `${sidebarWidth}px` }}
      >
        <TopBar />
        <main className="flex-1 overflow-y-auto">
          <Switch>
            <Route path="/" component={SafeDashboard} />
            {/* Vendors */}
            <Route path="/vendors" component={SafeVendors} />
            <Route path="/vendors/onboard" component={SafeVendorOnboarding} />
            <Route path="/vendors/performance">{() => <div className="p-8"><h2 className="font-heading small-caps text-2xl">Vendor Performance</h2><p className="text-gray-500 mt-2">Coming soon</p></div>}</Route>
            <Route path="/vendors/:id" component={SafeVendorDetail} />
            {/* Products */}
            <Route path="/products" component={SafeProducts} />
            <Route path="/products/pending" component={SafePendingProducts} />
            <Route path="/products/pricing" component={SafeProductPricing} />
            <Route path="/products/enrichment" component={SafeProductEnrichment} />
            <Route path="/products/:id" component={SafeProductDetail} />
            {/* Orders */}
            <Route path="/orders" component={SafeOrders} />
            <Route path="/orders/pending" component={SafePendingOrders} />
            <Route path="/orders/returns" component={SafeReturns} />
            <Route path="/orders/returns/:id" component={SafeReturnDetail} />
            <Route path="/orders/issues" component={SafeIssues} />
            <Route path="/orders/analytics" component={SafeOrderAnalytics} />
            <Route path="/orders/:id" component={SafeOrderDetail} />
            {/* Shipping */}
            <Route path="/shipping" component={SafeShipping} />
            <Route path="/shipping/costs" component={SafeShippingCosts} />
            <Route path="/shipping/settings" component={SafeShippingSettings} />
            <Route path="/shipping/:id" component={SafeShipmentDetail} />
            {/* Messages */}
            <Route path="/messages" component={SafeMessages} />
            {/* Finance */}
            <Route path="/finance" component={SafeFinance} />
            <Route path="/finance/payouts" component={SafePayouts} />
            <Route path="/finance/deductions" component={SafeDeductions} />
            <Route path="/finance/balances" component={SafeVendorBalances} />
            {/* Ads & Marketing */}
            <Route path="/ads" component={SafeAds} />
            <Route path="/marketing" component={SafeMarketing} />
            {/* Activity Log & Notifications */}
            <Route path="/activity" component={SafeActivityLog} />
            <Route path="/notifications" component={SafeNotificationCenter} />
            {/* Analytics */}
            <Route path="/analytics" component={SafeAnalytics} />
            {/* Settings & Admin */}
            <Route path="/settings" component={SafeSettings} />
            <Route path="/settings/users" component={SafeUserManagement} />
            <Route path="/admin/queues" component={SafeQueueMonitor} />
            {/* 404 */}
            <Route>
              <div className="flex items-center justify-center h-[60vh]">
                <p className="text-gray-500">Page not found</p>
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </div>
  );
}

export function AdminShell() {
  return (
    <SidebarProvider>
      <AdminContent />
    </SidebarProvider>
  );
}
