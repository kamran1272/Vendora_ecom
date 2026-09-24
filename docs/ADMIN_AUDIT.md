# Admin workspace audit

## Scope reviewed
- apps/admin-panel
- admin authentication context in apps/admin-panel/src/auth/AdminAuthContext.tsx
- admin routes in apps/admin-panel/src/routes/AdminRoutes.tsx
- admin service layer in apps/admin-panel/src/services/adminApi.ts
- admin pages for users, sellers, products, reports, settings, and support

## Architecture overview
The admin app is the control surface for marketplace moderation and operations. It includes a protected admin auth provider, route guards, management pages, and a broad set of admin API service calls.

This app is feature-rich and covers:
- admin login and session flow
- user management
- seller management and seller applications
- product moderation and warehouse review
- orders, payments, withdrawals, refunds, commissions
- categories, brands, packages, subscriptions, reviews
- notifications, support, reports, settings

## Key findings

### 1. Admin auth is implemented as a dedicated provider with strong routing guard patterns
The admin app wraps the app with AdminAuthProvider and uses GuestAdminRoute and ProtectedAdminRoute. This is a correct structure for a real admin console.

The admin auth logic includes:
- session restoration from storage
- role validation for admin and super-admin
- session refresh behavior
- logout flow

This is aligned with an isolated admin security boundary.

### 2. Admin API calls are broad and operationally complete
The admin service layer in apps/admin-panel/src/services/adminApi.ts contains a large set of fetch helpers for marketplace operations. This is evidence that the admin workspace is designed for real operations rather than a mock dashboard.

The service layer includes product moderation, seller management, financial review, reports, settings, and admin-only actions.

### 3. Storage duplication remains a known risk in admin auth and API flows
Admin auth and admin API utilities still read and write multiple token keys across legacy and canonical names. This was already identified as a repeated pattern across the app, and it should be treated as a current hardening issue rather than accepted as stable.

The backend remains the source of truth, but the browser should not be used as multiple conflicting auth authoritatives.

### 4. Admin route coverage is broad but some actions are still browser-driven
The admin route file contains many route definitions and table-driven actions such as approve, reject, suspend, feature, archive, and delete. These actions look operationally real, but they need to remain server-authoritative for product moderation, payments, and financial transitions.

Important rule:
- the admin UI should trigger server actions
- the backend should decide whether the action is allowed and whether the domain state transition is valid

### 5. Admin moderation pages are structured around collections and detail views
The route file uses collection pages with fetchers and detail pages, which is a clean pattern for admin records. It suggests a more structured admin management style than a one-off dashboard.

This is a strong architectural foundation. The risk is not the concept but the continued need to validate each record-level action and financial operation on the backend.

### 6. Financial operations require extra attention
The admin app includes payments, withdrawals, commissions, and reports. These are high-risk operations and should be treated as server-controlled financial workflows.

That means:
- no client-side trust in totals or payout calculation
- no UI-side override of financial state
- no browser-based assumptions about approval semantics

### 7. Admin support and reports are real operational modules
The admin app has support center and reporting modules. These are strong signs that the product is heading toward real marketplace management rather than mock admin tooling.

## Strengths
- Real admin role separation and route guards
- Broad operational coverage across moderation, finance, and settings
- Strong route and page structure for management patterns
- Admin-facing API integration is already built out

## Risks to fix in later phases
- duplicate localStorage token keys in admin auth and fetch layer
- browser-driven action assumptions in sensitive financial or moderation flows
- consistency of admin error and validation states across collection pages
- need to preserve backend-only rules for approval, rejection, payment release, and payout processing

## Assessment
The admin workspace is structurally strong and clearly modeled as a production admin console. The remaining improvement is not feature creation but hardening the admin auth and ensuring all high-sensitivity actions remain backend-authoritative and auditable.
