const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const tables = await prisma.$queryRawUnsafe("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  console.log(JSON.stringify(tables));
  console.log(JSON.stringify({
    users: await prisma.user.count(),
    sellers: await prisma.seller.count(),
    shops: await prisma.shop.count(),
    warehouseProducts: await prisma.warehouseProduct.count(),
    sellerProducts: await prisma.sellerProduct.count(),
    plans: await prisma.subscriptionPlan.count(),
    subscriptions: await prisma.sellerSubscription.count(),
  }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
