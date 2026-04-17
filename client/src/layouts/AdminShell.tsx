/**
 * AdminShell — RETAILER_LT Layout
 * =================================
 * Full sidebar navigation + top bar.
 * Used for Lord & Taylor admin users.
 * All retailer routes are children of this shell.
 */

import { Route, Switch } from "wouter";
import { SidebarProvider, useSidebar } from "@/contexts/SidebarContext";
import { Sidebar } from "@/components/Sidebar";
import { TopBar } from "@/components/TopBar";
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
import {
  Ads, Marketing,
  ProductPricing, ProductEnrichment,
  ShippingCosts, ShippingSettings,
} from "@/pages/Placeholder";

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
            <Route path="/" component={Dashboard} />
            {/* Vendors */}
            <Route path="/vendors" component={Vendors} />
            <Route path="/vendors/onboard" component={VendorOnboarding} />
            <Route path="/vendors/performance">{() => <div className="p-8"><h2 className="font-heading small-caps text-2xl">Vendor Performance</h2><p className="text-gray-500 mt-2">Coming soon</p></div>}</Route>
            <Route path="/vendors/:id" component={VendorDetail} />
            {/* Products */}
            <Route path="/products" component={Products} />
            <Route path="/products/pending" component={PendingProducts} />
            <Route path="/products/pricing" component={ProductPricing} />
            <Route path="/products/enrichment" component={ProductEnrichment} />
            <Route path="/products/:id" component={ProductDetail} />
            {/* Orders */}
            <Route path="/orders" component={Orders} />
            <Route path="/orders/pending" component={PendingOrders} />
            <Route path="/orders/returns" component={Returns} />
            <Route path="/orders/returns/:id" component={ReturnDetail} />
            <Route path="/orders/issues" component={Issues} />
            <Route path="/orders/analytics" component={OrderAnalytics} />
            <Route path="/orders/:id" component={OrderDetail} />
            {/* Shipping */}
            <Route path="/shipping" component={Shipping} />
            <Route path="/shipping/costs" component={ShippingCosts} />
            <Route path="/shipping/settings" component={ShippingSettings} />
            <Route path="/shipping/:id" component={ShipmentDetail} />
            {/* Messages */}
            <Route path="/messages" component={Messages} />
            {/* Finance */}
            <Route path="/finance" component={Finance} />
            <Route path="/finance/payouts" component={Payouts} />
            <Route path="/finance/deductions" component={Deductions} />
            <Route path="/finance/balances" component={VendorBalances} />
            {/* Ads & Marketing */}
            <Route path="/ads" component={Ads} />
            <Route path="/marketing" component={Marketing} />
            {/* Activity Log */}
            <Route path="/activity" component={ActivityLog} />
            {/* Settings & Admin */}
            <Route path="/settings" component={Settings} />
            <Route path="/admin/queues" component={QueueMonitor} />
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
