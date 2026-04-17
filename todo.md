# LITE Platform — Build Tracker

## Completed
- [x] Security Hardening (Phase 1): Auth hooks, RBAC, Helmet, Rate-limit, Zod, Refresh tokens
- [x] Domain Model Rework (Phase 2): MarketplaceOrder, VendorOrder, Settlement, IdempotencyKey, typed logs
- [x] Async Workflows (Phase 3): BullMQ queues, state machines, 6 workers
- [x] Role-Based UI (Phase 4): AdminShell, VendorShell, VendorPortalShell, RouteGuard

## Current Cycle: Frontend Pages — Functional Wiring

### API Client + Hooks
- [ ] Add missing API methods (settlements, queue stats, accept/reject order, void shipment)
- [ ] Add auto-refresh token on 401 response
- [ ] Create useApi hook for cleaner data fetching with loading/error states

### Core Admin Pages (fix existing + enhance)
- [ ] Dashboard — fix `_count.subOrders` → `_count.vendorOrders` in top vendors table
- [ ] Orders — fix `order.subOrders` → `order.vendorOrders` in table rendering
- [ ] Products — already functional, minor polish only
- [ ] Vendors — fix `_count.subOrders` → `_count.vendorOrders`, add vendor detail page

### Admin Secondary Pages (replace placeholders)
- [ ] Shipping — fix `s.subOrder` → `s.vendorOrder` references
- [ ] Returns — verify vendorOrder references
- [ ] Finance — already functional, add settlements tab
- [ ] Messages — already functional
- [ ] PendingOrders — replace placeholder with real pending acceptance page
- [ ] OrderAnalytics — replace placeholder with real analytics charts
- [ ] Payouts — replace placeholder with real payouts list
- [ ] Deductions — replace placeholder with real deductions list
- [ ] VendorBalances — replace placeholder with real balances table

### Vendor Pages (VendorShell + VendorPortalShell)
- [ ] VendorDashboard — vendor-scoped KPIs
- [ ] VendorOrders — vendor's own orders list
- [ ] VendorProducts — vendor's own products
- [ ] VendorShipments — vendor's shipments
- [ ] VendorFinance — vendor's payouts/settlements
- [ ] PortalOrders — portal-only order view
- [ ] PortalProducts — portal-only product view
- [ ] PortalPayouts — portal-only payout view

## Upcoming Cycles
- [ ] Shopify Integration (real connector, OAuth flow, webhook receiver)
- [ ] Carrier API Integration (FedEx/DHL/UPS label generation)
- [ ] Revolut Settlement Integration (real payouts)
- [ ] Redis Provisioning + Worker Activation
- [ ] Testing Suite (unit, integration, e2e)
- [ ] Vendor Onboarding Flow (6-step wizard)
