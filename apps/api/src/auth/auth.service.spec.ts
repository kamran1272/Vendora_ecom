import test from 'node:test';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';
import { UserRole } from '@/users/users.service';

test('login rejects blocked users', async () => {
  const password = 'StrongPass123!';
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-1',
        email: 'blocked@example.com',
        password: await hash(password, 10),
        name: 'Blocked User',
        role: UserRole.CUSTOMER,
        status: 'ACTIVE',
        isBlocked: true,
        deletedAt: null,
        emailVerified: true,
        twoFactorEnabled: false,
      }),
    },
  };

  const authService = new AuthService(
    { sign: () => 'token' } as any,
    {} as any,
    prisma as any,
    {} as any,
  );

  await assert.rejects(
    () => authService.login({ email: 'blocked@example.com', password }),
    /blocked|inactive/i,
  );
});

test('login rejects deleted users', async () => {
  const password = 'StrongPass123!';
  const prisma = {
    user: {
      findUnique: async () => ({
        id: 'user-2',
        email: 'deleted@example.com',
        password: await hash(password, 10),
        name: 'Deleted User',
        role: UserRole.CUSTOMER,
        status: 'ACTIVE',
        isBlocked: false,
        deletedAt: new Date(),
        emailVerified: true,
        twoFactorEnabled: false,
      }),
    },
  };

  const authService = new AuthService(
    { sign: () => 'token' } as any,
    {} as any,
    prisma as any,
    {} as any,
  );

  await assert.rejects(
    () => authService.login({ email: 'deleted@example.com', password }),
    /deleted|inactive/i,
  );
});

test('email verification marks the user as verified', async () => {
  const rawToken = 'verification-token';
  let verified = false;
  const prisma = {
    emailVerificationToken: {
      findUnique: async () => ({
        id: 'verification-1',
        userId: 'user-3',
        tokenHash: createHash('sha256').update(rawToken).digest('hex'),
        expiresAt: new Date(Date.now() + 60_000),
        usedAt: null,
        user: { id: 'user-3', email: 'customer@example.com', emailVerified: false },
      }),
    },
    $transaction: async (callback: (transaction: any) => Promise<unknown>) => callback({
      user: {
        update: async () => {
          verified = true;
          return { id: 'user-3', email: 'customer@example.com', emailVerified: true };
        },
      },
      emailVerificationToken: {
        update: async () => ({}),
      },
    }),
  };

  const authService = new AuthService({ sign: () => 'token' } as any, {} as any, prisma as any, {} as any);
  await authService.verifyEmail(rawToken);

  assert.equal(verified, true);
});
