import { PrismaClient } from '@prisma/client'
import * as bcrypt from 'bcrypt'
import * as dotenv from 'dotenv'
import * as path from 'path'

for (const envPath of [path.resolve(process.cwd(), '.env'), path.resolve(process.cwd(), '../../.env')]) {
  dotenv.config({ path: envPath })
}

const prisma = new PrismaClient()
const DEFAULT_ADMIN_EMAIL = 'admin@example.com'
const DEFAULT_ADMIN_PASSWORD = 'admin123'

function getInitialAdminCredentials() {
  const email = process.env.ADMIN_INITIAL_EMAIL?.trim() || DEFAULT_ADMIN_EMAIL
  const password = process.env.ADMIN_INITIAL_PASSWORD?.trim() || (process.env.NODE_ENV === 'production' ? '' : DEFAULT_ADMIN_PASSWORD)

  if (!password) {
    throw new Error('Missing ADMIN_INITIAL_PASSWORD environment variable. The initial admin bootstrap requires a secure password value.')
  }

  return { email, password }
}

async function hashPassword(password: string) {
  return bcrypt.hash(password, 10)
}

async function main() {
  console.log('🌱 Starting realistic Prisma seed for Vendora development database...')

  const { email, password } = getInitialAdminCredentials()
  const now = new Date()
  const baseDate = new Date('2026-08-15T09:00:00.000Z')
  const adminPassword = await hashPassword(password)

  const admin = await prisma.user.upsert({
    where: { email },
    update: {
      name: 'Vendora Admin',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
    create: {
      name: 'Vendora Admin',
      email,
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerified: true,
    },
  })

  const customerRecords = [
    { name: 'Ahmed Hassan', email: 'ahmed.hassan@vendora.local' },
    { name: 'Sara Ali', email: 'sara.ali@vendora.local' },
    { name: 'Mohammed Qarni', email: 'mohammed.qarni@vendora.local' },
  ]

  const customerPasswords = await Promise.all(
    customerRecords.map(() => hashPassword(password)),
  )

  const customerUsers = await Promise.all(
    customerRecords.map((customer, index) =>
      prisma.user.upsert({
        where: { email: customer.email },
        update: {},
        create: {
          name: customer.name,
          email: customer.email,
          password: customerPasswords[index],
          role: 'CUSTOMER',
          status: 'ACTIVE',
          emailVerified: true,
        },
      }),
    ),
  )

  const sellerRecords = [
    { name: 'Nadia Khan', email: 'nadia@northpeak.local', shopName: 'NorthPeak Studio' },
    { name: 'Omar Rahman', email: 'omar@lumaatelier.local', shopName: 'Luma Atelier' },
  ]

  const sellerPasswords = await Promise.all(
    sellerRecords.map(() => hashPassword(password)),
  )

  const sellerUsers = await Promise.all(
    sellerRecords.map((seller, index) =>
      prisma.user.upsert({
        where: { email: seller.email },
        update: {},
        create: {
          name: seller.name,
          email: seller.email,
          password: sellerPasswords[index],
          role: 'SELLER',
          status: 'ACTIVE',
          emailVerified: true,
        },
      }),
    ),
  )

  const sellers = await Promise.all(
    sellerUsers.map((user) =>
      prisma.seller.upsert({
        where: { userId: user.id },
        update: { status: 'ACTIVE' },
        create: {
          userId: user.id,
          status: 'ACTIVE',
        },
      }),
    ),
  )

  const subscriptionPlans = await Promise.all([
    prisma.subscriptionPlan.upsert({
      where: { name: 'Starter Plan' },
      update: {},
      create: {
        name: 'Starter Plan',
        price: 29,
        productLimit: 200,
        orderLimit: 500,
        storageLimit: 1000,
        duration: 30,
        features: JSON.stringify(['Storefront', 'Basic analytics', 'Email support']),
        analytics: true,
        support: 'STANDARD',
        featuredProducts: false,
        customShop: false,
        status: 'ACTIVE',
      },
    }),
    prisma.subscriptionPlan.upsert({
      where: { name: 'Growth Plan' },
      update: {},
      create: {
        name: 'Growth Plan',
        price: 79,
        productLimit: 1000,
        orderLimit: 5000,
        storageLimit: 5000,
        duration: 30,
        features: JSON.stringify(['Advanced analytics', 'Priority support', 'Promotions']),
        analytics: true,
        support: 'PRIORITY',
        featuredProducts: true,
        customShop: true,
        status: 'ACTIVE',
      },
    }),
  ])

  await Promise.all(
    sellers.map((seller, index) =>
      prisma.sellerSubscription.upsert({
        where: { sellerId: seller.id },
        update: {
          status: 'ACTIVE',
          expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
        },
        create: {
          sellerId: seller.id,
          planId: subscriptionPlans[index % subscriptionPlans.length].id,
          startsAt: new Date(baseDate.getTime() + index * 86400000),
          expiresAt: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000),
          status: 'ACTIVE',
        },
      }),
    ),
  )

  for (const [index, seller] of sellers.entries()) {
    const plan = subscriptionPlans[index % subscriptionPlans.length]
    const existingPurchase = await prisma.sellerSubscriptionPurchase.findFirst({ where: { sellerId: seller.id, planId: plan.id, action: 'PURCHASE' } })
    if (!existingPurchase) await prisma.sellerSubscriptionPurchase.create({ data: { sellerId: seller.id, planId: plan.id, amount: plan.price, paymentMethod: 'STRIPE_TEST', status: 'COMPLETED', action: 'PURCHASE', purchasedAt: new Date(baseDate.getTime() + index * 86400000), expiresAt: new Date(now.getTime() + 90 * 86400000) } })
  }

  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'electronics' },
      update: {},
      create: { name: 'Electronics', slug: 'electronics', status: 'ACTIVE', sortOrder: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'fashion' },
      update: {},
      create: { name: 'Fashion', slug: 'fashion', status: 'ACTIVE', sortOrder: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'home-and-living' },
      update: {},
      create: { name: 'Home & Living', slug: 'home-and-living', status: 'ACTIVE', sortOrder: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'wellness' },
      update: {},
      create: { name: 'Wellness', slug: 'wellness', status: 'ACTIVE', sortOrder: 4 },
    }),
  ])

  const categoryMap = Object.fromEntries(categories.map((category) => [category.slug, category]))

  const brands = await Promise.all([
    prisma.brand.upsert({
      where: { slug: 'northpeak' },
      update: {},
      create: { name: 'NorthPeak', slug: 'northpeak', status: 'ACTIVE' },
    }),
    prisma.brand.upsert({
      where: { slug: 'luma' },
      update: {},
      create: { name: 'Luma', slug: 'luma', status: 'ACTIVE' },
    }),
    prisma.brand.upsert({
      where: { slug: 'summit' },
      update: {},
      create: { name: 'Summit', slug: 'summit', status: 'ACTIVE' },
    }),
    prisma.brand.upsert({
      where: { slug: 'terra' },
      update: {},
      create: { name: 'Terra', slug: 'terra', status: 'ACTIVE' },
    }),
  ])

  const brandMap = Object.fromEntries(brands.map((brand) => [brand.slug, brand]))

  const shops = await Promise.all([
    prisma.shop.upsert({
      where: { sellerId: sellers[0].id },
      update: {
        name: 'NorthPeak Studio',
        slug: 'northpeak-studio',
        description: 'Premium lifestyle essentials for modern living.',
      },
      create: {
        sellerId: sellers[0].id,
        name: 'NorthPeak Studio',
        slug: 'northpeak-studio',
        description: 'Premium lifestyle essentials for modern living.',
      },
    }),
    prisma.shop.upsert({
      where: { sellerId: sellers[1].id },
      update: {
        name: 'Luma Atelier',
        slug: 'luma-atelier',
        description: 'Curated home and wellness pieces with a modern touch.',
      },
      create: {
        sellerId: sellers[1].id,
        name: 'Luma Atelier',
        slug: 'luma-atelier',
        description: 'Curated home and wellness pieces with a modern touch.',
      },
    }),
  ])

  const warehouseProducts = await Promise.all([
    prisma.warehouseProduct.upsert({
      where: { sku: 'NP-WS-001' },
      update: {},
      create: {
        name: 'Aurora Smart Watch',
        description: 'Premium smartwatch with health tracking and durable glass face.',
        sku: 'NP-WS-001',
        barcode: '885100000001',
        images: JSON.stringify(['https://images.example.com/watch-1.jpg', 'https://images.example.com/watch-2.jpg']),
        category: categoryMap.electronics.name,
        brand: brandMap.northpeak.name,
        basePrice: 229.0,
        sellerMargin: 18,
        stock: 48,
        status: 'PUBLISHED',
      },
    }),
    prisma.warehouseProduct.upsert({
      where: { sku: 'NP-TR-002' },
      update: {},
      create: {
        name: 'Urban Travel Backpack',
        description: 'Water-resistant travel backpack with laptop sleeve and hidden pockets.',
        sku: 'NP-TR-002',
        barcode: '885100000002',
        images: JSON.stringify(['https://images.example.com/backpack-1.jpg']),
        category: categoryMap.fashion.name,
        brand: brandMap.northpeak.name,
        basePrice: 139.0,
        sellerMargin: 22,
        stock: 62,
        status: 'PUBLISHED',
      },
    }),
    prisma.warehouseProduct.upsert({
      where: { sku: 'LA-LP-003' },
      update: {},
      create: {
        name: 'Luma Ceramic Lamp',
        description: 'Minimal ceramic table lamp with warm ambient light.',
        sku: 'LA-LP-003',
        barcode: '885100000003',
        images: JSON.stringify(['https://images.example.com/lamp-1.jpg', 'https://images.example.com/lamp-2.jpg']),
        category: categoryMap['home-and-living'].name,
        brand: brandMap.luma.name,
        basePrice: 89.0,
        sellerMargin: 20,
        stock: 36,
        status: 'PUBLISHED',
      },
    }),
    prisma.warehouseProduct.upsert({
      where: { sku: 'LA-TH-004' },
      update: {},
      create: {
        name: 'Terra Cotton Throw',
        description: 'Soft woven blanket with calming neutral tones for the home.',
        sku: 'LA-TH-004',
        barcode: '885100000004',
        images: JSON.stringify(['https://images.example.com/throw-1.jpg']),
        category: categoryMap['home-and-living'].name,
        brand: brandMap.terra.name,
        basePrice: 64.0,
        sellerMargin: 26,
        stock: 58,
        status: 'PUBLISHED',
      },
    }),
    prisma.warehouseProduct.upsert({
      where: { sku: 'LA-AL-005' },
      update: {},
      create: {
        name: 'Aqua Bottle Set',
        description: 'Stainless steel bottle set for daily hydration and commuting.',
        sku: 'LA-AL-005',
        barcode: '885100000005',
        images: JSON.stringify(['https://images.example.com/bottle-1.jpg']),
        category: categoryMap.wellness.name,
        brand: brandMap.luma.name,
        basePrice: 52.0,
        sellerMargin: 19,
        stock: 71,
        status: 'PUBLISHED',
      },
    }),
    prisma.warehouseProduct.upsert({
      where: { sku: 'SM-CL-006' },
      update: {},
      create: {
        name: 'Summit Everyday Hoodie',
        description: 'Premium fleece hoodie designed for comfort and light outdoor use.',
        sku: 'SM-CL-006',
        barcode: '885100000006',
        images: JSON.stringify(['https://images.example.com/hoodie-1.jpg', 'https://images.example.com/hoodie-2.jpg']),
        category: categoryMap.fashion.name,
        brand: brandMap.summit.name,
        basePrice: 118.0,
        sellerMargin: 24,
        stock: 41,
        status: 'PUBLISHED',
      },
    }),
  ])

  const sellerProducts = await Promise.all([
    prisma.sellerProduct.upsert({
      where: { sellerId_warehouseProductId: { sellerId: sellers[0].id, warehouseProductId: warehouseProducts[0].id } },
      update: { sellingPrice: 249.0, status: 'ACTIVE' },
      create: {
        sellerId: sellers[0].id,
        shopId: shops[0].id,
        warehouseProductId: warehouseProducts[0].id,
        sellingPrice: 249.0,
        status: 'ACTIVE',
      },
    }),
    prisma.sellerProduct.upsert({
      where: { sellerId_warehouseProductId: { sellerId: sellers[0].id, warehouseProductId: warehouseProducts[1].id } },
      update: { sellingPrice: 149.0, status: 'ACTIVE' },
      create: {
        sellerId: sellers[0].id,
        shopId: shops[0].id,
        warehouseProductId: warehouseProducts[1].id,
        sellingPrice: 149.0,
        status: 'ACTIVE',
      },
    }),
    prisma.sellerProduct.upsert({
      where: { sellerId_warehouseProductId: { sellerId: sellers[1].id, warehouseProductId: warehouseProducts[2].id } },
      update: { sellingPrice: 99.0, status: 'ACTIVE' },
      create: {
        sellerId: sellers[1].id,
        shopId: shops[1].id,
        warehouseProductId: warehouseProducts[2].id,
        sellingPrice: 99.0,
        status: 'ACTIVE',
      },
    }),
    prisma.sellerProduct.upsert({
      where: { sellerId_warehouseProductId: { sellerId: sellers[1].id, warehouseProductId: warehouseProducts[3].id } },
      update: { sellingPrice: 74.0, status: 'ACTIVE' },
      create: {
        sellerId: sellers[1].id,
        shopId: shops[1].id,
        warehouseProductId: warehouseProducts[3].id,
        sellingPrice: 74.0,
        status: 'ACTIVE',
      },
    }),
    prisma.sellerProduct.upsert({
      where: { sellerId_warehouseProductId: { sellerId: sellers[1].id, warehouseProductId: warehouseProducts[4].id } },
      update: { sellingPrice: 59.0, status: 'ACTIVE' },
      create: {
        sellerId: sellers[1].id,
        shopId: shops[1].id,
        warehouseProductId: warehouseProducts[4].id,
        sellingPrice: 59.0,
        status: 'ACTIVE',
      },
    }),
    prisma.sellerProduct.upsert({
      where: { sellerId_warehouseProductId: { sellerId: sellers[0].id, warehouseProductId: warehouseProducts[5].id } },
      update: { sellingPrice: 129.0, status: 'ACTIVE' },
      create: {
        sellerId: sellers[0].id,
        shopId: shops[0].id,
        warehouseProductId: warehouseProducts[5].id,
        sellingPrice: 129.0,
        status: 'ACTIVE',
      },
    }),
  ])

  const orders = await Promise.all([
    prisma.order.create({
      data: {
        userId: customerUsers[0].id,
        status: 'DELIVERED',
        subtotal: 249.0,
        tax: 21.0,
        shipping: 12.0,
        discount: 10.0,
        total: 272.0,
        paymentMethod: 'stripe',
        shippingAddress: 'Apartment 3B, Gulshan Avenue, Karachi',
      },
    }),
    prisma.order.create({
      data: {
        userId: customerUsers[1].id,
        status: 'SHIPPED',
        subtotal: 149.0,
        tax: 12.0,
        shipping: 12.0,
        discount: 0,
        total: 173.0,
        paymentMethod: 'card',
        shippingAddress: 'Block A, DHA Phase 4, Karachi',
      },
    }),
    prisma.order.create({
      data: {
        userId: customerUsers[2].id,
        status: 'PAID',
        subtotal: 99.0,
        tax: 8.0,
        shipping: 10.0,
        discount: 5.0,
        total: 112.0,
        paymentMethod: 'paypal',
        shippingAddress: 'House 14, Clifton, Karachi',
      },
    }),
    prisma.order.create({
      data: {
        userId: customerUsers[0].id,
        status: 'PENDING',
        subtotal: 74.0,
        tax: 6.0,
        shipping: 9.0,
        discount: 0,
        total: 89.0,
        paymentMethod: 'stripe',
        shippingAddress: 'Apartment 3B, Gulshan Avenue, Karachi',
      },
    }),
    prisma.order.create({
      data: {
        userId: customerUsers[1].id,
        status: 'PROCESSING',
        subtotal: 118.0,
        tax: 10.0,
        shipping: 11.0,
        discount: 0,
        total: 139.0,
        paymentMethod: 'cash_on_delivery',
        shippingAddress: 'Block A, DHA Phase 4, Karachi',
      },
    }),
  ])

  await Promise.all([
    prisma.orderItem.create({ data: { orderId: orders[0].id, productId: warehouseProducts[0].id, warehouseProductId: warehouseProducts[0].id, sellerId: sellers[0].id, name: warehouseProducts[0].name, quantity: 1, price: 249.0 } }),
    prisma.orderItem.create({ data: { orderId: orders[1].id, productId: warehouseProducts[1].id, warehouseProductId: warehouseProducts[1].id, sellerId: sellers[0].id, name: warehouseProducts[1].name, quantity: 1, price: 149.0 } }),
    prisma.orderItem.create({ data: { orderId: orders[2].id, productId: warehouseProducts[2].id, warehouseProductId: warehouseProducts[2].id, sellerId: sellers[1].id, name: warehouseProducts[2].name, quantity: 1, price: 99.0 } }),
    prisma.orderItem.create({ data: { orderId: orders[3].id, productId: warehouseProducts[3].id, warehouseProductId: warehouseProducts[3].id, sellerId: sellers[1].id, name: warehouseProducts[3].name, quantity: 1, price: 74.0 } }),
    prisma.orderItem.create({ data: { orderId: orders[4].id, productId: warehouseProducts[5].id, warehouseProductId: warehouseProducts[5].id, sellerId: sellers[0].id, name: warehouseProducts[5].name, quantity: 1, price: 118.0 } }),
  ])

  const payments = await Promise.all([
    prisma.payment.create({ data: { orderId: orders[0].id, amount: orders[0].total, fee: 6.8, commission: 27.2, method: 'stripe', status: 'PAID', gateway: 'stripe', transactionId: 'txn_1001', rawResponse: '{"processor":"stripe"}' } }),
    prisma.payment.create({ data: { orderId: orders[1].id, amount: orders[1].total, fee: 4.3, commission: 17.3, method: 'card', status: 'PAID', gateway: 'stripe', transactionId: 'txn_1002', rawResponse: '{"processor":"stripe"}' } }),
    prisma.payment.create({ data: { orderId: orders[2].id, amount: orders[2].total, fee: 2.8, commission: 11.2, method: 'paypal', status: 'PAID', gateway: 'paypal', transactionId: 'txn_1003', rawResponse: '{"processor":"paypal"}' } }),
    prisma.payment.create({ data: { orderId: orders[3].id, amount: orders[3].total, fee: 2.2, commission: 8.9, method: 'stripe', status: 'PENDING', gateway: 'stripe', transactionId: 'txn_1004', rawResponse: '{"processor":"stripe"}' } }),
    prisma.payment.create({ data: { orderId: orders[4].id, amount: orders[4].total, fee: 3.5, commission: 13.9, method: 'cash_on_delivery', status: 'PENDING', gateway: 'cashfree', transactionId: 'txn_1005', rawResponse: '{"processor":"cashfree"}' } }),
  ])

  await Promise.all(orders.slice(0, 5).map((order, index) => prisma.commission.upsert({
    where: { orderId: order.id },
    update: { sellerId: index === 2 || index === 3 ? sellers[1].id : sellers[0].id, paymentId: payments[index].id, amount: payments[index].commission, rate: 10, status: payments[index].status === 'PAID' ? 'PAID' : 'PENDING', paidAt: payments[index].status === 'PAID' ? new Date(now.getTime() - 86400000) : null },
    create: { sellerId: index === 2 || index === 3 ? sellers[1].id : sellers[0].id, orderId: order.id, paymentId: payments[index].id, amount: payments[index].commission, rate: 10, status: payments[index].status === 'PAID' ? 'PAID' : 'PENDING', paidAt: payments[index].status === 'PAID' ? new Date(now.getTime() - 86400000) : null },
  })))

  const querySeeds = [
    { userId: customerUsers[0].id, sellerId: sellers[0].id, productId: warehouseProducts[0].id, subject: 'Does the watch support sleep tracking?', question: 'I would like to understand which health features are included.' },
    { userId: customerUsers[1].id, sellerId: sellers[1].id, productId: warehouseProducts[2].id, subject: 'Lamp bulb compatibility', question: 'Which bulb socket and maximum wattage does this lamp support?' },
  ]
  for (const query of querySeeds) {
    const existing = await prisma.productQuery.findFirst({ where: { userId: query.userId, sellerId: query.sellerId, productId: query.productId, subject: query.subject } })
    if (existing) await prisma.productQuery.update({ where: { id: existing.id }, data: { question: query.question, answer: query.productId === warehouseProducts[0].id ? 'Yes, sleep tracking is included in the health dashboard.' : null, status: query.productId === warehouseProducts[0].id ? 'ANSWERED' : 'OPEN' } })
    else await prisma.productQuery.create({ data: { ...query, answer: query.productId === warehouseProducts[0].id ? 'Yes, sleep tracking is included in the health dashboard.' : null, status: query.productId === warehouseProducts[0].id ? 'ANSWERED' : 'OPEN' } })
  }

  await Promise.all([
    prisma.uploadedFile.upsert({ where: { storedName: 'seed-business-license.pdf' }, update: { sellerId: sellers[0].id, url: '/api/seller/uploads/file/seed-business-license.pdf' }, create: { sellerId: sellers[0].id, filename: 'business-license.pdf', storedName: 'seed-business-license.pdf', mimeType: 'application/pdf', size: 24576, url: '/api/seller/uploads/file/seed-business-license.pdf' } }),
    prisma.uploadedFile.upsert({ where: { storedName: 'seed-store-banner.jpg' }, update: { sellerId: sellers[1].id, url: '/api/seller/uploads/file/seed-store-banner.jpg' }, create: { sellerId: sellers[1].id, filename: 'store-banner.jpg', storedName: 'seed-store-banner.jpg', mimeType: 'image/jpeg', size: 98304, url: '/api/seller/uploads/file/seed-store-banner.jpg' } }),
  ])

  await Promise.all([
    prisma.orderStatusHistory.create({ data: { orderId: orders[0].id, status: 'PAID', note: 'Payment captured successfully.' } }),
    prisma.orderStatusHistory.create({ data: { orderId: orders[0].id, status: 'DELIVERED', note: 'Delivered to customer.' } }),
    prisma.orderStatusHistory.create({ data: { orderId: orders[1].id, status: 'PAID', note: 'Packed and shipped.' } }),
    prisma.orderStatusHistory.create({ data: { orderId: orders[2].id, status: 'PAID', note: 'Order confirmed and processing.' } }),
    prisma.orderStatusHistory.create({ data: { orderId: orders[4].id, status: 'PROCESSING', note: 'Awaiting dispatch confirmation.' } }),
  ])

  await Promise.all([
    prisma.withdrawal.create({ data: { sellerId: sellers[0].id, amount: 860.0, method: 'BANK_TRANSFER', status: 'PAID', transactionId: 'wd_2001', processedAt: new Date(now.getTime() - 3 * 86400000) } }),
    prisma.withdrawal.create({ data: { sellerId: sellers[1].id, amount: 620.0, method: 'BANK_TRANSFER', status: 'PENDING', transactionId: 'wd_2002' } }),
  ])

  await Promise.all([
    prisma.review.create({
      data: {
        customerId: customerUsers[0].id,
        productId: warehouseProducts[0].id,
        sellerId: sellers[0].id,
        rating: 5,
        title: 'Excellent quality',
        text: 'The watch looks premium and the build quality feels durable.',
        status: 'APPROVED',
      },
    }),
    prisma.review.create({
      data: {
        customerId: customerUsers[1].id,
        productId: warehouseProducts[1].id,
        sellerId: sellers[0].id,
        rating: 4,
        title: 'Good travel bag',
        text: 'Perfect size for my laptop and travel essentials, but the strap could be softer.',
        status: 'APPROVED',
      },
    }),
    prisma.review.create({
      data: {
        customerId: customerUsers[2].id,
        productId: warehouseProducts[2].id,
        sellerId: sellers[1].id,
        rating: 5,
        title: 'Love the lamp',
        text: 'Beautiful lighting and fits perfectly in my room.',
        status: 'APPROVED',
      },
    }),
    prisma.review.create({
      data: {
        customerId: customerUsers[0].id,
        productId: warehouseProducts[4].id,
        sellerId: sellers[1].id,
        rating: 4,
        title: 'Very practical',
        text: 'The bottle set is useful and the finish feels premium.',
        status: 'PENDING',
      },
    }),
  ])

  await Promise.all([
    prisma.notification.create({ data: { userId: admin.id, type: 'SYSTEM', title: 'Daily marketplace summary', message: 'Sales are up 18% vs last week.', createdAt: new Date(now.getTime() - 3600000) } }),
    prisma.notification.create({ data: { userId: sellers[0].userId, type: 'ORDER', title: 'New sale recorded', message: 'Aurora Smart Watch sold successfully.', createdAt: new Date(now.getTime() - 43200000) } }),
    prisma.notification.create({ data: { userId: sellers[1].userId, type: 'WITHDRAWAL', title: 'Withdrawal processed', message: 'Your last withdrawal has been approved.', createdAt: new Date(now.getTime() - 7200000) } }),
    prisma.notification.create({ data: { userId: customerUsers[0].id, type: 'ORDER', title: 'Order delivered', message: 'Your order was delivered successfully.', createdAt: new Date(now.getTime() - 1800000) } }),
    prisma.notification.create({ data: { userId: customerUsers[1].id, type: 'REFUND', title: 'Refund request received', message: 'We are reviewing your refund request.', createdAt: new Date(now.getTime() - 3600000) } }),
  ])

  const supportConversations = await Promise.all([
    prisma.conversation.create({
      data: {
        type: 'SUPPORT',
        customerId: customerUsers[0].id,
        sellerId: sellers[0].id,
        subject: 'Order delivery status update',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'ORDER',
        lastMessageAt: new Date(now.getTime() - 3600000),
        createdAt: new Date(baseDate.getTime() + 86400000),
      },
    }),
    prisma.conversation.create({
      data: {
        type: 'SUPPORT',
        customerId: customerUsers[1].id,
        sellerId: sellers[1].id,
        subject: 'Product quality question',
        status: 'RESOLVED',
        priority: 'NORMAL',
        category: 'PRODUCT',
        lastMessageAt: new Date(now.getTime() - 43200000),
        createdAt: new Date(baseDate.getTime() + 2 * 86400000),
      },
    }),
  ])

  const participantData = [] as Array<{ conversationId: string; userId: string; role: string }>

  for (const conversation of supportConversations) {
    participantData.push(
      { conversationId: conversation.id, userId: conversation.customerId ?? '', role: 'CUSTOMER' },
      { conversationId: conversation.id, userId: conversation.sellerId ? sellers.find((seller) => seller.id === conversation.sellerId)?.userId ?? '' : '', role: 'SELLER' },
    )
  }

  if (participantData.length > 0) {
    await prisma.conversationParticipant.createMany({
      data: participantData.filter((row) => row.userId),
    })
  }

  const messageRows = supportConversations.flatMap((conversation) => {
    const customerUserId = conversation.customerId ?? ''
    const sellerUserId = conversation.sellerId ? sellers.find((seller) => seller.id === conversation.sellerId)?.userId ?? '' : ''

    return [
      {
        conversationId: conversation.id,
        senderId: customerUserId,
        senderRole: 'CUSTOMER',
        type: 'TEXT',
        content: conversation.subject,
        createdAt: new Date(now.getTime() - 7200000),
        updatedAt: new Date(now.getTime() - 7200000),
      },
      {
        conversationId: conversation.id,
        senderId: sellerUserId,
        senderRole: 'SELLER',
        type: 'TEXT',
        content: 'Thank you for reaching out. We are checking this for you.',
        createdAt: new Date(now.getTime() - 3600000),
        updatedAt: new Date(now.getTime() - 3600000),
      },
    ].filter((message) => message.senderId)
  })

  if (messageRows.length > 0) {
    await prisma.chatMessage.createMany({ data: messageRows })
  }

  await Promise.all([
    prisma.refundRequest.create({
      data: {
        orderId: orders[1].id,
        customerId: customerUsers[1].id,
        sellerId: sellers[0].id,
        paymentId: payments[1].id,
        amount: 34.0,
        reason: 'Late delivery beyond promised date',
        status: 'PENDING',
      },
    }),
    prisma.refundRequest.create({
      data: {
        orderId: orders[3].id,
        customerId: customerUsers[0].id,
        sellerId: sellers[1].id,
        paymentId: payments[3].id,
        amount: 18.0,
        reason: 'Product mismatch',
        status: 'APPROVED',
        processedAt: new Date(now.getTime() - 86400000),
      },
    }),
  ])

  const sellerSupportConversation = await prisma.conversation.upsert({
    where: { threadKey: `SELLER_SUPPORT:${sellers[0].id}` },
    update: { subject: 'Seller application review', status: 'OPEN', priority: 'HIGH', lastMessageAt: new Date(now.getTime() - 1800000) },
    create: { threadKey: `SELLER_SUPPORT:${sellers[0].id}`, type: 'SELLER_SUPPORT', sellerId: sellers[0].id, shopId: shops[0].id, subject: 'Seller application review', status: 'OPEN', priority: 'HIGH', category: 'SELLER', lastMessageAt: new Date(now.getTime() - 1800000) },
  })
  await prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: sellerSupportConversation.id, userId: sellers[0].userId } }, update: { role: 'SELLER' }, create: { conversationId: sellerSupportConversation.id, userId: sellers[0].userId, role: 'SELLER' } })
  await prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: sellerSupportConversation.id, userId: admin.id } }, update: { role: 'ADMIN' }, create: { conversationId: sellerSupportConversation.id, userId: admin.id, role: 'ADMIN' } })
  const supportMessageSeeds = [
    { senderId: admin.id, senderRole: 'ADMIN', content: 'Please share your business registration documents.', createdAt: new Date(now.getTime() - 7200000) },
    { senderId: sellers[0].userId, senderRole: 'SELLER', content: 'okay', createdAt: new Date(now.getTime() - 5400000) },
    { senderId: admin.id, senderRole: 'ADMIN', content: 'Your application is under review.', createdAt: new Date(now.getTime() - 3600000) },
    { senderId: sellers[0].userId, senderRole: 'SELLER', content: 'How long will it take?', createdAt: new Date(now.getTime() - 1800000) },
  ]
  for (const message of supportMessageSeeds) {
    const existing = await prisma.chatMessage.findFirst({ where: { conversationId: sellerSupportConversation.id, senderId: message.senderId, content: message.content } })
    if (!existing) await prisma.chatMessage.create({ data: { conversationId: sellerSupportConversation.id, ...message, type: 'TEXT' } })
  }

  const supportTicketSeeds = [
    { userId: sellerUsers[0].id, sellerId: sellers[0].id, shopId: shops[0].id, subject: 'Payout verification', description: 'Please verify the bank details for my next payout.', category: 'PAYMENT', priority: 'HIGH', status: 'OPEN' },
    { userId: sellerUsers[1].id, sellerId: sellers[1].id, shopId: shops[1].id, subject: 'Catalog import question', description: 'I need help preparing my next catalog import.', category: 'PRODUCT', priority: 'NORMAL', status: 'PENDING' },
  ]
  for (const ticketData of supportTicketSeeds) {
    const existing = await prisma.supportTicket.findFirst({ where: { sellerId: ticketData.sellerId, subject: ticketData.subject } })
    const ticket = existing || await prisma.supportTicket.create({ data: ticketData })
    const ticketMessage = await prisma.supportMessage.findFirst({ where: { ticketId: ticket.id, senderId: ticketData.userId } })
    if (!ticketMessage) await prisma.supportMessage.create({ data: { ticketId: ticket.id, senderId: ticketData.userId, messageType: 'TEXT', content: ticketData.description } })
  }

  console.log('✅ Seed complete: admin, customers, sellers, shops, subscriptions, catalog, orders, payments, commissions, withdrawals, reviews, notifications, conversations, messages, support tickets, product queries, uploaded files, and refunds have been created.')
}

main()
  .catch((error) => {
    console.error('❌ Prisma seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
