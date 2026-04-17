const API_BASE = "/api";

class ApiClient {
  private token: string | null = null;
  private refreshing: Promise<boolean> | null = null;

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

  // Auto-refresh on 401
  private async tryRefresh(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.token) {
        this.setToken(data.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async request<T>(
    path: string,
    options: RequestInit = {},
    retry = true
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
      credentials: "include",
    });

    // Auto-refresh on 401
    if (response.status === 401 && retry) {
      if (!this.refreshing) {
        this.refreshing = this.tryRefresh().finally(() => {
          this.refreshing = null;
        });
      }
      const refreshed = await this.refreshing;
      if (refreshed) {
        return this.request<T>(path, options, false);
      }
      // Refresh failed — clear token and redirect to login
      this.setToken(null);
      window.location.href = "/login";
      throw new Error("Session expired");
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: "Request failed" }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============================================================
  // Auth
  // ============================================================
  login(email: string, password: string) {
    return this.request<{ token: string; user: any }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  getMe() {
    return this.request<any>("/auth/me");
  }

  logout() {
    return this.request<any>("/auth/logout", { method: "POST" });
  }

  logoutAll() {
    return this.request<any>("/auth/logout-all", { method: "POST" });
  }

  // ============================================================
  // Dashboard
  // ============================================================
  getDashboardKPIs(range?: string) {
    const params = range && range !== 'custom' ? `?range=${range}` : '';
    return this.request<any>(`/dashboard/kpis${params}`);
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

  getActivity(params?: { limit?: string; page?: string }) {
    const qs = new URLSearchParams(params || {}).toString();
    return this.request<any>(`/activity${qs ? `?${qs}` : ""}`);
  }

  // ============================================================
  // Vendors
  // ============================================================
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

  createVendor(data: any) {
    return this.request<any>("/vendors", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  updateVendor(id: string, data: any) {
    return this.request<any>(`/vendors/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // ============================================================
  // Products
  // ============================================================
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

  updateProduct(id: string, data: any) {
    return this.request<any>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  approveProduct(id: string) {
    return this.request<any>(`/products/${id}/approve`, { method: "POST" });
  }

  pushProduct(id: string) {
    return this.request<any>(`/products/${id}/push`, { method: "POST" });
  }

  rejectProduct(id: string) {
    return this.request<any>(`/products/${id}/reject`, { method: "POST" });
  }

  getProductCategories() {
    return this.request<any>("/products/categories");
  }

  // ============================================================
  // Orders
  // ============================================================
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

  acceptOrder(vendorOrderId: string) {
    return this.request<any>(`/orders/${vendorOrderId}/accept`, { method: "POST" });
  }

  rejectOrder(vendorOrderId: string) {
    return this.request<any>(`/orders/${vendorOrderId}/reject`, { method: "POST" });
  }

  // ============================================================
  // Shipments
  // ============================================================
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

  voidShipment(id: string) {
    return this.request<any>(`/shipments/${id}/void`, { method: "PUT" });
  }

  // ============================================================
  // Returns
  // ============================================================
  getReturns(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/returns${qs}`);
  }

  getReturnStats() {
    return this.request<any>("/returns/stats");
  }

  getReturn(id: string) {
    return this.request<any>(`/returns/${id}`);
  }

  updateReturnStatus(id: string, status: string) {
    return this.request<any>(`/returns/${id}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // ============================================================
  // Finance
  // ============================================================
  getPayouts(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/finance/payouts${qs}`);
  }

  getPayoutStats() {
    return this.request<any>("/finance/payouts/stats");
  }

  getSettlements(params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/finance/settlements${qs}`);
  }

  getSettlementStats() {
    return this.request<any>("/finance/settlements/stats");
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

  // ============================================================
  // Messages
  // ============================================================
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

  createThread(data: { vendorId: string; subject: string; department: string; content: string; senderId: string }) {
    return this.request<any>("/messages/threads", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  sendMessage(threadId: string, data: { senderId: string; content: string; isInternal?: boolean }) {
    return this.request<any>(`/messages/threads/${threadId}/messages`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  assignThread(threadId: string, assignedToId: string) {
    return this.request<any>(`/messages/threads/${threadId}/assign`, {
      method: "PUT",
      body: JSON.stringify({ assignedToId }),
    });
  }

  updateThreadStatus(threadId: string, status: string) {
    return this.request<any>(`/messages/threads/${threadId}/status`, {
      method: "PUT",
      body: JSON.stringify({ status }),
    });
  }

  // ============================================================
  // Analytics
  // ============================================================
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

  // ============================================================
  // Queue Management
  // ============================================================
  getQueueStats() {
    return this.request<any>("/queues/stats");
  }

  getQueueJobs(name: string, params?: Record<string, string>) {
    const qs = params ? "?" + new URLSearchParams(params).toString() : "";
    return this.request<any>(`/queues/${name}/jobs${qs}`);
  }
}

export const api = new ApiClient();
