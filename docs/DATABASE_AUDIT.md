# Database Audit

## Source of truth
The Prisma schema in apps/api/prisma/schema.prisma is the main source of truth for the marketplace model.

## Core relationships to preserve
- User -> Seller
- Seller -> Shop
- Shop -> SellerProduct
- SellerProduct -> WarehouseProduct
- User -> Order
- Order -> OrderItem and Payment
- Seller -> Commission and Withdrawal
- User -> Review and ReviewReply
- Seller -> SupportTicket and Conversation

## Important follow-ups
- Review the status enums and ensure they are consistently modeled and validated
- Ensure financial fields use safe precision and are calculated on the server
- Recheck indexes and query patterns for large order, review, and notification tables
- Verify soft-delete and status handling on user, product, and seller records
- Keep migration files intact and avoid destructive schema changes without a plan

## Production direction
- Prefer transactional financial changes
- Prevent duplicate seller assignments to the same warehouse product
- Keep pricing and commission calculations server-side
- Enforce ownership with DB relationships plus backend authorization
