import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
import * as helmet from 'helmet';
import * as path from 'path';

for (const envPath of [path.resolve(__dirname, '../../../.env'), path.resolve(__dirname, '../.env')]) {
  dotenv.config({ path: envPath });
}

async function bootstrap() {
  const configuredOrigins = (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  const localDevelopmentOrigins = process.env.NODE_ENV === 'production'
    ? []
    : [
        'http://127.0.0.1:4173',
        'http://localhost:4173',
        'http://127.0.0.1:4175',
        'http://localhost:4175',
        'http://127.0.0.1:4176',
        'http://localhost:4176',
        'http://127.0.0.1:4178',
        'http://localhost:4178',
      ];
  const allowedOrigins = [...configuredOrigins, ...localDevelopmentOrigins];
  const isLocalDevelopmentOrigin = (origin?: string) =>
    process.env.NODE_ENV !== 'production' && Boolean(origin && /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin));

  const app = await NestFactory.create(AppModule, {
    rawBody: true,
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

  const port = process.env.PORT || 4003;
  const host = process.env.HOST?.trim() || '0.0.0.0';
  await app.listen(port, host);

  console.log(`✅ Vendora NestJS API running on http://${host}:${port}`);
  console.log(`📚 Health: http://${host}:${port}/api/health`);
}

bootstrap().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
