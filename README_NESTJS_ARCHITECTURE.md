# Vendora NestJS Architecture

This monorepo is structured around a marketplace model where users, sellers, shops, products, orders, payouts, and admin operations are separated into clear modules.

## Monorepo structure

```text
Vendora_ecommerce/
├── apps/
│   ├── web/                  # Customer storefront
│   ├── seller-panel/         # Seller dashboard
│   ├── admin-panel/         # Admin dashboard
│   └── api/                 # NestJS API
├── packages/
│   └── shared/              # Shared types and utilities
├── package.json
├── README.md
├── README_NESTJS_ARCHITECTURE.md
└── apps/api/README.md
```

## Runtime architecture

- Frontend apps connect to the API at http://127.0.0.1:4003/api
- The API is configured to run locally with SQLite by default
- Environment files are loaded from the project root and app folder
- Prisma generation runs as part of the API build and start commands

## Authentication and roles

The backend includes JWT-based authentication and role-aware access patterns for:

- CUSTOMER
- SELLER
- ADMIN
- SUPER_ADMIN

Protected route patterns are used on the customer, seller, and admin screens to redirect unauthenticated users to login and restrict access based on role.

## App responsibilities

### Customer storefront

- Product catalog and category browsing
- Product detail views
- Cart and checkout flow
- Order tracking
- Account management

### Seller panel

- Shop setup and seller onboarding
- Product management
- Orders and payouts
- Earnings and withdrawals
- Seller reports and settings

### Admin panel

- Seller review and approval
- Marketplace product oversight
- Commission and payout actions
- User and shop management
- Reports and dashboard analytics

### API layer

- Auth and JWT issuance
- User and seller management
- Shops and product modules
- Orders and payments APIs
- Commission and payout logic
- Health endpoint and secure middleware

## Local developer setup

```bash
cd "E:\Projects 2026\Vendora_ecommerce"
npm install

# root-level startup
npm run dev
```

Or start the API alone:

```bash
$env:DATABASE_URL='file:./apps/api/data/dev.sqlite'
$env:DB_TYPE='sqlite'
npm run dev --workspace @vendora/api
```

## Environment configuration

```env
# .env or apps/api/.env
NODE_ENV=development
PORT=4003
DB_TYPE=sqlite
DATABASE_URL="file:./apps/api/data/dev.sqlite"
JWT_SECRET=vendora-super-secret-key-2024
JWT_EXPIRES_IN=7d
THROTTLE_TTL=60
THROTTLE_LIMIT=120
```

## Notes

- SQLite is the working local setup for this repo.
- PostgreSQL is still prepared for production use and can be swapped in later.
- The project is designed as a working marketplace foundation with room for production expansion and harder auth/security enforcement.
```

### Reviews
```
GET    /api/reviews/product/:id     # Product reviews
POST   /api/reviews                 # Create review
GET    /api/reviews/product/:id/avg # Average rating
```

### Reports & Analytics
```
GET    /api/reports/sales/:period   # Sales report
GET    /api/reports/analytics/:id   # Analytics
POST   /api/reports                 # Generate report
```

### CMS
```
GET    /api/cms/pages               # List pages
GET    /api/cms/pages/:slug         # Get page
POST   /api/cms/pages               # Create page
PUT    /api/cms/pages/:id           # Update page
```

### Settings
```
GET    /api/settings                # Get settings
GET    /api/settings/:key           # Get setting
POST   /api/settings                # Update settings
```

## 🛠️ Development Commands

```bash
# Install dependencies
npm install

# Build all apps
npm run build

# Start all apps in development
npm run dev

# Start individual apps
npm run dev:web                     # Frontend
npm run dev:seller                  # Seller panel
npm run dev:admin                   # Admin panel
npm run dev:api                     # Backend API

# Build specific workspace
npm run build --workspace @vendora/web
npm run build --workspace @vendora/seller-panel
npm run build --workspace @vendora/admin-panel
npm run build --workspace @vendora/api

# Linting
npm run lint --workspace @vendora/web
npm run lint --workspace @vendora/api
```

## 🌐 Port Configuration

| Service | Port | URL |
|---------|------|-----|
| Customer Web | 5173 | http://localhost:5173 |
| Seller Panel | 4175 | http://localhost:4175 |
| Admin Panel | 4176 | http://localhost:4176 |
| NestJS API | 4003 | http://127.0.0.1:4003/api |

## 🔐 Environment Variables

### API (`.env`)
```env
NODE_ENV=development
PORT=4003
JWT_SECRET=your-secret-key
DATABASE_URL=sqlite://vendora.db
CORS_ORIGIN=*
```

## 📊 Database

Currently using **SQLite** for development. Ready to integrate:
- PostgreSQL
- MySQL
- MongoDB
- SQL Server

## 🚀 Production Deployment

### Build
```bash
npm run build
```

### Environment
```env
NODE_ENV=production
PORT=3000
JWT_SECRET=<strong-production-secret>
DATABASE_URL=<production-db-url>
CORS_ORIGIN=https://yourdomain.com
```

### Deploy
```bash
# Start API
npm start --workspace @vendora/api

# Serve frontend builds
npm run preview --workspace @vendora/web
```

## 📚 Tech Stack Summary

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Zustand
- Axios
- React Hook Form
- Zod

### Backend
- NestJS 10
- TypeScript
- Passport.js (JWT)
- Express
- Class Validator
- Helmet

### Monorepo
- npm Workspaces
- Shared package for types

## 🎯 Features

✅ Multi-vendor marketplace  
✅ Separate apps (customer, seller, admin)  
✅ Professional NestJS backend  
✅ Modular architecture  
✅ Authentication & Authorization  
✅ Product management  
✅ Order processing  
✅ Payment integration ready  
✅ Shipping management  
✅ Reviews & ratings  
✅ Analytics & reporting  
✅ CMS capabilities  
✅ Responsive design  
✅ Type-safe development  

## 📖 Documentation

- [API Documentation](./apps/api/README.md)
- [Frontend Guide](./apps/web/README.md)
- [Seller Panel Guide](./apps/seller-panel/README.md)
- [Admin Panel Guide](./apps/admin-panel/README.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

MIT

---

**Vendora - Professional Multi-Vendor E-Commerce Platform**  
Built with modern technologies for enterprise-grade scalability and reliability.
