import { BadRequestException, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  private sellers: any[] = [
    {
      id: 1,
      userId: 2,
      shopName: 'Aurora Studio',
      status: 'active',
      rating: 4.8,
      earnings: 4210.5,
      withdrawableBalance: 3200.42,
      commissionRate: 10,
      approvedAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 3,
      shopName: 'Luna Labs',
      status: 'active',
      rating: 4.9,
      earnings: 5350.7,
      withdrawableBalance: 4100.14,
      commissionRate: 8,
      approvedAt: new Date().toISOString(),
    },
  ];

  private orders: any[] = [
    {
      id: 101,
      sellerId: 3,
      customerName: 'Ava Morris',
      status: 'Pending',
      total: 259.98,
      createdAt: new Date().toISOString(),
      items: [{ name: 'Premium Wireless Headphones', quantity: 2 }],
    },
    {
      id: 102,
      sellerId: 3,
      customerName: 'Lucas Reed',
      status: 'Processing',
      total: 219.99,
      createdAt: new Date().toISOString(),
      items: [{ name: 'Smart Watch Pro', quantity: 1 }],
    },
  ];

  private shopProfile = {
    userId: 3,
    shopName: 'Nede store',
    shopSlug: 'nede-store',
    shopEmail: 'shop@nede.store',
    phone: '+1234567890',
    description: 'Modern lifestyle products and accessories.',
    address: '12 Market Street',
    country: 'United States',
    state: 'California',
    city: 'Los Angeles',
    postalCode: '90001',
    logo: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=600&q=80',
    banner: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
    verified: true,
  };

  private packages = [
    { id: 1, name: 'Silver Shop', uploadLimit: 200, price: 49, active: true },
    { id: 2, name: 'Gold Shop', uploadLimit: 500, price: 99 },
  ];

  private wallet = {
    availableBalance: 3200.42,
    pendingBalance: 540.0,
    totalWithdrawn: 12840.25,
    currency: 'USD',
  };

  private applications: any[] = [];
  private withdrawals: any[] = [];

  findAll() {
    return this.sellers;
  }

  findOne(id: number) {
    return this.sellers.find((s) => s.id === id);
  }

  findByUserId(userId: number) {
    return this.sellers.find((s) => s.userId === userId);
  }

  create(sellerData: any) {
    const newSeller = {
      id: this.sellers.length + 1,
      status: 'pending',
      rating: 0,
      earnings: 0,
      withdrawableBalance: 0,
      commissionRate: 10,
      ...sellerData,
    };
    this.sellers.push(newSeller);
    return newSeller;
  }

  update(id: number, sellerData: any) {
    const seller = this.findOne(id);
    if (seller) {
      Object.assign(seller, sellerData);
    }
    return seller;
  }

  remove(id: number) {
    const index = this.sellers.findIndex((s) => s.id === id);
    if (index > -1) {
      return this.sellers.splice(index, 1);
    }
  }

  getApplications() {
    return this.applications;
  }

  async registerSeller(payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    shopName: string;
    category?: string;
    transactionPassword?: string;
    certificateType?: string;
    invitationCode?: string;
    certificateFront?: string;
    certificateBack?: string;
  }) {
    const { name, email, password, phone, shopName, category, transactionPassword, certificateType, invitationCode, certificateFront, certificateBack } = payload ?? {};

    if (!name || !email || !password || !shopName) {
      throw new BadRequestException('Name, email, password and shop name are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const slug = shopName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'shop';

    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: name.trim(),
          email: normalizedEmail,
          password: await hash(password, 10),
          role: 'SELLER',
        },
        select: { id: true },
      });

      const seller = await tx.seller.create({
        data: {
          userId: user.id,
          status: 'PENDING',
        },
        select: { id: true },
      });

      const shop = await tx.shop.create({
        data: {
          name: shopName.trim(),
          slug,
          description: category ? `Category: ${category}` : 'Pending shop application',
          sellerId: seller.id,
        },
        select: { id: true, slug: true },
      });

      const application = {
        id: `app-${Date.now()}`,
        userId: user.id,
        sellerId: seller.id,
        applicantName: name.trim(),
        email: normalizedEmail,
        phone: phone || '',
        shopName: shopName.trim(),
        certificateType: certificateType || 'id_card',
        certificateFront: certificateFront || null,
        certificateBack: certificateBack || null,
        invitationCode: invitationCode || '',
        status: 'PENDING',
        createdAt: new Date().toISOString(),
      };

      this.applications.unshift(application);

      return {
        userId: user.id,
        sellerId: seller.id,
        shopId: shop.id,
        slug: shop.slug,
        applicationId: application.id,
      };
    });

    return {
      message: 'Seller registration submitted successfully',
      ...result,
      status: 'PENDING',
    };
  }

  approveApplication(applicationId: string | number) {
    const application = this.applications.find((item) => String(item.id) === String(applicationId));
    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    application.status = 'APPROVED';
    const matchingSeller = this.sellers.find((seller) => String(seller.userId) === String(application.userId) || String(seller.id) === String(application.sellerId));
    if (matchingSeller) {
      matchingSeller.status = 'active';
      matchingSeller.approvedAt = new Date().toISOString();
    }

    return { message: 'Seller application approved successfully.', application };
  }

  rejectApplication(applicationId: string | number) {
    const application = this.applications.find((item) => String(item.id) === String(applicationId));
    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    application.status = 'REJECTED';
    const matchingSeller = this.sellers.find((seller) => String(seller.userId) === String(application.userId) || String(seller.id) === String(application.sellerId));
    if (matchingSeller) {
      matchingSeller.status = 'rejected';
    }

    return { message: 'Seller application rejected.', application };
  }

  applyForSeller(userId: number, shopName: string, payload?: any) {
    const existing = this.findByUserId(userId);
    if (existing) {
      return { ...existing, message: 'Seller application already exists.' };
    }

    const seller = this.create({
      userId,
      shopName,
      ownerName: payload?.ownerName || 'Seller Owner',
      email: payload?.email || `seller${userId}@vendora.local`,
      status: 'pending',
      businessType: payload?.businessType || 'Individual',
      country: payload?.country || 'US',
      city: payload?.city || 'New York',
      approvedAt: null,
    });

    return {
      message: 'Seller application submitted successfully.',
      seller,
    };
  }

  approveSeller(id: number) {
    const seller = this.findOne(id);
    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    seller.status = 'active';
    seller.approvedAt = new Date().toISOString();
    return { message: 'Seller approved successfully.', seller };
  }

  rejectSeller(id: number) {
    const seller = this.findOne(id);
    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    seller.status = 'rejected';
    return { message: 'Seller rejected.', seller };
  }

  suspendSeller(id: number) {
    const seller = this.findOne(id);
    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    seller.status = 'suspended';
    return { message: 'Seller suspended.', seller };
  }

  async getDashboard(userId: string | number) {
    const seller = this.findByUserId(Number(userId)) ?? this.sellers[1];
    const shop = this.shopProfile;
    const sellerRecord = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const sellerProducts = sellerRecord ? await this.prisma.sellerProduct.findMany({ where: { sellerId: sellerRecord.id }, include: { warehouseProduct: true }, take: 5, orderBy: { createdAt: 'desc' } }) : [];
    const sellerOrders = this.orders.filter((order) => order.sellerId === userId);
    const productCount = sellerRecord ? await this.prisma.sellerProduct.count({ where: { sellerId: sellerRecord.id } }) : 0;
    const subscription = sellerRecord ? await this.prisma.sellerSubscription.findFirst({ where: { sellerId: sellerRecord.id, status: 'ACTIVE', plan: { status: 'ACTIVE' } }, include: { plan: true } }) : null;
    const activePlan = subscription?.plan ?? await this.prisma.subscriptionPlan.upsert({ where: { name: 'FREE' }, update: {}, create: { name: 'FREE', productLimit: 200, price: 0, duration: 30 } });
    const totalSales = sellerOrders.reduce((sum, order) => sum + Number(order.total || order.amount || 0), 0);
    const deliveredOrders = sellerOrders.filter((order) => String(order.status).toLowerCase() === 'delivered').length;
    const cancelledOrders = sellerOrders.filter((order) => String(order.status).toLowerCase() === 'cancelled').length;
    const onDeliveryOrders = sellerOrders.filter((order) => ['shipped', 'on_delivery', 'out_for_delivery'].includes(String(order.status).toLowerCase())).length;
    const newOrders = sellerOrders.filter((order) => ['pending', 'new'].includes(String(order.status).toLowerCase())).length;

    return {
      shop: {
        name: shop.shopName,
        role: 'Seller',
        rating: seller?.rating ?? 5,
        verified: shop.verified,
      },
      rating: seller?.rating ?? 5,
      verified: shop.verified,
      products: productCount,
      totalOrders: sellerOrders.length,
      totalSales: totalSales || Number(seller?.earnings || 0),
      todayViews: 0,
      sales: {
        today: 0,
        yesterday: 0,
        currentMonth: totalSales,
        lastMonth: 0,
      },
      categoryCounts: [
        { name: 'Electronics', count: 36 },
        { name: 'Wearables', count: 14 },
        { name: 'Home', count: 11 },
      ],
      orders: {
        newOrder: newOrders,
        cancelled: cancelledOrders,
        onDelivery: onDeliveryOrders,
        delivered: deliveredOrders,
      },
      package: { id: activePlan.id, name: activePlan.name, uploadLimit: activePlan.productLimit, price: activePlan.price, active: true },
      topProducts: sellerProducts.map((product) => ({
        id: product.id,
        name: product.warehouseProduct.name,
        price: product.sellingPrice,
        image: JSON.parse(product.warehouseProduct.images || '[]')[0],
      })),
      statistics: {
        products: productCount,
        totalOrders: sellerOrders.length,
        totalSales: totalSales || Number(seller?.earnings || 0),
        todayViews: 0,
      },
      packageInfo: {
        name: activePlan.name,
        uploadLimit: activePlan.productLimit,
        expiresAt: subscription?.expiresAt?.toISOString() ?? null,
      },
    };
  }

  async getSellerProducts(userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) return [];
    const products = await this.prisma.sellerProduct.findMany({ where: { sellerId: seller.id }, include: { warehouseProduct: true }, orderBy: { createdAt: 'desc' } });
    return products.map((product) => ({
      ...product,
      id: product.id,
      warehouseProductId: product.warehouseProductId,
      name: product.warehouseProduct.name,
      sku: product.warehouseProduct.sku,
      price: product.sellingPrice,
      basePrice: product.warehouseProduct.basePrice,
      stock: product.warehouseProduct.stock,
      category: product.warehouseProduct.category,
      brand: product.warehouseProduct.brand,
      images: JSON.parse(product.warehouseProduct.images || '[]'),
    }));
  }

  getAllOrders() {
    return this.orders;
  }

  async getSellerProduct(id: string | number, userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const product = seller ? await this.prisma.sellerProduct.findFirst({ where: { id: String(id), sellerId: seller.id }, include: { warehouseProduct: true } }) : null;
    if (!product) {
      throw new BadRequestException('Product not found.');
    }
    return { ...product, name: product.warehouseProduct.name, price: product.sellingPrice, images: JSON.parse(product.warehouseProduct.images || '[]') };
  }

  createSellerProduct(userId: number, payload: any) {
    throw new BadRequestException('Seller products must be selected from the product warehouse.');
  }

  async updateSellerProduct(id: string | number, userId: string | number, payload: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const product = seller ? await this.prisma.sellerProduct.findFirst({ where: { id: String(id), sellerId: seller.id } }) : null;
    if (!product) throw new BadRequestException('Product not found.');
    return this.prisma.sellerProduct.update({ where: { id: product.id }, data: { ...(payload.sellingPrice !== undefined ? { sellingPrice: Number(payload.sellingPrice) } : {}), ...(payload.status !== undefined ? { status: payload.status } : {}) } });
  }

  async deleteSellerProduct(id: string | number, userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const product = seller ? await this.prisma.sellerProduct.findFirst({ where: { id: String(id), sellerId: seller.id } }) : null;
    if (!product) throw new BadRequestException('Product not found.');
    await this.prisma.sellerProduct.delete({ where: { id: product.id } });
    return { message: 'Product deleted', product };
  }

  async getProductStorehouse(userId: string | number) {
    const products = await this.getSellerProducts(userId);
    return products.map((product) => ({
      id: product.id,
      image: product.images[0],
      name: product.name,
      sku: product.warehouseProductId,
      category: product.category,
      availableStock: product.stock,
      reservedStock: 0,
      soldQuantity: 0,
      price: product.price,
      status: product.status,
    }));
  }

  getShop(userId: number) {
    return {
      ...this.shopProfile,
      userId,
      shopName: this.shopProfile.shopName,
    };
  }

  updateShop(userId: number, payload: any) {
    this.shopProfile = { ...this.shopProfile, ...payload };
    return this.shopProfile;
  }

  getSellerOrders(userId: number) {
    return this.orders.filter((order) => order.sellerId === userId);
  }

  getSellerOrder(id: number, userId: number) {
    const order = this.orders.find((item) => item.id === id && item.sellerId === userId);
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    return order;
  }

  updateSellerOrderStatus(id: number, userId: number, status: string) {
    const order = this.orders.find((item) => item.id === id && item.sellerId === userId);
    if (!order) {
      throw new BadRequestException('Order not found.');
    }
    const allowedStatuses = ['Pending', 'Confirmed', 'Processing', 'On Delivery', 'Delivered', 'Cancelled', 'Refund Requested', 'Refunded'];
    if (!allowedStatuses.includes(status)) {
      throw new BadRequestException('Invalid order status.');
    }
    order.status = status;
    return order;
  }

  async getSellerPackage(userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const subscription = await this.prisma.sellerSubscription.findFirst({ where: { sellerId: seller.id, status: 'ACTIVE', plan: { status: 'ACTIVE' } }, include: { plan: true } });
    const plan = subscription?.plan ?? await this.prisma.subscriptionPlan.upsert({ where: { name: 'FREE' }, update: {}, create: { name: 'FREE', productLimit: 200, price: 0, duration: 30 } });
    const usedUploads = await this.prisma.sellerProduct.count({ where: { sellerId: seller.id } });
    return { userId, currentPackage: { ...plan, uploadLimit: plan.productLimit }, usedUploads, remainingUploads: plan.productLimit < 0 ? null : Math.max(0, plan.productLimit - usedUploads) };
  }

  getPackages() {
    return this.packages;
  }

  purchasePackage(packageId: number, userId: number) {
    const selected = this.packages.find((item) => item.id === packageId);
    if (!selected) {
      throw new BadRequestException('Package not found.');
    }
    return { message: 'Package purchased successfully', package: selected, userId };
  }

  getWallet(userId: number) {
    return {
      userId,
      ...this.wallet,
    };
  }

  getEarnings(userId: number) {
    const seller = this.findByUserId(userId);
    if (!seller) {
      throw new BadRequestException('Seller profile not found.');
    }

    const grossSales = seller.earnings || 4210.5;
    const platformCommission = grossSales * ((seller.commissionRate || 10) / 100);
    const netEarnings = grossSales - platformCommission;

    return {
      grossSales,
      platformCommission,
      netEarnings,
      withdrawableBalance: seller.withdrawableBalance || 3200.42,
    };
  }

  requestWithdrawal(userId: number, payload: any) {
    const seller = this.findByUserId(userId);
    if (!seller) {
      throw new BadRequestException('Seller profile not found.');
    }

    const amount = Number(payload?.amount || seller.withdrawableBalance || 0);
    if (amount <= 0) {
      throw new BadRequestException('Withdrawal amount must be greater than zero.');
    }

    const request = {
      id: this.withdrawals.length + 1,
      sellerId: seller.id,
      amount,
      bankDetails: payload?.bankDetails || 'Bank transfer',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    this.withdrawals.push(request);
    return {
      message: 'Withdrawal request created successfully.',
      request,
    };
  }

  getWithdrawals(userId: number) {
    const seller = this.findByUserId(userId);
    if (!seller) {
      throw new BadRequestException('Seller profile not found.');
    }

    return this.withdrawals.filter((entry) => entry.sellerId === seller.id);
  }
}
