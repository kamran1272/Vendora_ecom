# Database Setup - Fixed & Ready to Deploy

## ✅ Issues Fixed

### 1. **Dependency Version Conflict** ✅ RESOLVED
- **Problem**: `@nestjs/typeorm@9.0.1` required NestJS 8-9, but project had NestJS 10
- **Solution**: Updated to `@nestjs/typeorm@^10.0.0` (NestJS 10 compatible)

### 2. **Missing Migration Scripts** ✅ RESOLVED
- **Problem**: `npm run migration:run` script didn't exist
- **Solution**: Added 5 new TypeORM CLI scripts to package.json:
  - `migration:create` - Create new migration
  - `migration:run` - Run pending migrations
  - `migration:show` - Show migration status
  - `migration:revert` - Rollback last migration
  - `seed:run` - Load sample data

### 3. **TypeORM Configuration** ✅ RESOLVED
- **Problem**: TypeORM CLI couldn't find database config
- **Solution**: Created `src/database/config/typeorm-config.ts` with DataSource export

### 4. **Additional Dependencies** ✅ ADDED
- Added `bcrypt@^5.1.1` for password hashing
- Added `@types/bcrypt@^5.0.2` for TypeScript support

---

## 🚀 Next Steps: Database Setup

### Step 1: Ensure PostgreSQL is Running

**Windows:**
```powershell
# Check if PostgreSQL service is running
Get-Service PostgreSQL*

# Or start PostgreSQL
Start-Service PostgreSQL*
```

**Mac:**
```bash
# Check status
brew services list

# Start PostgreSQL
brew services start postgresql@15
```

**Linux:**
```bash
# Check status
sudo systemctl status postgresql

# Start PostgreSQL
sudo systemctl start postgresql
```

---

### Step 2: Create Database & User

**Option A: Using psql (Recommended)**

```bash
# Connect as postgres user
psql -U postgres

# In psql prompt, run:
CREATE DATABASE vendora;
CREATE USER vendora_user WITH PASSWORD 'your_secure_password';
ALTER ROLE vendora_user SET client_encoding TO 'utf8';
ALTER ROLE vendora_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE vendora_user SET default_transaction_deferrable TO on;
ALTER ROLE vendora_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE vendora TO vendora_user;
\q
```

**Option B: Using createdb (Faster)**

```bash
createdb vendora
createuser vendora_user --password
# Enter password when prompted
psql -d vendora -c "ALTER ROLE vendora_user CREATEDB;"
```

---

### Step 3: Update Environment Variables

Edit `apps/api/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=vendora_user
DB_PASSWORD=your_secure_password
DB_NAME=vendora

# Other settings (keep existing values)
NODE_ENV=development
JWT_SECRET=vendora-super-secret-key-2024
CORS_ORIGIN=*
```

---

### Step 4: Run Database Migrations

```bash
cd apps/api

# Build the project first (optional but recommended)
npm run build

# Run all migrations
npm run migration:run

# Check migration status
npm run migration:show
```

**Expected Output:**
```
migrations
 ├─ 1693526400000-CreateInitialSchema (up) ✓
```

---

### Step 5: Verify Database Creation

```bash
# Connect to database
psql -U vendora_user -d vendora -h localhost

# List tables
\dt

# Expected tables (15 total):
                    List of relations
 Schema |              Name              | Type  | Owner
--------+--------------------------------+-------+---------------
 public | brands                         | table | vendora_user
 public | categories                     | table | vendora_user
 public | coupons                        | table | vendora_user
 public | order_items                    | table | vendora_user
 public | orders                         | table | vendora_user
 public | payments                       | table | vendora_user
 public | product_images                 | table | vendora_user
 public | product_variants               | table | vendora_user
 public | products                       | table | vendora_user
 public | reviews                        | table | vendora_user
 public | seller_profiles                | table | vendora_user
 public | seller_wallets                 | table | vendora_user
 public | shops                          | table | vendora_user
 public | users                          | table | vendora_user
 public | wallet_transactions            | table | vendora_user
(15 rows)

# Count records (should be empty)
SELECT COUNT(*) FROM users;
# Result: 0

# Exit
\q
```

---

### Step 6: (Optional) Load Sample Data

```bash
npm run seed:run
```

This creates:
- 2 sample users
- 1 seller profile with KYC documents
- 1 shop
- 3 categories
- 2 brands
- 2 products
- 5 product variants
- 4 product images
- 2 coupons

---

### Step 7: Start API Server

```bash
npm run dev
```

