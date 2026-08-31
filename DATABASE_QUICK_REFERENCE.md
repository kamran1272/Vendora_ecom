# Database Quick Reference Guide

## 📊 Entity Overview

### User Management
```
users (15 fields)
├── id, name, email, password, phone, avatar
├── role: enum[customer, seller, admin]
├── status: enum[active, inactive, suspended]
└── timestamps
```

### Seller & KYC ⭐ CRITICAL
```
seller_profiles (20 fields)
├── Personal: user_id, email, phone
├── Shop: shop_name, slug, logo, banner, description
├── ⭐ KYC (REQUIRED):
│   ├── identification_type: enum[cnic, driving_license, passport]
│   ├── identification_number: string
│   ├── identification_front: URL (REQUIRED)
│   ├── identification_back: URL (REQUIRED for CNIC/DL, OPTIONAL for passport)
├── approval_status: enum[pending, approved, rejected]
├── commission_rate: float
└── rejection_reason: text
```

### Products
```
products (19 fields)
├── seller_id, shop_id, category_id, brand_id
├── name, slug, description, technical_details
├── price, discount_price, discount_percentage
├── stock, sold_count, average_rating, review_count
├── status: enum[active, inactive, out_of_stock]
└── timestamps

product_variants (8 fields)
├── product_id, color, size, sku
├── price, stock
└── timestamps

product_images (5 fields)
├── product_id, url
├── type: enum[thumbnail, featured, gallery]
└── order
```

### Orders & Payments
```
orders (17 fields)
├── order_number (unique), customer_id, seller_id
├── subtotal, tax, shipping_cost, discount_amount, total_amount
├── payment_status, order_status
├── addresses, tracking_number, notes
└── timestamps + shipped_at, delivered_at

order_items (9 fields)
├── order_id, product_id
├── product_name, product_sku, quantity
├── price, subtotal, variant_color, variant_size

payments (11 fields)
├── order_id (unique), gateway, transaction_id
├── amount, status, response_data, error_message
└── timestamps + paid_at
```

### Seller Earnings
```
seller_wallets (8 fields)
├── seller_id (unique)
├── balance, total_earnings, total_withdrawn, pending_balance
└── timestamps

wallet_transactions (13 fields)
├── seller_id, type, amount, status
├── description, reference_id, reference_order_id
├── balance_before, balance_after
└── timestamps
```

### Additional
```
categories (8 fields)
├── parent_id (self-join), name, slug
├── image, description, status, order

brands (7 fields)
├── name, slug, logo, description, status

reviews (10 fields)
├── product_id, customer_id
├── rating, title, comment, status
├── helpful_count, verified_purchase

coupons (13 fields)
├── code, description
├── discount_type, discount_value, maximum_discount
├── minimum_purchase, usage_limit, usage_count
├── usage_limit_per_customer, status, dates
```

---

## 🔑 Key Relationships

### Cascading Deletes
```
seller_profiles ─CASCADE─> products, shops, seller_wallets
products ─CASCADE─> product_variants, product_images, order_items
orders ─CASCADE─> order_items
users ─CASCADE─> seller_profiles
```

### Foreign Keys
```
users (1) ←──┐
            └──> seller_profiles (1)
            
seller_profiles (1) ─┬──> shops (many)
                     ├──> products (many)
                     └──> seller_wallets (1)

products (1) ─┬──> product_variants (many)
              ├──> product_images (many)
              └──> order_items (many)

orders (1) ───┬──> order_items (many)
              └──> payments (1)
              
seller_wallets (1) ─> wallet_transactions (many)
```

---

## ✅ Validation Rules

### User Registration
- [ ] Email: Valid email format, unique
- [ ] Password: Minimum 8 characters
- [ ] Phone: Valid international format
- [ ] Name: 3-255 characters

### Seller Registration
- [ ] Email: Verified
- [ ] Phone: Verified with SMS code
- [ ] Shop Name: 3-255 characters, unique slug
- [ ] Identification Type: One of CNIC/DL/Passport
- [ ] Identification Number: Format-specific validation
- [ ] Front Image: Required, clear document image
- [ ] Back Image: Required for CNIC/DL, optional for passport
- [ ] Terms: Must accept

### Product
- [ ] Name: Required, unique slug
- [ ] Price: > 0
- [ ] Stock: >= 0
- [ ] Category: Must exist
- [ ] Seller: Must be approved

### Order
- [ ] Customer: Must exist
- [ ] Items: At least one item
- [ ] Total: Must match calculation
- [ ] Addresses: Valid format

### Payment
- [ ] Amount: Matches order total
- [ ] Gateway: Valid gateway
- [ ] Transaction ID: Unique (if provided)

---

## 🔍 Common Queries

### Find Seller Info
```sql
SELECT u.*, sp.*, sw.balance
FROM users u
LEFT JOIN seller_profiles sp ON u.id = sp.user_id
LEFT JOIN seller_wallets sw ON sp.id = sw.seller_id
WHERE u.id = $1;
```

### Get Product with Details
```sql
SELECT 
  p.*, 
  pv.*, 
  pi.*,
  sp.shop_name,
  c.name as category_name,
  b.name as brand_name
FROM products p
LEFT JOIN product_variants pv ON p.id = pv.product_id
LEFT JOIN product_images pi ON p.id = pi.product_id
LEFT JOIN seller_profiles sp ON p.seller_id = sp.id
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN brands b ON p.brand_id = b.id
WHERE p.id = $1;
```

