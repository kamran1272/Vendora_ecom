# Vendora API

The Vendora API is the backend for the marketplace monorepo. It exposes the business logic for authentication, orders, products, sellers, shops, payouts, and admin operations.

## Stack

- NestJS 10
- TypeScript
- JWT + Passport
- Prisma + SQLite for local development
- PostgreSQL-ready configuration for production
- Helmet and throttling for security hardening

## Local startup

From the repo root:

```bash
cd "E:\Projects 2026\Vendora_ecommerce"
$env:DATABASE_URL='file:./apps/api/data/dev.sqlite'
$env:DB_TYPE='sqlite'
npm run dev --workspace @vendora/api
```

The default API URL is:

```text
http://127.0.0.1:4003/api
```

Health check:

```text
http://127.0.0.1:4003/api/health
```

## Environment file

The API uses local environment variables from [apps/api/.env](apps/api/.env) or the root [.env](.env) file when present.

```env
NODE_ENV=development
PORT=4003
DB_TYPE=sqlite
DATABASE_URL="file:./data/dev.sqlite"
JWT_SECRET=vendora-super-secret-key-2024
JWT_EXPIRES_IN=7d
THROTTLE_TTL=60
THROTTLE_LIMIT=120
```

## Database mode

### Local development

The current configuration uses SQLite so the project runs without requiring a local PostgreSQL instance.

### Production-ready option

PostgreSQL can be enabled by switching to a Postgres URL and DB settings:

```env
DB_TYPE=postgres
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vendora?schema=public"
```

## Key modules

- auth
- users
- sellers
- shops
- products
- categories
- brands
- cart
- orders
- payments
- reviews
- coupons
- notifications
- shipping
- reports
- cms
- settings
- admin

## Build and run

```bash
npm run build --workspace @vendora/api
npm run start --workspace @vendora/api
```

## Important notes

- Prisma is generated automatically during API build/start.
- The project is set up for local development to work immediately without needing a database server.
- If you later switch to PostgreSQL, update the Prisma datasource and environment values to match your database host and credentials.
npm run test:cov --workspace @vendora/api
```

## 📊 API Response Format

All endpoints return JSON responses following this format:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {},
  "timestamp": "2024-08-29T12:00:00Z"
}
```

Error responses:

```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "errors": ["Error details"],
  "timestamp": "2024-08-29T12:00:00Z"
}
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **CORS Protection** - Cross-origin request control
- **Helmet** - HTTP security headers
- **Input Validation** - Class-validator with decorators
- **Rate Limiting** - Prevent abuse
- **SQL Injection Protection** - Parameterized queries

## 🚢 Deployment

### Build for Production

```bash
npm run build --workspace @vendora/api
```

### Run Production Server

```bash
npm start --workspace @vendora/api
```

## 📚 Documentation

- [NestJS Official Docs](https://docs.nestjs.com)
- [Passport.js Docs](http://www.passportjs.org)
- [TypeORM Docs](https://typeorm.io)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## 📄 License

MIT

---

**Built with ❤️ for Vendora Multi-Vendor Marketplace**
