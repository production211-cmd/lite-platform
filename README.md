# LITE Marketplace Platform

**Lord & Taylor Multi-Vendor Marketplace Management System**

A full-stack enterprise marketplace platform for managing vendors, products, orders, shipping, finance, and communications across Lord & Taylor's multi-vendor ecosystem.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify + Node.js + TypeScript |
| Database/ORM | Prisma + PostgreSQL |
| Frontend | React 19 + Vite + Tailwind CSS |
| Auth | JWT with role-based access (RETAILER_LT / VENDOR_USER) |

## Features

### Retailer Portal
- **Dashboard** — KPI overview, action required alerts, recent orders, top vendors
- **Vendors** — Grid/list view, vendor profiles, performance metrics, onboarding
- **Products/Catalog** — Product grid, enrichment scores, approval workflow, compliance
- **Orders** — 8-stage pipeline, sub-order routing, fraud hold, analytics
- **Shipping** — FedEx/DHL/UPS integration, 2-leg B2B tracking, label management
- **Messages Hub** — 3-column layout, department routing, SLA tracking, templates
- **Finance** — P&L, payouts, deductions, multi-currency vendor balances
- **Returns** — Initiation, inspection, refund processing
- **Ads & Marketing** — Sponsored placements, event pricing, vendor offers
- **Settings** — Platform configuration

### Vendor Portal
- Scoped view of own orders, products, shipping, finance, and messages

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- pnpm

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma migrate dev

# Seed the database
pnpm prisma db seed

# Start development
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env` and configure:

```
DATABASE_URL=postgresql://user:pass@localhost:5432/lite_platform
JWT_SECRET=your-secret-key
PORT=3001
```

## Project Structure

```
├── client/           # React frontend
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts (Auth)
│   │   ├── lib/          # Utilities, API client
│   │   └── App.tsx       # Routes & layout
├── server/           # Fastify backend
│   ├── routes/           # API route modules
│   └── index.ts          # Server entry point
├── shared/           # Shared types & constants
├── prisma/           # Database schema & seeds
└── package.json
```

## API Routes

| Prefix | Description |
|--------|-------------|
| `/api/auth` | Authentication (login, register, me) |
| `/api/vendors` | Vendor CRUD + performance |
| `/api/products` | Product catalog management |
| `/api/orders` | Order pipeline management |
| `/api/shipments` | Shipping & tracking |
| `/api/returns` | Returns processing |
| `/api/finance` | P&L, payouts, balances |
| `/api/messages` | Message threads & communication |
| `/api/dashboard` | Aggregated KPIs |
| `/api/analytics` | Reporting & analytics |

## License

Proprietary — Lord & Taylor / LITE Marketplace
