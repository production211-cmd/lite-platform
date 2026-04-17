# LITE Platform — Gap Analysis: Current Repo vs GOD File Requirements

## What Exists (Current State)

### Backend (Fastify + Prisma + PostgreSQL)
- Basic Prisma schema with ~20 models
- 10 API route files (auth, dashboard, vendors, products, orders, shipments, returns, finance, messages, analytics)
- JWT auth with RETAILER_LT / VENDOR_USER roles
- Seed data: 12 vendors, 264 products, 150 orders, 25 returns, 30 message threads

### Frontend (React + Vite + Tailwind)
- Login page
- Dashboard (KPI cards, Action Required pipeline, Top Brands, Recent Orders)
- Vendors page (card grid, search, filters)
- Products page (grid, categories)
- Orders page (table, pipeline, pagination)
- Shipping page (basic table)
- Messages page (3-column layout)
- Finance page (basic overview)
- Returns page (basic table)
- Placeholder pages (Ads, Marketing, Settings)

### Design System
- Cinzel + Nunito Sans fonts (matching litemarketplace.com)
- Dark sidebar (#232323), collapsible
- Basic KPI cards and status badges

---

## What's Missing (GOD File Phase 1 — MVP Critical Foundation)

### 1. SECURITY HARDENING (Blocking — Phases 1-3 of Security Plan)
- [ ] Secret rotation / Secret Manager integration
- [ ] Authentication middleware enforcement on ALL routes
- [ ] RBAC hardening — vendor users MUST only see their own data
- [ ] Input sanitization / XSS prevention
- [ ] CORS policy tightening
- [ ] API rate limiting

### 2. VENDOR ONBOARDING FLOW
- [ ] 6-step onboarding wizard (Connect → Configure → Catalog Sync → Push Items → Review → Publish)
- [ ] Shopify OAuth integration (LITE Vendor Connect app)
- [ ] VendorConnectorConfig table and management
- [ ] Currency selection (locked at onboarding)
- [ ] Shipping model selection (DTC-A/B, B2B-A/B)

### 3. CATALOG MANAGEMENT WITH PUSH RULES
- [ ] Product detail view with all 4 price fields (MSRP, Sales Price, Retailer Cost, Vendor Cost)
- [ ] Multi-currency conversion with exchange rate logging
- [ ] Price audit trail (product_price_history, order_price_snapshot, api_sync_log)
- [ ] Pending approvals workflow
- [ ] Push rules engine
- [ ] Deduplication panel
- [ ] Bulk operations

### 4. ORDER ROUTING WITH VENDOR SPLITTING
- [ ] Shopify webhook processing (orders/create → split by vendor → sub-orders)
- [ ] 8-stage order pipeline (Placed → Fraud Hold → Pending Accept → Vendor Accepted → Shipped → In Transit → Delivered → Settled)
- [ ] Vendor acceptance workflow with SLA timers
- [ ] Order detail view with sub-orders
- [ ] Cancellation handling

### 5. SHIPPING (DTC-A and DTC-B with FedEx)
- [ ] FedEx API integration (label generation, ETD upload, tracking)
- [ ] Label management (generate, void, regenerate)
- [ ] Packing slip auto-generation
- [ ] Split shipment support
- [ ] Shipping cost tracking
- [ ] DTC-A (vendor carrier) tracking sync
- [ ] DTC-B (retailer carrier) label generation

### 6. RETURNS PROCESSING
- [ ] Return initiation and approval workflow
- [ ] RTS (Return to Sender) handling
- [ ] Return shipping label generation
- [ ] Refund processing
- [ ] Claims hub

### 7. VENDOR PORTAL (Separate View)
- [ ] Vendor dashboard (scoped to their data)
- [ ] Vendor order management
- [ ] Vendor catalog management
- [ ] Vendor shipping portal (label generation)
- [ ] Vendor finance view
- [ ] Vendor messages
- [ ] Vendor settings

### 8. MESSAGING SYSTEM
- [ ] Real-time messaging between retailer and vendors
- [ ] SLA tracking on response times
- [ ] Team assignment
- [ ] Template responses
- [ ] Message analytics

### 9. FINANCE / ACCOUNTING
- [ ] Accounts payable management
- [ ] Payment schedule generation
- [ ] Multi-currency payout calculation
- [ ] Commission tracking
- [ ] Deduction management
- [ ] P&L by vendor/category/period
- [ ] Duty drawback tracking

---

## Priority Assessment — Next Logical Step

The GOD file's Phase 1 MVP priorities are:
1. Security hardening (phases 1-3) — BLOCKING
2. Vendor onboarding
3. Catalog management with push rules
4. Order routing with vendor splitting
5. Basic shipping (DTC-A/B with FedEx)
6. Returns processing

**RECOMMENDATION: The very next logical step is SECURITY HARDENING.**

Why? The GOD file explicitly states "Phases 1-3 are blocking issues before new external-facing features ship." Without proper auth middleware, RBAC, and input sanitization, building more features on an insecure foundation is risky.

Specifically:
1. Enforce auth middleware on ALL API routes (currently routes may be unprotected)
2. Implement proper RBAC — vendor users must be scoped to their own data only
3. Add input validation/sanitization on all endpoints
4. Implement CORS policy
5. Add rate limiting

This sets the foundation for everything else.
