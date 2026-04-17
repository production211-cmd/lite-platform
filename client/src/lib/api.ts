const API_BASE = "/api";

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem("lite-token", token);
    } else {
      localStorage.removeItem("lite-token");
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem("lite-token");
    }
    return this.token;
  }

  private async request<T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth
  login(email: string, password: string) {
    return this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request<any>("/auth/me");
  }

  // Dashboard
  getDashboardKPIs() {
    return this.request<any>("/dashboard/kpis");
  }

  getRecentOrders() {
    return this.request<any>("/dashboard/recent-orders");
  }

  getTopVendors() {
    return this.request<any>("/dashboard/top-vendors");
  }

  getRevenueChart() {
    return this.request<any>("/dashboard/revenue-chart");
  }

  // Vendors
  getVendors(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/vendors${qs}`);
  }

  getVendor(id: string) {
    return this.request<any>(`/vendors/${id}`);
  }

  getVendorProducts(id: string, params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/vendors/${id}/products${qs}`);
  }

  getVendorOrders(id: string, params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/vendors/${id}/orders${qs}`);
  }

  getVendorPerformance(id: string) {
    return this.request<any>(`/vendors/${id}/performance`);
  }

  // Products
  getProducts(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/products${qs}`);
  }

  getProductStats() {
    return this.request<any>("/products/stats");
  }

  getPendingProducts(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/products/pending${qs}`);
  }

  getProduct(id: string) {
    return this.request<any>(`/products/${id}`);
  }

  approveProduct(id: string) {
    return this.request<any>(`/products/${id}/approve`, { method: "POST" });
  }

  pushProduct(id: string) {
    return this.request<any>(`/products/${id}/push`, { method: "POST" });
  }

  // Orders
  getOrders(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/orders${qs}`);
  }

  getOrderStats() {
    return this.request<any>("/orders/stats");
  }

  getOrder(id: string) {
    return this.request<any>(`/orders/${id}`);
  }

  getPendingAcceptance(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/orders/pending-acceptance${qs}`);
  }

  // Shipments
  getShipments(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/shipments${qs}`);
  }

  getShipmentStats() {
    return this.request<any>("/shipments/stats");
  }

  getShipment(id: string) {
    return this.request<any>(`/shipments/${id}`);
  }

  // Returns
  getReturns(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/returns${qs}`);
  }

  getReturnStats() {
    return this.request<any>("/returns/stats");
  }

  // Finance
  getPayouts(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/finance/payouts${qs}`);
  }

  getPayoutStats() {
    return this.request<any>("/finance/payouts/stats");
  }

  getDeductions(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/finance/deductions${qs}`);
  }

  getPnL() {
    return this.request<any>("/finance/pnl");
  }

  getVendorBalances() {
    return this.request<any>("/finance/vendor-balances");
  }

  // Messages
  getMessageThreads(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/messages/threads${qs}`);
  }

  getMessageThread(id: string) {
    return this.request<any>(`/messages/threads/${id}`);
  }

  getMessageStats() {
    return this.request<any>("/messages/stats");
  }

  sendMessage(threadId: string, data: { senderId: string; content: string; isInternal?: boolean }) {
    return this.request<any>(`/messages/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // Analytics
  getOrderAnalytics(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/analytics/orders${qs}`);
  }

  getVendorAnalytics() {
    return this.request<any>("/analytics/vendors");
  }

  getShippingAnalytics() {
    return this.request<any>("/analytics/shipping");
  }

  getCatalogAnalytics() {
    return this.request<any>("/analytics/catalog");
  }
}

export const api = new ApiClient();
