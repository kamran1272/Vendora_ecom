# Vendora E-commerce Monorepo

Vendora is a multi-vendor marketplace platform with a customer storefront, seller dashboard, admin console, and NestJS API. The project is organized as a monorepo and keeps the same workspace root while using separate app packages.

## Project structure

- apps/web — customer storefront
- apps/seller-panel — seller dashboard
- apps/admin-panel — admin dashboard
- apps/api — NestJS backend API
- packages/shared — shared platform types and utilities

## Core features

- Customer product browsing, cart, checkout flow, orders, and account pages
- Seller registration and shop onboarding
- Seller dashboard with earnings, withdrawals, orders, and products
- Admin control for sellers, products, payouts, and platform reporting
- JWT-based authentication and role-aware route protection
- Local SQLite development mode and PostgreSQL-ready production configuration

## Technology stack

- Frontend: React, TypeScript, Vite, Tailwind CSS, React Router
- Backend: NestJS, TypeScript, JWT, Passport, Helmet, Throttler
- Database: SQLite for local development; PostgreSQL-ready setup for production
- Shared package: TypeScript contracts and common marketplace types

## Prerequisites

- Node.js 18+
- npm 9+

## Install dependencies

```bash
cd "E:\Projects 2026\Vendora_ecommerce"
npm install
```

## Local environment setup

Create the API environment file if it does not exist:

```env
# apps/api/.env
NODE_ENV=development
PORT=4003
DB_TYPE=sqlite
DATABASE_URL="file:./data/dev.sqlite"
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
THROTTLE_TTL=60
THROTTLE_LIMIT=120
```

For convenience, the workspace root also includes a local environment file used during startup:

```env
# .env
NODE_ENV=development
PORT=4003
DATABASE_URL="file:./apps/api/data/dev.sqlite"
DB_TYPE=sqlite
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
REDIS_URL=redis://localhost:6379
```

## Start apps

### Start everything together

```bash
npm run dev
```

### Start individual apps

```bash
npm run dev:web
npm run dev:api
npm run dev:seller
npm run dev:admin
```

## Local URLs

- Web storefront: http://localhost:5173
- Seller panel: http://localhost:4175
- Admin panel: http://localhost:4176
- API: http://127.0.0.1:4003/api
- Health check: http://127.0.0.1:4003/api/health

## Build commands

```bash
npm run build --workspace @vendora/api
npm run build --workspace @vendora/web
```

## Notes

- The current local configuration uses SQLite so the app can run without an external PostgreSQL instance.
- PostgreSQL is still supported in the project configuration when you are ready to switch to a production database.
- Prisma is generated automatically during build/start for the API workspace.
