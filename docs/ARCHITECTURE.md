# Vendora Architecture Audit

## Overview
Vendora is a monorepo marketplace with four primary runtime domains:
- Customer storefront in apps/web
- Seller workspace in apps/seller-panel
- Admin console in apps/admin-panel
- API and database in apps/api

The repository already contains a real marketplace domain model centered on customers, sellers, shops, product catalogs and orders. The main work is to tighten architecture and align the UI with the backend rules rather than redesigning the business model.

## Current strengths
- Clear separation between customer, seller, admin, and API apps
- Structured Prisma schema with enterprise-style marketplace entities
- Existing JWT-based auth and NestJS backend patterns
- Shared package for reusable utilities
- Separate customer and seller/admin surfaces

## Main risk areas
1. Frontend auth state is split between Zustand and localStorage
2. Role checks in customer frontend are acting like authorization gates
3. Product review metadata is treated as a default zero rather than real API data
4. Large page-level files are carrying too much routing and business logic
5. The customer storefront still mixes merchandising, marketing, and data presentation without a structured editorial model

## Recommended domain boundaries
- Customer domain: discovery, cart, checkout, orders, account, support
- Seller domain: shop management, catalog, orders, wallet, reviews, analytics
- Admin domain: user management, seller onboarding, moderation, reports, settings
- API domain: auth, authorization, pricing, financial calculations, persistence

## Architectural direction
- Keep Prisma as the source of truth
- Keep backend as the sole authority for prices, totals, permissions, and financial transitions
- Keep UI state focused on user experience and server state synchronization
- Use React Query for server data and Zustand only for local UI/session state
- Split route-level logic into feature-oriented modules instead of monolithic file containers
