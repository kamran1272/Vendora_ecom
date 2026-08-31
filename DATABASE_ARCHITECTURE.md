# Vendora Database Architecture

## Overview

The Vendora e-commerce platform uses PostgreSQL as the primary database with TypeORM as the ORM (Object-Relational Mapping) layer. The database is designed to support a multi-seller marketplace with comprehensive features for users, products, orders, payments, and seller management.

## Database Structure

### 1. **User System** (`users` table)

Stores all platform users with role-based access control.

**Fields:**
- `id` (UUID, Primary Key)
- `name` (VARCHAR 255) - User full name
- `email` (VARCHAR 255, Unique) - User email address
- `password` (VARCHAR 255) - Hashed password
- `phone` (VARCHAR 20) - Phone number
- `avatar` (TEXT) - Avatar image URL
- `role` (ENUM) - USER_ROLE: `customer`, `seller`, `admin`
- `status` (ENUM) - USER_STATUS: `active`, `inactive`, `suspended`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- One-to-One with `seller_profiles` (one seller profile per user)
- One-to-Many with `orders` (customer can have multiple orders)
- One-to-Many with `reviews` (customer can write multiple reviews)

---

### 2. **Seller Profile System** (`seller_profiles` table)

Manages seller information with KYC (Know Your Customer) verification.

**Fields:**
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key, Unique) - Links to user
- `shop_name` (VARCHAR 255) - Official shop name
- `slug` (VARCHAR 255, Unique) - URL-friendly shop identifier
- `logo` (TEXT) - Logo image URL
- `banner` (TEXT) - Shop banner image URL
- `description` (TEXT) - Shop description
- **KYC/Verification Documents:**
  - `identification_type` (ENUM) - `cnic`, `driving_license`, `passport` ⭐ **REQUIRED**
  - `identification_number` (VARCHAR 255) - Document number
  - `identification_front` (TEXT) - Front document image URL ⭐ **REQUIRED**
  - `identification_back` (TEXT) - Back document image URL (optional for passport)
  - `phone` (VARCHAR 20) - Phone number ⭐ **REQUIRED**
  - `email` (VARCHAR 255) - Email address ⭐ **REQUIRED**
- `approval_status` (ENUM) - `pending`, `approved`, `rejected`
- `commission_rate` (FLOAT) - Commission percentage (e.g., 5 for 5%)
- `rejection_reason` (TEXT) - Reason if rejected
- `approved_at` (TIMESTAMP) - Approval timestamp
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- One-to-One with `users`
- One-to-Many with `shops`
- One-to-Many with `products`
- One-to-One with `seller_wallets`

**⭐ KYC Requirements:**
The seller registration process must enforce:
1. Valid identification document (CNIC, driving license, or passport)
2. Document front & back images (or front only for passport)
3. Email address verification
4. Phone number verification

---

### 3. **Shop System** (`shops` table)

Represents individual seller shops.

**Fields:**
- `id` (UUID, Primary Key)
- `seller_id` (UUID, Foreign Key)
- `name` (VARCHAR 255) - Shop name
- `address` (TEXT) - Physical address
- `country` (VARCHAR 100)
- `city` (VARCHAR 100)
- `state` (VARCHAR 100)
- `postal_code` (VARCHAR 20)
- `rating` (FLOAT) - Average shop rating
- `review_count` (INTEGER) - Total reviews
- `status` (ENUM) - `active`, `inactive`, `closed`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- Many-to-One with `seller_profiles`
- One-to-Many with `products`

---

### 4. **Category System** (`categories` table)

Hierarchical product categories.

**Fields:**
- `id` (UUID, Primary Key)
- `parent_id` (UUID, Foreign Key) - For hierarchical structure (nullable)
- `name` (VARCHAR 255) - Category name
- `slug` (VARCHAR 255, Unique) - URL-friendly name
- `image` (TEXT) - Category image URL
- `description` (TEXT)
- `status` (ENUM) - `active`, `inactive`
- `order` (INTEGER) - Display order
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Example Hierarchy:**
```
Fashion (parent_id: NULL)
├── Men (parent_id: Fashion.id)
├── Women (parent_id: Fashion.id)
└── Kids (parent_id: Fashion.id)
```

