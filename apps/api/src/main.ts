import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as path from 'path';

for (const envPath of [path.resolve(__dirname, '../../../.env'), path.resolve(__dirname, '../.env')]) {
  dotenv.config({ path: envPath });
}

async function ensureInitialAdmin() {
  const email = process.env.ADMIN_INITIAL_EMAIL?.trim() || 'admin@example.com';
  const password = process.env.ADMIN_INITIAL_PASSWORD?.trim() || (process.env.NODE_ENV === 'production' ? '' : 'admin123');

  if (!password) {
    throw new Error('Missing ADMIN_INITIAL_PASSWORD environment variable. Set it before running the API.');
  }

  const prisma = new PrismaClient();
  const admin = await prisma.user.upsert({
    where: { email },
    update: { password: await bcrypt.hash(password, 10), role: 'ADMIN', status: 'ACTIVE', emailVerified: true },
    create: {
      name: 'Vendora Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  if (admin) {
    console.log(`✅ Initial admin ready: ${email}`);
  }

  await prisma.$disconnect();
}

async function ensureSeedSeller() {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const prisma = new PrismaClient();
  const sellerEmail = process.env.SELLER_INITIAL_EMAIL?.trim() || 'seller@vendora.local';
  const sellerPassword = process.env.SELLER_INITIAL_PASSWORD?.trim() || 'VendoraDev123!';

  const user = await prisma.user.upsert({
    where: { email: sellerEmail },
    update: {
      password: await bcrypt.hash(sellerPassword, 10),
      role: 'SELLER',
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      name: 'Vendora Seller',
      email: sellerEmail,
      password: await bcrypt.hash(sellerPassword, 10),
      role: 'SELLER',
      status: 'ACTIVE',
      emailVerified: true,
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: user.id },
    update: { status: 'ACTIVE' },
    create: { userId: user.id, status: 'ACTIVE' },
  });

  await prisma.shop.upsert({
    where: { sellerId: seller.id },
    update: {},
    create: {
      sellerId: seller.id,
      name: 'Vendora Seller Shop',
      slug: 'vendora-seller-shop',
      description: 'Seeded local development shop',
    },
  });

  const freePlan = await prisma.subscriptionPlan.upsert({
    where: { name: 'FREE' },
    update: { status: 'ACTIVE' },
    create: {
      name: 'FREE',
      price: 0,
      productLimit: 200,
      orderLimit: -1,
      storageLimit: -1,
      duration: 30,
      features: JSON.stringify(['basic-dashboard', 'product-catalog']),
      analytics: true,
      support: 'STANDARD',
      featuredProducts: false,
      customShop: false,
      status: 'ACTIVE',
    },
  });

  await prisma.sellerSubscription.upsert({
    where: { sellerId: seller.id },
    update: { planId: freePlan.id, status: 'ACTIVE', expiresAt: null },
    create: { sellerId: seller.id, planId: freePlan.id, status: 'ACTIVE' },
  });

  console.log(`✅ Seed seller ready: ${sellerEmail}`);
  await prisma.$disconnect();
}

async function bootstrap() {
  const allowedOrigins = [
    'http://127.0.0.1:4173',
    'http://localhost:4173',
    'http://127.0.0.1:4176',
    'http://localhost:4176',
    'http://127.0.0.1:4177',
    'http://localhost:4177',
    'http://127.0.0.1:4178',
    'http://localhost:4178',
  ];
  const isLocalDevelopmentOrigin = (origin?: string) =>
    process.env.NODE_ENV !== 'production' &&
    Boolean(origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));

  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || isLocalDevelopmentOrigin(origin)) {
          callback(null, true);
          return;
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
  });

  app.use(
    helmet.default({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          objectSrc: ["'none'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  await ensureInitialAdmin();
  await ensureSeedSeller();

  const port = process.env.PORT || 4003;
  const host = '127.0.0.1';
  await app.listen(port, host);

  console.log(`✅ Vendora NestJS API running on http://${host}:${port}`);
  console.log(`📚 Health: http://${host}:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

