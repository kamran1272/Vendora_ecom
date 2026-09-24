# Customer storefront audit

## Scope reviewed
- apps/web
- route registration in apps/web/src/App.tsx
- storefront UI and layout in apps/web/src/components and apps/web/src/pages
- customer auth and cart stores in apps/web/src/store
- customer API helpers in apps/web/src/services
- marketplace product services and supporting data models

## Architecture overview
The customer app is the public storefront for discovery, cart, checkout, orders, account management, and support. It is structured as a Vite + React + TypeScript app with route-based pages and a centralized Zustand auth store.

Main customer responsibilities:
- public browsing: home, category, brand, shop, search
- product discovery: listing, detail, related products, reviews, questions
- cart and checkout: add/remove/update items and place orders
- account: profile, addresses, orders, wishlist, notifications, reviews
- support: customer conversations and messaging

The route structure is broad and feature-complete, but a large portion of the route file still mixes product, static page, and account route definitions together in a single App.tsx file. This is workable, but it makes the app harder to maintain and harder to reason about as it grows.

## Key findings

### 1. Route structure is broad but intentionally feature-rich
The web app exposes many routes for customer flows, including:
- browsing pages
- auth and account pages
- cart and checkout
- protected account and support routes
- seller registration redirect
- direct seller/admin route access points

This is an advantage because the project does already cover the main user journeys. The downside is that route logic is still collected into a large page-level container rather than being split by feature area.

### 2. Auth is centralized but still has older compatibility patterns
The web auth store in apps/web/src/store/auth.ts is a good step toward a single source of truth. It stores the token and user in Zustand state and persists them to localStorage under a canonical key pair.

However, there are still compatibility reads against older storage keys such as accessToken and access_token in multiple places across the app. The project is moving in the right direction, but the hardening work is incomplete because the browser still holds multiple auth entry points.

This is a security concern: the browser must never be treated as the authority for auth or role enforcement.

### 3. Frontend authorization is still too strong in the UI layer
Protected routes in apps/web/src/App.tsx check for token presence and role information. This is useful for UX gating but not sufficient for authorization. The real enforcement must always happen in the backend API via JWT validation and role guards.

Recommendation:
- keep frontend gating as a user-experience guard only
- keep all authorization decisions on the server
- do not decode JWTs in the client and treat that as trust

### 4. Cart state is managed in Zustand and service calls are server-backed
The cart store in apps/web/src/store/cart.ts uses Zustand with persistence and calls the API for user-based cart mutation. This is a good pattern because it keeps a real cart model and allows server-side totals to remain authoritative.

Important concern:
- cart totals and checkout calculations should rely on server-side pricing, shipping, and tax logic
- the browser should not be the source of final financial truth

### 5. Marketplace product fetching is mostly real API-backed
The product catalog is fetched from the backend via apps/web/src/services/marketplace.ts and apps/web/src/services/api.ts. This is consistent with the domain model and better than hard-coded catalog data.

The system is already making an effort to normalize API responses, dedupe products, and keep product card data consistent. This is the correct direction.

### 6. Search, filter, and sort flows are present and functional
The search page in apps/web/src/pages/SearchPage.tsx is feature-rich and includes:
- keyword search
- category, brand, seller, attribute filters
- price filters and rating filters
- sort options
- fallback recommendations when no results are found

This is good marketplace behavior. The main issue is that the component is large and carries a lot of logic in one page file, which can make maintenance harder over time.

### 7. Product detail and purchase flow is present but needs stricter correctness
The product detail page and ProductInfoPanel component include:
- variant selection
- quantity controls
- add-to-cart and buy-now flow
- review display

This area is more conversion-centric and should stay under active review. The main correctness risks are:
- price validation
- stock validation
- variant-aware total calculations
- server-driven checkout totals
- consistent review metadata propagation

### 8. API error handling is intentionally minimal at the client layer
The web API helper simply throws an Error with a message from the backend when a response is unsuccessful. This is lightweight, but it does not yet provide a full standardized client error contract across the storefront.

Recommendation:
- standardize API error handling across customer flows
- surface friendly user-facing messages with structured response handling

### 9. The storefront is still mixing business logic with layout code
Large route-level files and heavily populated page components still do a lot of work. This is a common pattern in a multi-feature app, but it reduces clarity when the project grows.

Recommendation:
- split feature logic into dedicated route modules
- keep UI layouts reusable and limited to structure
- keep business logic in dedicated hooks/services

## Strengths
- Clear customer journey coverage
- Real storefront structure with protected account flows
- Cart and order flows exist and are connected to backend services
- Search and catalog logic already exist
- Product detail and support areas are present

## Risks to fix in later phases
- duplicate token persistence in localStorage
- unclear separation between UX gating and server-side auth
- large page files with mixed responsibilities
- inconsistent client-side error and loading handling across some flows
- reliance on browser state for any final pricing or authorization decisions

## Assessment
The customer storefront is structurally sound and already has real marketplace capability. The main remaining work is not a rewrite; it is tightening correctness, keeping server-side authorization authoritative, and reducing duplication across the customer flow layer.
