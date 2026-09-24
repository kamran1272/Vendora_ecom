import test from 'node:test';
import assert from 'node:assert/strict';
import { hash } from 'bcrypt';
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
  );

  await assert.rejects(
    () => authService.login({ email: 'deleted@example.com', password }),
    /deleted|inactive/i,
  );
});
