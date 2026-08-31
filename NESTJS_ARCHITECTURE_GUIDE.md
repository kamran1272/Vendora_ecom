# NestJS Backend Architecture Guide

## Complete Professional Module Structure

The Vendora NestJS backend implements a **modular, enterprise-grade architecture** with 16 specialized modules for a full-featured e-commerce platform.

## 📦 All Modules

### 1. **Auth Module** (`auth/`)
Handles authentication and authorization using JWT and Passport.

**Files**:
- `auth.module.ts` - Module definition
- `auth.controller.ts` - Login/register endpoints
- `auth.service.ts` - Authentication logic
- `strategies/jwt.strategy.ts` - JWT validation strategy

**Key Features**:
- User login
- User registration
- JWT token generation
- Token validation
- Refresh tokens

### 2. **Users Module** (`users/`)
Complete user management system.

**Files**:
- `users.module.ts` - Module definition
- `users.controller.ts` - CRUD endpoints
- `users.service.ts` - Business logic

**Key Features**:
- User CRUD operations
- Profile management
- Role-based access control
- User preferences

### 3. **Sellers Module** (`sellers/`)
Manages seller accounts and verifications.

**Files**:
- `sellers.module.ts` - Module definition
- `sellers.controller.ts` - Seller endpoints
- `sellers.service.ts` - Seller logic

**Key Features**:
- Seller registration
- Seller verification
- Seller analytics
- Seller rating

### 4. **Shops Module** (`shops/`)
Shop management and branding.

**Files**:
- `shops.module.ts` - Module definition
- `shops.controller.ts` - Shop endpoints
- `shops.service.ts` - Shop logic

**Key Features**:
- Shop creation
- Shop branding
- Shop settings
- Shop verification

### 5. **Products Module** (`products/`)
Product catalog management.

**Files**:
- `products.module.ts` - Module definition
- `products.controller.ts` - Product endpoints
- `products.service.ts` - Product logic

**Key Features**:
- Product CRUD
- Product search
- Category filtering
- Stock management
- Product variants

### 6. **Categories Module** (`categories/`)
Product category management.

**Files**:
- `categories.module.ts` - Module definition
- `categories.controller.ts` - Category endpoints
- `categories.service.ts` - Category logic

**Key Features**:
- Category listing
- Subcategories
- Category icons/images

### 7. **Brands Module** (`brands/`)
Brand management.

**Files**:
- `brands.module.ts` - Module definition
- `brands.controller.ts` - Brand endpoints
- `brands.service.ts` - Brand logic

**Key Features**:
- Brand listing
- Brand logos
- Brand verification

### 8. **Cart Module** (`cart/`)
Shopping cart management.

**Files**:
- `cart.module.ts` - Module definition
- `cart.controller.ts` - Cart endpoints
- `cart.service.ts` - Cart logic

**Key Features**:
- Add to cart
- Remove from cart
- Update quantities
- Cart persistence
- Total calculation

### 9. **Orders Module** (`orders/`)
Order processing and management.

**Files**:
- `orders.module.ts` - Module definition
- `orders.controller.ts` - Order endpoints
- `orders.service.ts` - Order logic

**Key Features**:
- Order creation
- Order tracking
- Order status management
- Order history
- Order analytics

### 10. **Payments Module** (`payments/`)
Payment processing and management.

**Files**:
- `payments.module.ts` - Module definition
- `payments.controller.ts` - Payment endpoints
- `payments.service.ts` - Payment logic

**Key Features**:
- Payment processing
- Multiple payment methods
- Payment status tracking
- Refund management
- Transaction history

### 11. **Reviews Module** (`reviews/`)
Product reviews and ratings.

**Files**:
- `reviews.module.ts` - Module definition
- `reviews.controller.ts` - Review endpoints
- `reviews.service.ts` - Review logic

**Key Features**:
- Submit reviews
- Rate products
- Average rating calculation
- Review moderation
- Review filters

### 12. **Coupons Module** (`coupons/`)
Discount coupon management.

**Files**:
- `coupons.module.ts` - Module definition
- `coupons.controller.ts` - Coupon endpoints
- `coupons.service.ts` - Coupon logic

**Key Features**:
- Coupon creation
- Coupon validation
- Discount application
- Coupon expiration
- Usage tracking

### 13. **Notifications Module** (`notifications/`)
User notifications system.

**Files**:
- `notifications.module.ts` - Module definition
- `notifications.controller.ts` - Notification endpoints
- `notifications.service.ts` - Notification logic

**Key Features**:
- Email notifications
- SMS notifications
- In-app notifications
- Push notifications
- Notification preferences

### 14. **Shipping Module** (`shipping/`)
Shipping and logistics management.

**Files**:
- `shipping.module.ts` - Module definition
- `shipping.controller.ts` - Shipping endpoints
- `shipping.service.ts` - Shipping logic

**Key Features**:
- Shipping cost calculation
- Shipment tracking
- Multiple carriers
- Address validation
- Delivery estimates

