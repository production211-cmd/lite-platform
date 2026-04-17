import { Route, Switch } from "wouter";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { Sidebar } from "@/components/Sidebar";
import Login from "@/pages/Login";
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

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafbfc]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#c8a45c] flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-xl">LT</span>
          </div>
          <div className="w-8 h-8 border-2 border-slate-200 border-t-[#c8a45c] rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500 mt-4">Loading LITE Platform...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen bg-[var(--background)]">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/vendors" component={Vendors} />
          <Route path="/vendors/:id">{() => <div>Vendor Detail</div>}</Route>
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
              <p className="text-slate-500">Page not found</p>
            </div>
          </Route>
        </Switch>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}
