import { BadRequestException, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService) {}

  private serializeSeller(record: any) {
    return {
      id: record.id,
      userId: record.userId,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      shop: record.shop ?? null,
      user: record.user
        ? {
            id: record.user.id,
            name: record.user.name,
            email: record.user.email,
            role: record.user.role,
          }
        : null,
    };
  }

  private serializeSellerApplication(record: any) {
    return {
      ...record,
      id: record.id,
      userId: record.userId,
      sellerId: record.sellerId,
      applicantName: record.applicantName,
      email: record.email,
      phone: record.phone,
      shopName: record.shopName,
      status: record.status,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      user: record.user ? { id: record.user.id, name: record.user.name, email: record.user.email } : null,
      seller: record.seller ? { id: record.seller.id, status: record.seller.status } : null,
    };
  }

  private async getSellerOrdersForSeller(sellerId: string) {
    const orders = await this.prisma.order.findMany({
      where: { items: { some: { sellerId } } },
      include: { items: true, user: true, payment: true, shipment: true, statusHistory: true },
      orderBy: { createdAt: 'desc' },
    });

    return orders.map((order) => ({
      ...order,
      customerName: order.user?.name ?? 'Customer',
      sellerItems: order.items.filter((item) => item.sellerId === sellerId),
    }));
  }

  async findAll() {
    const sellers = await this.prisma.seller.findMany({
      include: { user: true, shop: true, sellerProducts: true },
      orderBy: { createdAt: 'desc' },
    });

    return sellers.map((seller) => this.serializeSeller(seller));
  }

  async findOne(id: number | string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: String(id) },
      include: { user: true, shop: true, sellerProducts: true },
    });

    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    return this.serializeSeller(seller);
  }

  async findByUserId(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: String(userId) },
      include: { user: true, shop: true, sellerProducts: true },
    });

    return seller ? this.serializeSeller(seller) : null;
  }

  async create(sellerData: any) {
    const seller = await this.prisma.seller.create({
      data: {
        userId: String(sellerData.userId),
        status: sellerData.status ?? 'PENDING',
      },
      include: { user: true, shop: true },
    });

    return this.serializeSeller(seller);
  }

  async update(id: number | string, sellerData: any) {
    const seller = await this.prisma.seller.update({
      where: { id: String(id) },
      data: {
        ...(sellerData.userId !== undefined ? { userId: String(sellerData.userId) } : {}),
        ...(sellerData.status !== undefined ? { status: sellerData.status } : {}),
      },
      include: { user: true, shop: true },
    });

    return this.serializeSeller(seller);
  }

  async remove(id: number | string) {
    const seller = await this.prisma.seller.delete({
      where: { id: String(id) },
      include: { user: true, shop: true },
    });

    return this.serializeSeller(seller);
  }

  async getApplications() {
    const applications = await this.prisma.sellerApplication.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true, seller: true },
    });

    return applications.map((application) => this.serializeSellerApplication(application));
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
    const { name, email, password, phone, shopName, category, certificateType, invitationCode, certificateFront, certificateBack } = payload ?? {};

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

      const application = await tx.sellerApplication.create({
        data: {
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
        },
      });

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

  async approveApplication(applicationId: string | number) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: String(applicationId) },
      include: { seller: true },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: { status: 'APPROVED' },
      include: { user: true, seller: true },
    });

    if (updatedApplication.sellerId) {
      await this.prisma.seller.update({
        where: { id: updatedApplication.sellerId },
        data: { status: 'ACTIVE' },
      });
    }

    return { message: 'Seller application approved successfully.', application: this.serializeSellerApplication(updatedApplication) };
  }

  async rejectApplication(applicationId: string | number) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: String(applicationId) },
      include: { seller: true },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: { status: 'REJECTED' },
      include: { user: true, seller: true },
    });

    if (updatedApplication.sellerId) {
      await this.prisma.seller.update({
        where: { id: updatedApplication.sellerId },
        data: { status: 'REJECTED' },
      });
    }

    return { message: 'Seller application rejected.', application: this.serializeSellerApplication(updatedApplication) };
  }

  async applyForSeller(userId: number | string, shopName: string, payload?: any) {
    const existing = await this.findByUserId(userId);
    if (existing) {
      return { ...existing, message: 'Seller application already exists.' };
    }

    const seller = await this.prisma.seller.create({
      data: {
        userId: String(userId),
        status: 'PENDING',
      },
      include: { user: true, shop: true },
    });

    if (shopName) {
      await this.prisma.shop.create({
        data: {
          name: shopName,
          slug: shopName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'shop',
          sellerId: seller.id,
        },
      }).catch(() => undefined);
    }

    return {
      message: 'Seller application submitted successfully.',
      seller: this.serializeSeller(seller),
    };
  }

  async approveSeller(id: number | string) {
    const seller = await this.prisma.seller.update({
      where: { id: String(id) },
      data: { status: 'ACTIVE' },
      include: { user: true, shop: true },
    });

    return { message: 'Seller approved successfully.', seller: this.serializeSeller(seller) };
  }

  async rejectSeller(id: number | string) {
    const seller = await this.prisma.seller.update({
      where: { id: String(id) },
      data: { status: 'REJECTED' },
      include: { user: true, shop: true },
    });

    return { message: 'Seller rejected.', seller: this.serializeSeller(seller) };
  }

  async suspendSeller(id: number | string) {
    const seller = await this.prisma.seller.update({
      where: { id: String(id) },
      data: { status: 'SUSPENDED' },
      include: { user: true, shop: true },
    });

    return { message: 'Seller suspended.', seller: this.serializeSeller(seller) };
  }

  async getDashboard(userId: string | number) {
    const sellerRecord = await this.prisma.seller.findUnique({
      where: { userId: String(userId) },
      include: { shop: true },
    });

    if (!sellerRecord) {
      throw new BadRequestException('Seller account not found.');
    }

    const sellerOrders = await this.getSellerOrdersForSeller(sellerRecord.id);
    const productCount = await this.prisma.sellerProduct.count({ where: { sellerId: sellerRecord.id } });
    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId: sellerRecord.id, status: 'ACTIVE', plan: { status: 'ACTIVE' } },
      include: { plan: true },
    });
    const activePlan = subscription?.plan ?? (await this.prisma.subscriptionPlan.upsert({
      where: { name: 'FREE' },
      update: {},
      create: { name: 'FREE', productLimit: 200, price: 0, duration: 30 },
    }));

    const totalSales = sellerOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const deliveredOrders = sellerOrders.filter((order) => String(order.status).toLowerCase() === 'delivered').length;
    const cancelledOrders = sellerOrders.filter((order) => String(order.status).toLowerCase() === 'cancelled').length;
    const onDeliveryOrders = sellerOrders.filter((order) => ['shipped', 'on_delivery', 'out_for_delivery'].includes(String(order.status).toLowerCase())).length;
    const newOrders = sellerOrders.filter((order) => ['pending', 'new'].includes(String(order.status).toLowerCase())).length;

    const sellerProducts = await this.prisma.sellerProduct.findMany({
      where: { sellerId: sellerRecord.id },
      include: { warehouseProduct: true },
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    return {
      shop: {
        name: sellerRecord.shop?.name ?? 'Seller Shop',
        role: 'Seller',
        rating: 5,
        verified: true,
      },
      rating: 5,
      verified: true,
      products: productCount,
      totalOrders: sellerOrders.length,
      totalSales,
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
        totalSales,
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

    const products = await this.prisma.sellerProduct.findMany({
      where: { sellerId: seller.id },
      include: { warehouseProduct: true },
      orderBy: { createdAt: 'desc' },
    });

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
      status: product.status,
    }));
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: { items: true, payment: true, shipment: true, statusHistory: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSellerProduct(id: string | number, userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const product = seller ? await this.prisma.sellerProduct.findFirst({
      where: { id: String(id), sellerId: seller.id },
      include: { warehouseProduct: true },
    }) : null;

    if (!product) {
      throw new BadRequestException('Product not found.');
    }

    return {
      ...product,
      name: product.warehouseProduct.name,
      price: product.sellingPrice,
      images: JSON.parse(product.warehouseProduct.images || '[]'),
    };
  }

  createSellerProduct(userId: number, payload: any) {
    throw new BadRequestException('Seller products must be selected from the product warehouse.');
  }

  async updateSellerProduct(id: string | number, userId: string | number, payload: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const product = seller ? await this.prisma.sellerProduct.findFirst({ where: { id: String(id), sellerId: seller.id } }) : null;
    if (!product) throw new BadRequestException('Product not found.');

    return this.prisma.sellerProduct.update({
      where: { id: product.id },
      data: {
        ...(payload.sellingPrice !== undefined ? { sellingPrice: Number(payload.sellingPrice) } : {}),
        ...(payload.status !== undefined ? { status: payload.status } : {}),
      },
    });
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

  async getShop(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({
      where: { userId: String(userId) },
      include: { shop: true },
    });

    if (!seller) {
      throw new BadRequestException('Seller profile not found.');
    }

    return seller.shop ?? {
      id: null,
      name: 'Seller Shop',
      slug: 'seller-shop',
      description: null,
      sellerId: seller.id,
    };
  }

  async updateShop(userId: number | string, payload: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: true } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    if (!seller.shop) {
      return this.prisma.shop.create({
        data: {
          name: payload.name || 'Seller Shop',
          slug: (payload.slug || 'seller-shop').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'seller-shop',
          description: payload.description || null,
          sellerId: seller.id,
        },
      });
    }

    return this.prisma.shop.update({
      where: { id: seller.shop.id },
      data: {
        ...(payload.name !== undefined ? { name: payload.name } : {}),
        ...(payload.slug !== undefined ? { slug: payload.slug } : {}),
        ...(payload.description !== undefined ? { description: payload.description } : {}),
        ...(payload.logo !== undefined ? { logo: payload.logo } : {}),
        ...(payload.banner !== undefined ? { banner: payload.banner } : {}),
      },
    });
  }

  async getSellerOrders(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) return [];

    return this.getSellerOrdersForSeller(seller.id);
  }

  async getSellerOrder(id: number | string, userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const order = await this.prisma.order.findFirst({
      where: { id: String(id), items: { some: { sellerId: seller.id } } },
      include: { items: true, user: true, payment: true, shipment: true, statusHistory: true },
    });

    if (!order) throw new BadRequestException('Order not found.');
    return { ...order, customerName: order.user?.name ?? 'Customer' };
  }

  async updateSellerOrderStatus(id: number | string, userId: number | string, status: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const order = await this.prisma.order.findFirst({
      where: { id: String(id), items: { some: { sellerId: seller.id } } },
      include: { statusHistory: true },
    });

    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    const allowedStatuses = ['PENDING', 'CONFIRMED', 'PROCESSING', 'ON_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUND_REQUESTED', 'REFUNDED'];
    const normalizedStatus = String(status || '').toUpperCase();
    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new BadRequestException('Invalid order status.');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: normalizedStatus,
          note: `Status updated to ${normalizedStatus}`,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: { status: normalizedStatus },
        include: { items: true, payment: true, shipment: true, statusHistory: true, user: true },
      });
    });
  }

  async getSellerPackage(userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId: seller.id, status: 'ACTIVE', plan: { status: 'ACTIVE' } },
      include: { plan: true },
    });
    const plan = subscription?.plan ?? await this.prisma.subscriptionPlan.upsert({
      where: { name: 'FREE' },
      update: {},
      create: { name: 'FREE', productLimit: 200, price: 0, duration: 30 },
    });
    const usedUploads = await this.prisma.sellerProduct.count({ where: { sellerId: seller.id } });

    return {
      userId,
      currentPackage: { ...plan, uploadLimit: plan.productLimit },
      usedUploads,
      remainingUploads: plan.productLimit < 0 ? null : Math.max(0, plan.productLimit - usedUploads),
    };
  }

  async getPackages() {
    return this.prisma.subscriptionPlan.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { price: 'asc' },
    });
  }

  async purchasePackage(packageId: number | string, userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const selected = await this.prisma.subscriptionPlan.findUnique({ where: { id: String(packageId) } });
    if (!selected) throw new BadRequestException('Package not found.');

    const subscription = await this.prisma.sellerSubscription.upsert({
      where: { sellerId: seller.id },
      update: {
        planId: selected.id,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + selected.duration * 24 * 60 * 60 * 1000),
      },
      create: {
        sellerId: seller.id,
        planId: selected.id,
        status: 'ACTIVE',
        expiresAt: new Date(Date.now() + selected.duration * 24 * 60 * 60 * 1000),
      },
    });

    return { message: 'Package purchased successfully', package: selected, subscription, userId };
  }

  async getWallet(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const sellerOrders = await this.getSellerOrdersForSeller(seller.id);
    const totalRevenue = sellerOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);

    return {
      userId: String(userId),
      availableBalance: Number(totalRevenue * 0.7).toFixed(2),
      pendingBalance: Number(totalRevenue * 0.3).toFixed(2),
      totalWithdrawn: 0,
      currency: 'USD',
    };
  }

  async getEarnings(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const sellerOrders = await this.getSellerOrdersForSeller(seller.id);
    const grossSales = sellerOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
    const platformCommission = grossSales * 0.1;
    const netEarnings = grossSales - platformCommission;

    return {
      grossSales,
      platformCommission,
      netEarnings,
      withdrawableBalance: netEarnings,
    };
  }

  async requestWithdrawal(userId: number | string, payload: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const amount = Number(payload?.amount || 0);
    if (amount <= 0) throw new BadRequestException('Withdrawal amount must be greater than zero.');

    return {
      message: 'Withdrawal request created successfully.',
      request: {
        id: `withdrawal-${Date.now()}`,
        sellerId: seller.id,
        amount,
        bankDetails: payload?.bankDetails || 'Bank transfer',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    };
  }

  async getWithdrawals(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    return [];
  }
}
