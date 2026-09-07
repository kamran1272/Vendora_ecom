# Vendora

Vendora is a multi-vendor ecommerce monorepo with a customer storefront, seller workspace, admin console, NestJS API, Prisma database, and shared TypeScript contracts.

## Applications

```text
apps/web          Customer storefront
apps/seller-panel Seller workspace
apps/admin-panel  Admin console
apps/api          NestJS API and Prisma schema
packages/shared   Shared contracts and utilities
```

The frontend applications use React, TypeScript, Vite, Tailwind CSS, and React Router. The API uses NestJS, Passport JWT, Helmet, throttling, class-validator, and Prisma. SQLite is used for local development; PostgreSQL is supported for production configuration.

## Requirements

- Node.js 18 or newer
- npm 9 or newer
- PostgreSQL for a production deployment

## Install and configure

```bash
npm install
```

Create `apps/api/.env` for local development:

```env
NODE_ENV=development
PORT=4003
DB_TYPE=sqlite
DATABASE_URL="file:./data/dev.sqlite"
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
THROTTLE_TTL=60
THROTTLE_LIMIT=120
```

Initialize Prisma and the development database:

```bash
cd apps/api
npx prisma validate --schema prisma/schema.prisma
npx prisma generate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npm run seed:run
```

The local database is `apps/api/data/dev.sqlite`. Set `ADMIN_INITIAL_PASSWORD` before seeding if the seed requires an initial administrator password. Never reuse development credentials in production.

## Run locally

From the repository root:

```bash
npm run dev
```

Or start one application:

```bash
npm run dev:web
npm run dev:api
npm run dev:seller
npm run dev:admin
```

| Service | URL |
| --- | --- |
| Storefront | http://localhost:5173 |
| Seller panel | http://localhost:4175 |
| Admin panel | http://localhost:4176 |
| API | http://127.0.0.1:4003/api |
| Health check | http://127.0.0.1:4003/api/health |

## Core domain model

The seller catalog relationship is intentionally preserved as:

```text
Seller
	-> Shop (one shop per seller)
		-> SellerProduct (seller listing)
			-> WarehouseProduct (catalog source)
```

Seller products are added from the warehouse storehouse. The API resolves the authenticated seller's shop, removes any previous assignment for the same seller and warehouse product, and recreates the assignment with that shop ID inside a transaction. This keeps duplicate assignments from accumulating while retaining the existing seller/shop ownership boundary.

## Main API areas

- Authentication and seller onboarding
- Shop and seller profile management
- Warehouse catalog browsing and imports
- Seller product assignments, pricing, status, and bulk actions
- Customer catalog, cart, checkout, orders, payments, reviews, and coupons
- Admin seller approval, catalog management, reports, notifications, CMS, and settings
- Product queries, support conversations, messages, and operational reporting

Authenticated routes require the appropriate JWT role. Seller resources are scoped from the authenticated identity rather than caller-supplied seller IDs.

## Database workflow

The Prisma source of truth is `apps/api/prisma/schema.prisma`. Migrations live in `apps/api/prisma/migrations`.

```bash
cd apps/api
npx prisma validate --schema prisma/schema.prisma
npx prisma migrate deploy --schema prisma/schema.prisma
npm run seed:run
```

Important persisted relationships include users and sellers, sellers and shops, warehouse products and seller products, orders and order items, payments, commissions, wallets, reviews, notifications, conversations, support tickets, and subscription plans.

## Quality checks

```bash
npm run build
npm run lint
cd apps/api
npx tsc --noEmit -p tsconfig.json
```

Build scripts generate Prisma clients and deploy migrations as part of the API build. Keep generated output, local databases, credentials, and logs out of commits.

## Repository hygiene

- Keep application code inside the existing workspace boundaries.
- Prefer incremental module-level changes and typed service contracts.
- Do not commit `.env` files, database journals, build output, dependency folders, or runtime logs.
- Treat Prisma schema and migrations as the database source of truth.
- Preserve the Seller -> Shop -> SellerProduct -> WarehouseProduct relationship when changing catalog flows.