### 15. **Reports Module** (`reports/`)
Analytics and reporting.

**Files**:
- `reports.module.ts` - Module definition
- `reports.controller.ts` - Report endpoints
- `reports.service.ts` - Report logic

**Key Features**:
- Sales reports
- Performance analytics
- Seller analytics
- Customer analytics
- Custom reports

### 16. **CMS Module** (`cms/`)
Content management system.

**Files**:
- `cms.module.ts` - Module definition
- `cms.controller.ts` - CMS endpoints
- `cms.service.ts` - CMS logic

**Key Features**:
- Page management
- Content publishing
- SEO optimization
- Content versioning
- Multi-language support

### 17. **Settings Module** (`settings/`)
Platform settings and configuration.

**Files**:
- `settings.module.ts` - Module definition
- `settings.controller.ts` - Settings endpoints
- `settings.service.ts` - Settings logic

**Key Features**:
- Platform configuration
- Business settings
- Feature flags
- API settings
- Email configuration

## 🏗️ Module Anatomy

Every module follows this pattern:

```typescript
// Module File: products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';

@Module({
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService],  // Export for use in other modules
})
export class ProductsModule {}
```

```typescript
// Controller: products.controller.ts
import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')  // Route prefix
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string) {
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(Number(id));
  }

  @Post()
  create(@Body() productData: any) {
    return this.productsService.create(productData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() productData: any) {
    return this.productsService.update(Number(id), productData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(Number(id));
  }
}
```

```typescript
// Service: products.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private products = []; // Mock data

  findAll() {
    return this.products;
  }

  findOne(id: number) {
    return this.products.find((p) => p.id === id);
  }

  create(productData: any) {
    const newProduct = { id: this.products.length + 1, ...productData };
    this.products.push(newProduct);
    return newProduct;
  }

  update(id: number, productData: any) {
    const product = this.findOne(id);
    if (product) {
      Object.assign(product, productData);
    }
    return product;
  }

  remove(id: number) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index > -1) {
      return this.products.splice(index, 1);
    }
  }
}
```

## 🔄 Module Dependencies

```
AppModule (Root)
├── AuthModule
├── UsersModule ← AuthModule
├── SellersModule
├── ShopsModule
├── ProductsModule ← CategoriesModule, BrandsModule
├── CategoriesModule
├── BrandsModule
├── CartModule ← ProductsModule
├── OrdersModule ← CartModule, ProductsModule
├── PaymentsModule ← OrdersModule
├── ReviewsModule ← ProductsModule
├── CouponsModule
├── NotificationsModule
├── ShippingModule ← OrdersModule
├── ReportsModule
├── CmsModule
└── SettingsModule
```

## 🚀 Key NestJS Patterns

### Dependency Injection
```typescript
@Injectable()
export class ProductsService {
  // Auto-injected by NestJS
  constructor(private categoriesService: CategoriesService) {}
}
```

### Decorators
```typescript
@Module()          // Define module
@Controller()      // HTTP controller
@Injectable()      // Service provider
@Get(), @Post()    // HTTP methods
@Param(), @Query() // Parameters
@Body()            // Request body
@Guard()           // Authorization
@Pipe()            // Data transformation
@Interceptor()     // Response transformation
```

### Exception Handling
```typescript
import { HttpException, HttpStatus } from '@nestjs/common';

throw new HttpException(
  'Product not found',
  HttpStatus.NOT_FOUND,
);
```

### Validation
```typescript
import { IsString, IsNumber, IsEmail } from 'class-validator';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsNumber()
  price: number;
}
```

## 📡 API Response Pattern

All endpoints follow a consistent response pattern:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-08-29T12:00:00Z"
}
```

## 🔐 Security Layers

1. **JWT Authentication** - Passport.js guards
2. **Role-Based Access Control** - Custom guards
3. **Input Validation** - class-validator
4. **SQL Injection Prevention** - ORM prepared statements
5. **CORS Protection** - Express CORS middleware
6. **Security Headers** - Helmet.js

## 📈 Scalability Features

- **Modular Design** - Add modules without affecting others
- **Lazy Loading** - Load modules on demand
- **Caching** - Built-in cache support
- **Microservices Ready** - Can split into separate services
- **Database Agnostic** - Works with any database via ORM

## 🧪 Testing

Each module is designed for easy testing:

```typescript
import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [ProductsService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  it('should create a product', () => {
    const product = service.create({ name: 'Test' });
    expect(product).toBeDefined();
  });
});
```

## 🚀 Extending Modules

To add a new endpoint:

1. **Add to controller**:
```typescript
@Post('bulk-upload')
bulkUpload(@Body() data: any) {
  return this.productsService.bulkUpload(data);
}
```

2. **Add to service**:
```typescript
bulkUpload(data: any) {
  // Implementation
}
```

3. **Test the endpoint**:
```typescript
POST /api/products/bulk-upload
Content-Type: application/json

{ "products": [] }
```

---

**This architecture provides a solid foundation for enterprise e-commerce development!**
