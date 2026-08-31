const { PrismaClient } = require('@prisma/client');
const { hash } = require('bcrypt');
const prisma = new PrismaClient();

const products = Array.from({ length: 20 }, (_, index) => {
  const categories = ['Electronics', 'Fashion', 'Home', 'Sports'];
  const brands = ['Auralis', 'NorthPeak', 'Luma', 'Summit'];
  const number = index + 1;
  return {
    name: `${brands[index % brands.length]} Marketplace Product ${number}`,
    sku: `VND-WH-${String(number).padStart(4, '0')}`,
    barcode: `890000000${String(number).padStart(3, '0')}`,
    category: categories[index % categories.length],
    brand: brands[index % brands.length],
    description: `Approved warehouse catalog product ${number}.`,
    basePrice: 25 + number * 3,
    sellerMargin: 5 + (number % 4),
    stock: 100 + number * 10,
    images: JSON.stringify([`https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80`]),
    status: 'PUBLISHED',
  };
});

async function main() {
  const password = await hash('VendoraDev123!', 10);
  const admin = await prisma.user.upsert({ where: { email: 'admin@vendora.local' }, update: { role: 'ADMIN' }, create: { name: 'Vendora Admin', email: 'admin@vendora.local', password, role: 'ADMIN' } });
  const user = await prisma.user.upsert({ where: { email: 'seller@vendora.local' }, update: { role: 'SELLER' }, create: { name: 'Warehouse Seller', email: 'seller@vendora.local', password, role: 'SELLER' } });
  const seller = await prisma.seller.upsert({ where: { userId: user.id }, update: { status: 'ACTIVE' }, create: { userId: user.id, status: 'ACTIVE' } });
  await prisma.shop.upsert({ where: { sellerId: seller.id }, update: {}, create: { sellerId: seller.id, name: 'Warehouse Seller Shop', slug: 'warehouse-seller-shop' } });
  const free = await prisma.subscriptionPlan.upsert({ where: { name: 'Free' }, update: { productLimit: 200, status: 'ACTIVE' }, create: { name: 'Free', productLimit: 200, price: 0, duration: 30, status: 'ACTIVE' } });
  await prisma.sellerSubscription.upsert({ where: { sellerId: seller.id }, update: { planId: free.id, status: 'ACTIVE' }, create: { sellerId: seller.id, planId: free.id, status: 'ACTIVE' } });
  for (const product of products) await prisma.warehouseProduct.upsert({ where: { sku: product.sku }, update: product, create: product });
  console.log(JSON.stringify({ adminEmail: admin.email, sellerEmail: user.email, productCount: products.length, sellerId: seller.id }));
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());
