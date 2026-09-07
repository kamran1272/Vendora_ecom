import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, status: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('USERS');
  console.log(JSON.stringify(users, null, 2));

  const sellers = await prisma.seller.findMany({
    select: { id: true, userId: true, status: true },
    orderBy: { createdAt: 'desc' },
  });
  console.log('SELLERS');
  console.log(JSON.stringify(sellers, null, 2));
} finally {
  await prisma.$disconnect();
}
