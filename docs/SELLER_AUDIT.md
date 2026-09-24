# Seller workspace audit

## Scope reviewed
- apps/seller-panel
- route definitions in apps/seller-panel/src/routes/SellerRoutes.tsx
- seller auth flow in apps/seller-panel/src/services/api.ts
- dashboard and sidebar data usage
- seller pages for products, orders, reviews, support, notifications, shop settings, withdrawals, commissions, and uploads

## Architecture overview
The seller app is the operational workspace for sellers to manage their shop, catalog, orders, pricing, reviews, support, account, and payouts. It uses React + Vite + TypeScript with React Router and TanStack Query.

This app is closer to a real seller dashboard than a marketing UI. It has many operational views and expects seller-specific APIs and role checks.

## Key findings

### 1. Seller route protection is present and route coverage is broad
Seller routes are protected by SellerProtectedRoute in apps/seller-panel/src/routes/SellerRoutes.tsx. This is a good pattern because the seller area restricts access to signed-in sellers.

The route map includes:
- dashboard
- products and product warehouse
- orders and order details
- reviews
- packages and subscription activity
- affiliate and withdrawal flows
- notifications and conversations
- shop settings and transaction password
- product queries and support tickets

This shows a mature operational workspace rather than a placeholder.

### 2. Seller auth has improved but still retains compatibility keys
The seller auth API service in apps/seller-panel/src/services/api.ts centralizes the token retrieval and refresh pattern, but it still deliberately reads multiple storage keys for compatibility. This is a purposeful migration pattern, not a full rewrite.

This is acceptable as an interim compatibility layer, as long as the app does not rely on multiple keys as independent auth sources. The canonical session source should remain consistent and the browser should not be trusted as the final authority.

### 3. React Query is used where it matters
The seller app uses TanStack Query for dashboard state and related data. This is a strong choice for operational dashboards and reduces ad hoc manual fetch wiring.

The dashboard and sidebar actively use query state for seller metrics and overview data. This is aligned with good ecosystem practice.

### 4. Seller ownership boundaries are a critical issue to preserve
The seller app is explicitly scoped to a seller identity and its shop. This is important because the schema preserves the pattern:
- Seller -> Shop -> SellerProduct -> WarehouseProduct

The backend must enforce ownership on every seller-scoped API call. The frontend provides a convenience layer, but it must never be the source of authority.

### 5. Seller product management is a core operational area
Seller product pages include product creation, editing, inventory, product storehouse, and product assignment flows. This is critical because seller products are linked to warehouse products and seller shop ownership.

This matches the domain model and should be protected carefully:
- the seller can manage seller products tied to their own shop
- the warehouse product source remains separate
- duplicates should not be created across seller/product assignments

### 6. Seller support and conversations use localStorage-derived user identity in some places
Some support and conversation flows derive the current seller user or seller id from localStorage values rather than from a canonical auth context. That pattern should be reviewed carefully because it introduces a brittle dependency on client state.

The backend should remain the source of truth for seller identity and support permissions.

### 7. Seller pages are feature-complete but access patterns need review
Seller views cover operational tasks such as:
- reviews
- support tickets
- payouts
- commissions
- uploads
- transaction security

The breadth suggests the project already has meaningful seller functionality. The main work is not adding new seller features but tightening correctness and security boundaries.

### 8. Notification and messaging flows are real operational features
The seller app has a support and conversation system, which is useful and aligns with a marketplace model. These flows often involve multiple user roles and should be protected by backend checks rather than frontend gating alone.

## Strengths
- Strong route coverage for operational seller needs
- Query-based seller dashboard patterns are in place
- Product and order workflows are real and aligned to the domain model
- Seller app is not merely a UI shell; it is a working seller workspace

## Risks to fix in later phases
- localStorage-derived seller identity in some support components
- compatibility token duplication across storage keys
- ownership enforcement must remain backend-only
- large seller page files may hide inconsistent UI state handling

## Assessment
The seller workspace is structurally strong and already represents a legitimate operational dashboard. The next focus should be hardening seller identity and ownership boundaries, then tightening UI reliability and consistency in the seller workflows.
