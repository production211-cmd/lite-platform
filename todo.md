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

## UI Polish & Design Refinement (Current)

### Global Design System (index.css)
- [ ] Add global CSS transitions for all interactive elements
- [ ] Add smooth scroll behavior
- [ ] Add fade-in keyframe animation for page content
- [ ] Add slide-up animation for cards and list items
- [ ] Improve form input focus states
- [ ] Add hover scale micro-interaction for clickable cards

### Sidebar
- [ ] Add smooth hover transitions on nav items
- [ ] Add active indicator animation
- [ ] Add subtle glow on active nav item

### Dashboard
- [ ] Add staggered fade-in for stat cards
- [ ] Add hover lift on Action Required cards
- [ ] Improve table row hover states
- [ ] Add subtle card shadows

### Products Page
- [ ] Add table row hover effect
- [ ] Improve View button hover state
- [ ] Add smooth filter tab transitions

### Activity Log
- [ ] Add staggered entry animation
- [ ] Improve filter chip active/hover states
- [ ] Add hover effect on log entries

### Settings
- [ ] Add smooth section transition
- [ ] Improve form input styling
- [ ] Improve left nav active state indicator

### Vendor Onboarding
- [ ] Improve stepper visual design
- [ ] Add step transition animation
- [ ] Improve progress bar with gradient

### Detail Pages
- [ ] Add page content fade-in
- [ ] Add timeline entry stagger animation
- [ ] Improve action button hover states

### Queue Monitor
- [ ] Add queue card hover effects
- [ ] Improve confirm dialog animation