**Relations:**
- Self-referencing for parent-child hierarchy
- One-to-Many with `products`

---

### 5. **Brand System** (`brands` table)

Product brands/manufacturers.

**Fields:**
- `id` (UUID, Primary Key)
- `name` (VARCHAR 255)
- `slug` (VARCHAR 255, Unique)
- `logo` (TEXT)
- `description` (TEXT)
- `status` (ENUM) - `active`, `inactive`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- One-to-Many with `products`

---

### 6. **Product System**

#### **Products Table** (`products`)

**Fields:**
- `id` (UUID, Primary Key)
- `seller_id` (UUID, Foreign Key)
- `shop_id` (UUID, Foreign Key, nullable)
- `category_id` (UUID, Foreign Key)
- `brand_id` (UUID, Foreign Key, nullable)
- `name` (VARCHAR 255)
- `slug` (VARCHAR 255, Unique)
- `description` (TEXT)
- `technical_details` (TEXT)
- `price` (DECIMAL 10,2)
- `discount_price` (DECIMAL 10,2, nullable)
- `discount_percentage` (INTEGER)
- `stock` (INTEGER) - Available quantity
- `sold_count` (INTEGER) - Total sold
- `average_rating` (FLOAT)
- `review_count` (INTEGER)
- `status` (ENUM) - `active`, `inactive`, `out_of_stock`
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- Many-to-One with `seller_profiles`
- Many-to-One with `shops`
- Many-to-One with `categories`
- Many-to-One with `brands`
- One-to-Many with `product_variants`
- One-to-Many with `product_images`
- One-to-Many with `order_items`
- One-to-Many with `reviews`

#### **Product Variants Table** (`product_variants`)

Stores product variations (color, size, SKU).

**Fields:**
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key)
- `color` (VARCHAR 50, nullable)
- `size` (VARCHAR 50, nullable)
- `sku` (VARCHAR 100) - Stock Keeping Unit
- `price` (DECIMAL 10,2)
- `stock` (INTEGER)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Example:**
```
Product: Nike T-Shirt
├── Variant 1: Red, Size M, SKU: NIKE-TS-RED-M
├── Variant 2: Red, Size L, SKU: NIKE-TS-RED-L
├── Variant 3: Blue, Size M, SKU: NIKE-TS-BLUE-M
└── Variant 4: Blue, Size L, SKU: NIKE-TS-BLUE-L
```

#### **Product Images Table** (`product_images`)

**Fields:**
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key)
- `url` (TEXT) - Image URL
- `type` (ENUM) - `thumbnail`, `featured`, `gallery`
- `order` (INTEGER) - Display order
- `created_at` (TIMESTAMP)

---

### 7. **Order System**

#### **Orders Table** (`orders`)

