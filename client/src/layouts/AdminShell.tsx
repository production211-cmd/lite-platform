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
import Products from "@/pages/Products";
import Orders from "@/pages/Orders";
import Shipping from "@/pages/Shipping";
import Messages from "@/pages/Messages";
import Finance from "@/pages/Finance";
import Returns from "@/pages/Returns";
import {
  Ads, Marketing, SettingsPage, OrderAnalytics, Issues,
  PendingOrders, ProductPricing, ProductEnrichment, PendingProducts,
  ShippingCosts, ShippingSettings, Payouts, Deductions, VendorBalances,
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
            <Route path="/vendors" component={Vendors} />
            <Route path="/vendors/performance">{() => <div className="p-8"><h2 className="font-heading small-caps text-2xl">Vendor Performance</h2><p className="text-gray-500 mt-2">Coming soon</p></div>}</Route>
            <Route path="/vendors/:id">{() => <div className="p-8"><h2 className="font-heading small-caps text-2xl">Vendor Detail</h2></div>}</Route>
            <Route path="/products" component={Products} />
            <Route path="/products/pending" component={PendingProducts} />
            <Route path="/products/pricing" component={ProductPricing} />
            <Route path="/products/enrichment" component={ProductEnrichment} />
            <Route path="/orders" component={Orders} />
            <Route path="/orders/pending" component={PendingOrders} />
            <Route path="/orders/returns" component={Returns} />
            <Route path="/orders/issues" component={Issues} />
            <Route path="/orders/analytics" component={OrderAnalytics} />
            <Route path="/shipping" component={Shipping} />
            <Route path="/shipping/costs" component={ShippingCosts} />
            <Route path="/shipping/settings" component={ShippingSettings} />
            <Route path="/messages" component={Messages} />
            <Route path="/finance" component={Finance} />
            <Route path="/finance/payouts" component={Payouts} />
            <Route path="/finance/deductions" component={Deductions} />
            <Route path="/finance/balances" component={VendorBalances} />
            <Route path="/ads" component={Ads} />
            <Route path="/marketing" component={Marketing} />
            <Route path="/settings" component={SettingsPage} />
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