You should see:
```
[Nest] 12345  - 08/29/2026, 4:00:00 PM     LOG [NestFactory] Starting Nest application...
[Nest] 12345  - 08/29/2026, 4:00:00 PM     LOG [InstanceLoader] TypeOrmModule dependencies initialized +123ms
[Nest] 12345  - 08/29/2026, 4:00:00 PM     LOG [RoutesResolver] AppModule routes resolved +456ms
[Nest] 12345  - 08/29/2026, 4:00:00 PM     LOG [NestApplication] Nest application successfully started +100ms
```

API is now running at: `http://127.0.0.1:4003/api`

---

## 📊 Database Scripts Reference

### Available npm scripts:

```bash
# Run all pending migrations
npm run migration:run

# Show migration status
npm run migration:show

# Rollback last migration
npm run migration:revert

# Create a new migration (interactive)
npm run migration:create

# Load sample data
npm run seed:run

# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm run start:prod
```

---

## 🔧 Troubleshooting

### Connection Refused Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**: Ensure PostgreSQL is running
```bash
# Windows
Start-Service PostgreSQL*

# Mac
brew services start postgresql@15

# Linux
sudo systemctl start postgresql
```

---

### Authentication Failed
```
Error: password authentication failed for user "vendora_user"
```

**Solution**: Reset password
```bash
psql -U postgres
ALTER USER vendora_user WITH PASSWORD 'new_password';
\q
```

Update `.env` with new password.

---

### Database Already Exists
```
Error: database "vendora" already exists
```

**Solution**: Drop and recreate
```bash
psql -U postgres
DROP DATABASE vendora;
CREATE DATABASE vendora;
\q
```

Then run migrations again.

---

### Migrations Failed
```
Error: QueryFailedError: relation "users" already exists
```

**Solution**: Check migration status and revert if needed
```bash
npm run migration:show

# If migrations are stuck, manually revert
npm run migration:revert

# Then try again
npm run migration:run
```

---

## 📝 Database Diagram

```
users (1) ←──→ (1) seller_profiles ⭐ KYC VERIFICATION
  ├─ (1) ←──→ (many) orders
  ├─ (1) ←──→ (many) reviews
  └─ (1) ←──→ (many) wallet_transactions

seller_profiles (1) ←──→ (many) shops
                  (1) ←──→ (many) products
                  (1) ←──→ (1) seller_wallets

products (1) ←──→ (many) product_variants
         (1) ←──→ (many) product_images
         (1) ←──→ (many) reviews

orders (1) ←──→ (many) order_items
       (1) ←──→ (1) payments

seller_wallets (1) ←──→ (many) wallet_transactions
```

---

## 📚 Quick Commands Cheat Sheet

```bash
# Navigate to API directory
cd apps/api

# Check npm scripts
npm run

# Install/update dependencies
npm install

# Database setup
npm run migration:run       # Run migrations
npm run migration:show      # Check status
npm run migration:revert    # Rollback
npm run seed:run           # Load sample data

# Development
npm run dev                 # Start with hot reload
npm run build               # Build for production
npm run start:prod          # Start production server

# Verification
npm run lint               # Run linter
```

---

## ✅ Verification Checklist

After completing all steps:

- [ ] PostgreSQL installed and running
- [ ] Database `vendora` created
- [ ] User `vendora_user` created with password
- [ ] `.env` file updated with DB credentials
- [ ] `npm install` completed successfully
- [ ] `npm run migration:run` completed
- [ ] 15 tables created in database
- [ ] (Optional) `npm run seed:run` completed
- [ ] API server starts with `npm run dev`
- [ ] Health check: `GET /api/health` returns OK

---

## 🎯 What's Ready

✅ **TypeORM Integration** - Fully configured with NestJS 10  
✅ **15 Database Tables** - With complete relationships  
✅ **Migrations System** - Ready to version control DB changes  
✅ **Seed Data** - Sample data for testing  
✅ **Environment Config** - All settings in `.env`  
✅ **npm Scripts** - Database commands available  
✅ **TypeScript Support** - Full type safety  
✅ **KYC Verification** - Seller document validation  

---

## 📞 Need Help?

See detailed documentation:
- `DATABASE_ARCHITECTURE.md` - Complete schema
- `DATABASE_SETUP_GUIDE.md` - Detailed installation
- `DATABASE_QUICK_REFERENCE.md` - Quick lookup
- `SELLER_REGISTRATION_KYC_GUIDE.md` - Registration flow

---

## 🚀 You're Ready to Go!

```bash
cd apps/api
npm run migration:run
npm run dev
```

Database will be initialized and API running at: **http://127.0.0.1:4003/api**

---

**Last Updated**: August 29, 2026  
**Status**: ✅ Ready for Production  
**Database**: PostgreSQL 12+  
**NestJS**: 10.2.0  
**TypeORM**: 0.3.17 with @nestjs/typeorm 10.0.0