**Fields:**
- `id` (UUID, Primary Key)
- `order_number` (VARCHAR 50, Unique) - Human-readable order number
- `customer_id` (UUID, Foreign Key)
- `seller_id` (UUID, Foreign Key)
- `subtotal` (DECIMAL 12,2) - Before tax/shipping
- `tax` (DECIMAL 12,2)
- `shipping_cost` (DECIMAL 12,2)
- `discount_amount` (DECIMAL 12,2)
- `total_amount` (DECIMAL 12,2) - Final amount
- `payment_status` (ENUM) - `pending`, `completed`, `failed`, `refunded`
- `order_status` (ENUM) - `pending`, `confirmed`, `processing`, `shipped`, `delivered`, `cancelled`, `refunded`
- `shipping_address` (TEXT)
- `billing_address` (TEXT)
- `tracking_number` (VARCHAR 50)
- `notes` (TEXT)
- `shipped_at` (TIMESTAMP)
- `delivered_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- Many-to-One with `users` (customer)
- Many-to-One with `seller_profiles`
- One-to-Many with `order_items`
- One-to-One with `payments`

#### **Order Items Table** (`order_items`)

**Fields:**
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key)
- `product_id` (UUID, Foreign Key)
- `product_name` (VARCHAR 255)
- `product_sku` (VARCHAR 100)
- `quantity` (INTEGER)
- `price` (DECIMAL 10,2) - Price at purchase time
- `subtotal` (DECIMAL 12,2) - quantity × price
- `variant_color` (VARCHAR 50)
- `variant_size` (VARCHAR 50)
- `created_at` (TIMESTAMP)

**Relations:**
- Many-to-One with `orders`
- Many-to-One with `products`

---

### 8. **Payment System** (`payments` table)

**Fields:**
- `id` (UUID, Primary Key)
- `order_id` (UUID, Foreign Key, Unique)
- `gateway` (ENUM) - `stripe`, `paypal`, `bank_transfer`, `cod` (Cash on Delivery)
- `transaction_id` (VARCHAR 255) - Gateway transaction ID
- `amount` (DECIMAL 12,2)
- `status` (ENUM) - `pending`, `authorized`, `captured`, `failed`, `refunded`
- `response_data` (TEXT) - JSON response from payment gateway
- `error_message` (TEXT)
- `paid_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- One-to-One with `orders`

---

### 9. **Seller Wallet & Earnings**

#### **Seller Wallets Table** (`seller_wallets`)

**Fields:**
- `id` (UUID, Primary Key)
- `seller_id` (UUID, Foreign Key, Unique)
- `balance` (DECIMAL 15,2) - Current available balance
- `total_earnings` (DECIMAL 15,2) - Lifetime earnings
- `total_withdrawn` (DECIMAL 15,2) - Total amount withdrawn
- `pending_balance` (DECIMAL 15,2) - Pending payout balance
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- One-to-One with `seller_profiles`
- One-to-Many with `wallet_transactions`

#### **Wallet Transactions Table** (`wallet_transactions`)

**Fields:**
- `id` (UUID, Primary Key)
- `seller_id` (UUID, Foreign Key)
- `type` (ENUM) - Transaction type:
  - `sale` (+$100) - When customer buys
  - `commission` (-$20) - Marketplace commission
  - `withdrawal` (-$50) - Seller withdrawal
  - `refund` (+amount) - Order refunded
  - `adjustment` (+/-amount) - Manual adjustment
  - `payout` (-amount) - Payment to seller
- `amount` (DECIMAL 15,2) - Transaction amount
- `status` (ENUM) - `pending`, `completed`, `failed`, `cancelled`
- `description` (TEXT) - Transaction details
- `reference_id` (VARCHAR 255) - Order/Withdrawal ID
- `reference_order_id` (UUID) - Link to order
- `balance_before` (DECIMAL 15,2)
- `balance_after` (DECIMAL 15,2)
- `processed_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)

**Example Flow:**
```
Transaction 1: Sale Order #ORD123 → +$100 → Balance: $100
Transaction 2: Commission (5%) → -$5 → Balance: $95
Transaction 3: Withdrawal Request → -$90 → Balance: $5 (Pending)
Transaction 4: Payout Completed → Balance: $0
```

**Relations:**
- Many-to-One with `seller_wallets`

---

### 10. **Reviews System** (`reviews` table)

**Fields:**
- `id` (UUID, Primary Key)
- `product_id` (UUID, Foreign Key)
- `customer_id` (UUID, Foreign Key)
- `rating` (INTEGER) - 1-5 stars
- `title` (VARCHAR 255)
- `comment` (TEXT)
- `status` (ENUM) - `pending`, `approved`, `rejected` (moderation)
- `helpful_count` (INTEGER) - Helpful votes
- `verified_purchase` (BOOLEAN)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

**Relations:**
- Many-to-One with `products`
- Many-to-One with `users`

---

### 11. **Coupon System** (`coupons` table)

**Fields:**
- `id` (UUID, Primary Key)
- `code` (VARCHAR 50, Unique)
- `description` (TEXT)
- `discount_type` (ENUM) - `percentage`, `fixed`
- `discount_value` (DECIMAL 10,2)
- `maximum_discount` (DECIMAL 10,2) - For percentage discounts
- `minimum_purchase` (DECIMAL 10,2) - Minimum order amount
- `usage_limit` (INTEGER) - Total coupon usage limit
- `usage_count` (INTEGER) - Current usage count
- `usage_limit_per_customer` (INTEGER) - Limit per customer
- `status` (ENUM) - `active`, `inactive`, `expired`
- `start_date` (DATE)
- `end_date` (DATE)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

---

## Setup Instructions

### 1. **Install Dependencies**

```bash
cd apps/api
npm install
```

This will install:
- `@nestjs/typeorm` - NestJS TypeORM integration
- `typeorm` - ORM framework
- `pg` - PostgreSQL driver

### 2. **Create PostgreSQL Database**

```bash
# Create database
createdb vendora