### Get Order with Items
```sql
SELECT o.*, oi.*, p.name, u.name as customer_name
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
LEFT JOIN products p ON oi.product_id = p.id
LEFT JOIN users u ON o.customer_id = u.id
WHERE o.id = $1;
```

### Seller Earnings Report
```sql
SELECT 
  wt.type,
  COUNT(*) as count,
  SUM(wt.amount) as total
FROM wallet_transactions wt
WHERE wt.seller_id = $1
  AND wt.status = 'completed'
GROUP BY wt.type
ORDER BY wt.created_at DESC;
```

---

## 📈 Performance Indexes

```sql
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_seller_user_id ON seller_profiles(user_id);
CREATE INDEX idx_product_seller_id ON products(seller_id);
CREATE INDEX idx_product_category_id ON products(category_id);
CREATE INDEX idx_product_slug ON products(slug);
CREATE INDEX idx_order_customer_id ON orders(customer_id);
CREATE INDEX idx_order_seller_id ON orders(seller_id);
CREATE INDEX idx_order_status ON orders(order_status);
CREATE INDEX idx_order_payment_status ON orders(payment_status);
CREATE INDEX idx_wallet_seller_id ON seller_wallets(seller_id);
CREATE INDEX idx_wallet_transaction_seller_id ON wallet_transactions(seller_id);
CREATE INDEX idx_review_product_id ON reviews(product_id);
CREATE INDEX idx_coupon_code ON coupons(code);
```

---

## 🔐 Security Considerations

1. **Passwords**: Always hash with bcrypt (10+ rounds)
2. **Emails**: Must be verified before use
3. **Phones**: Must be verified with OTP
4. **KYC Documents**: Store securely, validate format
5. **Payment Data**: Never store full card details, use tokens
6. **User Roles**: Enforce in service layer, not just frontend
7. **SQL Injection**: Use parameterized queries (TypeORM handles this)
8. **Sensitive Data**: Never log passwords, API keys, tokens
9. **File Uploads**: Validate MIME types, virus scan
10. **Timestamps**: Use UTC for all database timestamps

---

## 🚀 Usage in NestJS Service

### Example: Get Seller with Products
```typescript
@Injectable()
export class SellerService {
  constructor(
    @InjectRepository(SellerProfile)
    private sellerRepo: Repository<SellerProfile>,
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
  ) {}

  async getSellerWithProducts(sellerId: string) {
    const seller = await this.sellerRepo.findOne({
      where: { id: sellerId },
      relations: ['user', 'shops', 'wallet'],
    });

    const products = await this.productRepo.find({
      where: { seller_id: sellerId },
      relations: ['variants', 'images', 'category', 'brand'],
      order: { created_at: 'DESC' },
    });

    return { seller, products };
  }
}
```

### Example: Process Order Payment
```typescript
async processOrderPayment(orderId: string, paymentData: any) {
  const order = await this.orderRepo.findOne({
    where: { id: orderId },
    relations: ['items', 'items.product'],
  });

  // Create payment record
  const payment = this.paymentRepo.create({
    order_id: orderId,
    gateway: PaymentGateway.STRIPE,
    transaction_id: paymentData.id,
    amount: order.total_amount,
  });

  await this.paymentRepo.save(payment);

  // Credit seller wallet
  const seller = await this.sellerRepo.findOne({
    where: { id: order.seller_id },
    relations: ['wallet'],
  });

  const commission = order.total_amount * (seller.commission_rate / 100);
  const credit = order.total_amount - commission;

  // Add transactions
  const transaction = this.walletTransactionRepo.create({
    seller_id: seller.id,
    type: TransactionType.SALE,
    amount: credit,
    reference_order_id: orderId,
  });

  await this.walletTransactionRepo.save(transaction);
  
  // Update wallet
  seller.wallet.balance += credit;
  await this.walletRepo.save(seller.wallet);
}
```

---

## 📱 KYC Document Format Examples

### CNIC (Pakistan)
- Format: `12345-6789012-3`
- Front: Shows photo, name, ID number, DOB
- Back: Shows validity dates

### Driving License
- Format: Various (validate by length >= 5)
- Front: Shows name, DOB, categories
- Back: Shows validity dates, address

### Passport
- Format: Various (validate by length >= 6)
- Front: Shows photo, name, passport number
- Back: Optional (passport issued date page)

---

## 🔄 Transaction Flow Examples

### Customer Purchase
```
1. Customer adds to cart
2. Customer checks out
3. Order created (status: pending)
4. Payment processed
5. Wallet transaction created (sale +$100)
6. Commission deducted (-$5, 5%)
7. Seller wallet credited (+$95)
8. Order status: confirmed
9. Seller ships (status: shipped)
10. Customer receives (status: delivered)
```

### Seller Withdrawal
```
1. Seller requests withdrawal
2. Wallet transaction created (status: pending)
3. Admin reviews request
4. Payment processed to seller bank
5. Wallet transaction status: completed
6. Seller wallet balance reduced
```

---

## 📊 Database Maintenance

### Backup
```bash
pg_dump -U vendora_user -h localhost vendora > backup.sql
```

### Restore
```bash
psql -U vendora_user -h localhost vendora < backup.sql
```

### Monitor Tables
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 🎯 Version Info

- PostgreSQL: 12+
- TypeORM: 0.3.17
- Node.js: 18+
- NestJS: 10.2.0

---

**For detailed documentation, see:**
- DATABASE_ARCHITECTURE.md
- DATABASE_SETUP_GUIDE.md
- SELLER_REGISTRATION_KYC_GUIDE.md
