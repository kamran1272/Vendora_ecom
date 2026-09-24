# API Audit

## Current state
The API is structured around NestJS modules and Prisma. This is a strong base for a marketplace product. The repository README already calls out the core domain pattern of Seller -> Shop -> SellerProduct -> WarehouseProduct, which should remain intact.

## Critical items to preserve
- Seller ownership boundaries must be enforced server-side
- Role-based access must come from JWT verification and backend guards
- Product catalog and pricing logic must remain on the backend
- Financial operations must be transactional and auditable
- Seller and admin functionality should be scoped to the authenticated identity

## Issues to fix next
- Ensure frontend API requests and authentication state use a single token source
- Ensure protected routes never rely on client-side JWT decoding as an auth authority
- Validate that checkout totals and payment states are server-driven
- Verify seller-scoped order and product endpoints enforce ownership on each request
- Review DTO validation and error payload consistency
- Check payment/refund/withdrawal flows for idempotency and state transitions

## Recommended next implementation order
1. Harden auth and RBAC
2. Strengthen seller ownership checks
3. Authoritative checkout and financial flow
4. Review moderation and admin operations
5. Standardize API error payloads and validation
