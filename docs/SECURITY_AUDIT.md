# Security Audit

## Immediate risks
- Client-side auth state is duplicated across multiple storage keys
- Role information can be decoded in the frontend and mistaken for authorization
- Checkout and pricing logic should not be trusted in the browser
- Financial operations require backend-only enforcement

## Security principles to keep
- Treat frontend as a presentation layer only
- Use backend guards, DTO validation, and role checks for every protected route
- Use transactions for financial transitions
- Keep secrets in environment files, never in source-controlled files
- Preserve JWT expiration and refresh controls
- Validate uploads and seller documents before storage
- Enforce seller ownership and admin permissions on every sensitive endpoint

## Priority checks
- localStorage and auth duplication
- seller and admin route enforcement
- product and order ownership checks
- payment verification and refund rules
- review moderation and report handling
- document upload validation
- rate limiting and abuse prevention