# Or using psql
psql -U postgres -c "CREATE DATABASE vendora;"
```

### 3. **Configure Environment**

Update `.env` file in `apps/api/`:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=vendora
```

### 4. **Run Migrations**

```bash
npm run migration:run
```

Or with TypeORM CLI:

```bash
typeorm migration:run -d src/database/config/database.config.ts
```

### 5. **Seed Database (Optional)**

```bash
npm run seed:run
```

---

## Database Relationships Diagram

```
users (1) ←--→ (1) seller_profiles
  ├─ (1) ←--→ (many) orders
  └─ (1) ←--→ (many) reviews

seller_profiles (1) ←--→ (many) shops
seller_profiles (1) ←--→ (many) products
seller_profiles (1) ←--→ (1) seller_wallets

shops (1) ←--→ (many) products

categories (1) ←--→ (many) products
            └─ (many) categories (self-join)

brands (1) ←--→ (many) products

products (1) ←--→ (many) product_variants
         (1) ←--→ (many) product_images
         (1) ←--→ (many) order_items
         (1) ←--→ (many) reviews

orders (1) ←--→ (many) order_items
       (1) ←--→ (1) payments
       
seller_wallets (1) ←--→ (many) wallet_transactions
```

---

## Key Features

✅ **Role-based Access Control** - Customer, Seller, Admin roles  
✅ **Multi-seller Support** - Multiple sellers with individual shops  
✅ **KYC Verification** - CNIC, Driving License, or Passport required  
✅ **Product Variants** - Support for color, size, SKU variations  
✅ **Hierarchical Categories** - Nested category structure  
✅ **Order Management** - Complete order lifecycle tracking  
✅ **Payment Integration** - Multiple payment gateways support  
✅ **Seller Earnings** - Commission tracking and wallet system  
✅ **Review System** - Customer reviews with moderation  
✅ **Coupon Management** - Flexible discount system  

---

## TypeScript Entity Imports

All entities are exported from `src/database/entities/index.ts`:

```typescript
import {
  User,
  SellerProfile,
  Shop,
  Category,
  Brand,
  Product,
  ProductVariant,
  ProductImage,
  Order,
  OrderItem,
  Payment,
  SellerWallet,
  WalletTransaction,
  Review,
  Coupon,
} from './database/entities';
```

---

## Performance Optimization

### Indexes Created:
- `idx_user_email` - Email lookups
- `idx_seller_user_id` - Seller profile lookups
- `idx_product_seller_id` - Seller products
- `idx_product_category_id` - Category products
- `idx_product_slug` - Product URL lookups
- `idx_order_customer_id` - Customer orders
- `idx_order_seller_id` - Seller orders
- `idx_order_status` - Order filtering
- `idx_order_payment_status` - Payment status queries
- `idx_wallet_seller_id` - Wallet lookups
- `idx_wallet_transaction_seller_id` - Transaction lookups
- `idx_review_product_id` - Product reviews
- `idx_coupon_code` - Coupon lookup

---

## Next Steps

1. ✅ Database entities created
2. ✅ Migrations ready
3. 🔄 Implement repositories in each module
4. 🔄 Create DTOs for request/response validation
5. 🔄 Implement business logic in services
6. 🔄 Create API endpoints in controllers
