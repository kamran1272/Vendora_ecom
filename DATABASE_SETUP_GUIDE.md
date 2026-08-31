# Database Setup & Installation Guide

## Quick Start

### 1. Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+
- npm or yarn

### 2. Database Installation

#### On Windows:

```powershell
# Install PostgreSQL from https://www.postgresql.org/download/windows/
# During installation, remember the password you set for 'postgres' user

# Open PowerShell and connect to PostgreSQL
psql -U postgres

# In psql console, create the database
CREATE DATABASE vendora;
CREATE USER vendora_user WITH PASSWORD 'your_secure_password';
ALTER ROLE vendora_user SET client_encoding TO 'utf8';
ALTER ROLE vendora_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE vendora_user SET default_transaction_deferrable TO on;
ALTER ROLE vendora_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE vendora TO vendora_user;
\q
```

#### On macOS:

```bash
# Install PostgreSQL via Homebrew
brew install postgresql@15

# Start PostgreSQL service
brew services start postgresql@15

# Create database and user
createdb vendora
psql vendora -c "CREATE USER vendora_user WITH PASSWORD 'your_secure_password';"
psql vendora -c "ALTER ROLE vendora_user CREATEDB;"
psql vendora -c "GRANT ALL PRIVILEGES ON DATABASE vendora TO vendora_user;"
```

#### On Linux (Ubuntu/Debian):

```bash
# Install PostgreSQL
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib

# Start PostgreSQL service
sudo systemctl start postgresql

# Create database and user
sudo -u postgres createdb vendora
sudo -u postgres psql -c "CREATE USER vendora_user WITH PASSWORD 'your_secure_password';"
sudo -u postgres psql -c "ALTER ROLE vendora_user CREATEDB;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE vendora TO vendora_user;"
```

### 3. Configure Environment

Edit `apps/api/.env`:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=vendora_user
DB_PASSWORD=your_secure_password
DB_NAME=vendora

# Or use connection string
DATABASE_URL=postgresql://vendora_user:your_secure_password@localhost:5432/vendora
```

### 4. Install Dependencies

```bash
cd apps/api

# Install npm dependencies
npm install

# The following will be installed:
# - @nestjs/typeorm@^9.0.1
# - typeorm@^0.3.17
# - pg@^8.11.3
```

### 5. Run Migrations

```bash
# Run all migrations
npm run migration:run

# Or with TypeORM CLI
npx typeorm migration:run -d dist/database/config/database.config.js

# Check migration status
npx typeorm migration:show -d dist/database/config/database.config.js

# Revert last migration
npx typeorm migration:revert -d dist/database/config/database.config.js
```

### 6. Verify Database

```bash
# Connect to database
psql -U vendora_user -d vendora -h localhost

# List all tables
\dt

# Check users table
SELECT * FROM users;

# Check seller_profiles table
SELECT * FROM seller_profiles;

# Exit
\q
```

### 7. Start API Server

```bash
# Development mode (with watch)
npm run dev

# Production mode
npm run build
npm run start:prod
```

The API should be running at: `http://127.0.0.1:4003/api`

---

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Or start it
sudo systemctl start postgresql
```

### Authentication Failed

```
Error: password authentication failed for user "vendora_user"
```

**Solution:**
```bash
# Reset password
sudo -u postgres psql -c "ALTER USER vendora_user WITH PASSWORD 'new_password';"
```

### Database Already Exists

```
Error: database "vendora" already exists
```

**Solution:**
```bash
# Drop and recreate
psql -U postgres -c "DROP DATABASE vendora;"
psql -U postgres -c "CREATE DATABASE vendora;"
```

### Migration Failed

```bash
# View migration status
npx typeorm migration:show -d dist/database/config/database.config.js

# Revert to previous state
npx typeorm migration:revert -d dist/database/config/database.config.js

# Re-run migrations
npx typeorm migration:run -d dist/database/config/database.config.js
```

---

## Database Utilities

### Useful Commands

```bash
# Connect to database
psql -U vendora_user -d vendora -h localhost

# Backup database
pg_dump -U vendora_user -h localhost vendora > vendora_backup.sql

# Restore database
psql -U vendora_user -h localhost vendora < vendora_backup.sql

# Drop all tables (be careful!)
psql -U vendora_user -d vendora -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

---

## Using Database in NestJS

### Example: Using Entities in Services

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../database/entities';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(userData: any) {
    const user = this.userRepository.create(userData);
    return await this.userRepository.save(user);
  }

  async findByEmail(email: string) {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async findById(id: string) {
    return await this.userRepository.findOne({
      where: { id },
      relations: ['seller_profile', 'orders', 'reviews'],
    });
  }

  async update(id: string, updateData: any) {
    await this.userRepository.update(id, updateData);
    return await this.findById(id);
  }

  async delete(id: string) {
    return await this.userRepository.delete(id);
  }
}
```

### Example: Using Repositories in Modules

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User, SellerProfile, Product } from '../database/entities';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, SellerProfile, Product])],
  providers: [UsersService],
  controllers: [UsersController],
})
export class UsersModule {}
```

### Example: Query Builder

```typescript
async findProductsByCategory(categoryId: string) {
  return await this.productRepository
    .createQueryBuilder('product')
    .leftJoinAndSelect('product.variants', 'variants')
    .leftJoinAndSelect('product.images', 'images')
    .where('product.category_id = :categoryId', { categoryId })
    .andWhere('product.status = :status', { status: 'active' })
    .orderBy('product.created_at', 'DESC')
    .getMany();
}
```

---

## Testing Database Connection

### Create Test File

Create `apps/api/src/database/database.test.ts`:

```typescript
import { DataSource } from 'typeorm';
import { getDatabaseConfig } from './config/database.config';
import { ConfigService } from '@nestjs/config';

async function testConnection() {
  const configService = new ConfigService();
  const config = getDatabaseConfig(configService);
  
  const dataSource = new DataSource(config);
  
  try {
    await dataSource.initialize();
    console.log('✅ Database connection successful');
    console.log('📊 Tables created:');
    
    const tables = await dataSource.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    tables.forEach((table) => console.log(`  - ${table.table_name}`));
    
    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

testConnection();
```

Run it:
```bash
npx ts-node src/database/database.test.ts
```

---

## Next Steps

1. ✅ Database installed and configured
2. ✅ Migrations created and ready
3. Next: Implement repositories in each module
4. Next: Create seed data for testing
5. Next: Set up database backups strategy

---

## Additional Resources

- [TypeORM Documentation](https://typeorm.io/)
- [NestJS TypeORM Integration](https://docs.nestjs.com/techniques/database)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Vendora Database Architecture](./DATABASE_ARCHITECTURE.md)
