import { BadRequestException, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { unlink } from 'fs/promises';
import { resolve } from 'path';

@Injectable()
export class SellersService {
  constructor(private prisma: PrismaService, private readonly notificationsService: NotificationsService) {}

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
      businessName: record.businessName || record.shopName || record.shop?.name || record.shopName,
      name: record.applicantName || record.user?.name || record.name,
      email: record.email,
      phone: record.phone,
      shopName: record.shopName || record.businessName || record.shop?.name,
      status: record.status,
      submittedAt: record.createdAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      user: record.user ? { id: record.user.id, name: record.user.name, email: record.user.email } : null,
      seller: record.seller ? { id: record.seller.id, status: record.seller.status } : null,
      documents: {
        certificateType: record.certificateType || 'id_card',
        certificateFront: record.certificateFront || null,
        certificateBack: record.certificateBack || null,
      },
    };
  }

  private async getSellerOrdersForSeller(sellerId: string) {
    const [orders, sellerProducts] = await Promise.all([
      this.prisma.order.findMany({ where: { items: { some: { sellerId } } }, include: { items: true, user: true, payment: true, shipment: true, statusHistory: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.sellerProduct.findMany({ where: { sellerId }, include: { warehouseProduct: { select: { basePrice: true } } } }),
    ]);
    const costs = new Map(sellerProducts.map((product) => [product.warehouseProductId, product.warehouseProduct.basePrice]));

    return orders.map((order) => ({
      ...order,
      items: order.items.filter((item) => item.sellerId === sellerId),
      customerName: order.user?.name ?? 'Customer',
      sellerItems: order.items.filter((item) => item.sellerId === sellerId).map((item) => {
        const unitCost = costs.get(item.warehouseProductId || '') || 0;
        return { ...item, unitCost, profit: (Number(item.price) - unitCost) * Number(item.quantity) };
      }),
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
      include: { user: true, seller: { include: { shop: true } } },
    });

    return applications.map((application) => this.serializeSellerApplication(application));
  }

  async getApplicationById(applicationId: string | number) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: String(applicationId) },
      include: { user: true, seller: { include: { shop: true } } },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    return this.serializeSellerApplication(application);
  }

  async updateApplicationStatus(applicationId: string | number, status: string) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: String(applicationId) },
      include: { user: true, seller: true },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    const normalizedStatus = String(status || 'PENDING').toUpperCase();
    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: { status: normalizedStatus },
      include: { user: true, seller: true },
    });

    if (updatedApplication.sellerId) {
      await this.prisma.seller.update({
        where: { id: updatedApplication.sellerId },
        data: {
          status: normalizedStatus === 'APPROVED' ? 'ACTIVE' : normalizedStatus === 'REJECTED' ? 'REJECTED' : 'PENDING',
        },
      });
    }

    return { message: 'Seller application status updated.', application: this.serializeSellerApplication(updatedApplication) };
  }

  async requestInformation(applicationId: string | number, message?: string, adminUserId?: string) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: String(applicationId) },
      include: { user: true, seller: true },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: { status: 'INFORMATION_REQUESTED' },
      include: { user: true, seller: true },
    });

    if (application.userId) {
      if (!application.sellerId) throw new BadRequestException('Seller profile not found for this application.');
      const conversation = await this.notificationsService.getOrCreateSellerConversation(application.sellerId, { subject: `Seller application: ${application.shopName}`, priority: 'NORMAL', category: 'SELLER' });
      await this.prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: application.userId } }, update: { role: 'SELLER' }, create: { conversationId: conversation.id, userId: application.userId, role: 'SELLER' } });

      if (message?.trim()) {
        await this.prisma.chatMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: String(adminUserId),
            senderRole: 'ADMIN',
            type: 'TEXT',
            content: message.trim(),
          },
        });
      }
    }

    return {
      message: 'Information requested from applicant.',
      application: this.serializeSellerApplication(updatedApplication),
    };
  }

  async messageApplicant(applicationId: string | number, message?: string, adminUserId?: string) {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id: String(applicationId) },
      include: { user: true, seller: true },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    if (!application.userId || !message?.trim()) {
      throw new BadRequestException('Applicant and message content are required.');
    }

    if (!application.sellerId) throw new BadRequestException('Seller profile not found for this application.');
    const conversation = await this.notificationsService.getOrCreateSellerConversation(application.sellerId, { subject: `Seller application: ${application.shopName}`, priority: 'NORMAL', category: 'SELLER' });
    await this.prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: application.userId } }, update: { role: 'SELLER' }, create: { conversationId: conversation.id, userId: application.userId, role: 'SELLER' } });

    const chatMessage = await this.prisma.chatMessage.create({
      data: {
        conversationId: conversation.id,
        senderId: String(adminUserId),
        senderRole: 'ADMIN',
        type: 'TEXT',
        content: message.trim(),
      },
    });

    return {
      message: 'Message sent to applicant.',
      conversationId: conversation.id,
      chatMessage,
      application: this.serializeSellerApplication(application),
    };
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
          transactionPasswordHash: transactionPassword ? await hash(transactionPassword, 10) : null,
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
      include: { user: true, seller: { include: { shop: true } } },
    });

    if (!application) {
      throw new BadRequestException('Seller application not found.');
    }

    const seller = application.seller ?? (application.userId
      ? await this.prisma.seller.create({
          data: {
            userId: application.userId,
            status: 'ACTIVE',
          },
          include: { user: true, shop: true },
        })
      : null);

    if (application.userId) {
      await this.prisma.user.update({
        where: { id: application.userId },
        data: { role: 'SELLER', status: 'ACTIVE' },
      });
    }

    if (seller && !seller.shop) {
      const slug = (application.shopName || 'seller-shop')
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'seller-shop';

      await this.prisma.shop.create({
        data: {
          name: application.shopName || 'Seller Shop',
          slug,
          sellerId: seller.id,
          description: 'Approved seller storefront',
        },
      });
    }

    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: application.id },
      data: { status: 'APPROVED', sellerId: seller?.id ?? application.sellerId ?? null },
      include: { user: true, seller: true },
    });

    if (seller) {
      await this.prisma.seller.update({
        where: { id: seller.id },
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
    const sellerProducts = await this.prisma.sellerProduct.findMany({
      where: { sellerId: sellerRecord.id },
      include: { warehouseProduct: true },
      orderBy: { createdAt: 'desc' },
    });
    const [pendingWithdrawals, refundRequests, openConversations, unreadNotifications, sellerReviews] = await Promise.all([
      this.prisma.withdrawal.findMany({ where: { sellerId: sellerRecord.id, status: 'PENDING' } }),
      this.prisma.refundRequest.findMany({ where: { sellerId: sellerRecord.id, status: { in: ['REQUESTED', 'PENDING'] } } }),
      this.prisma.conversation.count({ where: { sellerId: sellerRecord.id, status: { not: 'CLOSED' } } }),
      this.prisma.notification.count({ where: { userId: String(userId), readAt: null } }),
      this.prisma.review.findMany({ where: { sellerId: sellerRecord.id, status: 'APPROVED' }, select: { warehouseProductId: true, rating: true } }),
    ]);
    const subscription = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId: sellerRecord.id, status: 'ACTIVE', plan: { status: 'ACTIVE' } },
      include: { plan: true },
    });
    const getOrderStatus = (order: (typeof sellerOrders)[number]) => String(order.status || '').toUpperCase();
    const sellerItems = sellerOrders.flatMap((order) => order.sellerItems.map((item) => ({ order, item })));
    const totalSales = sellerItems.reduce((sum, entry) => sum + Number(entry.item.price || 0) * Number(entry.item.quantity || 0), 0);
    const totalProfit = sellerItems.reduce((sum, entry) => {
      const cost = sellerProducts.find((product) => product.warehouseProductId === entry.item.warehouseProductId)?.warehouseProduct.basePrice ?? 0;
      return sum + (Number(entry.item.price || 0) - Number(cost)) * Number(entry.item.quantity || 0);
    }, 0);
    const statusCount = (statuses: string[]) => sellerOrders.filter((order) => statuses.includes(getOrderStatus(order))).length;
    const pendingOrders = statusCount(['PENDING', 'NEW', 'CONFIRMED']);
    const processingOrders = statusCount(['PROCESSING', 'PACKED', 'PICKED_UP']);
    const deliveredOrders = statusCount(['DELIVERED']);
    const cancelledOrders = statusCount(['CANCELLED']);
    const onDeliveryOrders = statusCount(['SHIPPED', 'ON_DELIVERY', 'OUT_FOR_DELIVERY', 'ON_THE_WAY']);
    const pendingWithdrawal = pendingWithdrawals.reduce((sum, withdrawal) => sum + Number(withdrawal.amount || 0), 0);
    const paidWithdrawals = await this.prisma.withdrawal.aggregate({
      where: { sellerId: sellerRecord.id, status: 'PAID' },
      _sum: { amount: true },
    });
    const availableBalance = Math.max(0, totalProfit - Number(paidWithdrawals._sum.amount || 0) - pendingWithdrawal);
    const lowStockProducts = sellerProducts.filter((product) => product.warehouseProduct.stock <= 5).length;

    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfYesterday = new Date(startOfDay);
    startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const startOfYear = new Date(today.getFullYear(), 0, 1);
    const monthOrders = sellerOrders.filter((order) => order.createdAt >= startOfMonth);
    const monthStatusCount = (statuses: string[]) => monthOrders.filter((order) => statuses.includes(getOrderStatus(order))).length;
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    const bucketSales = (start: Date, unit: 'day' | 'week' | 'month' | 'year') => {
      const buckets = new Map<string, { label: string; revenue: number; profit: number; orders: number }>();
      sellerItems.filter(({ order }) => order.createdAt >= start).forEach(({ order, item }) => {
        const date = new Date(order.createdAt);
        const key = unit === 'year'
          ? `${date.getFullYear()}`
          : unit === 'month'
            ? `${date.getFullYear()}-${date.getMonth()}`
            : unit === 'week'
            ? `${date.getFullYear()}-${Math.floor((date.getTime() - startOfYear.getTime()) / (7 * 86400000))}`
            : `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        const current = buckets.get(key) || { label: unit === 'year' ? String(date.getFullYear()) : unit === 'month' ? date.toLocaleDateString('en-US', { month: 'short' }) : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), revenue: 0, profit: 0, orders: 0 };
        const revenue = Number(item.price || 0) * Number(item.quantity || 0);
        const cost = sellerProducts.find((product) => product.warehouseProductId === item.warehouseProductId)?.warehouseProduct.basePrice ?? 0;
        current.revenue += revenue;
        current.profit += (Number(item.price || 0) - Number(cost)) * Number(item.quantity || 0);
        current.orders += 1;
        buckets.set(key, current);
      });
      return [...buckets.values()];
    };
    const daily = bucketSales(startOfDay, 'day');
    const weekly = bucketSales(startOfWeek, 'week');
    const monthly = bucketSales(new Date(today.getFullYear(), today.getMonth() - 11, 1), 'month');
    const yearly = bucketSales(new Date(today.getFullYear() - 4, 0, 1), 'year');
    const revenueBetween = (start: Date, end?: Date) => sellerItems
      .filter(({ order }) => order.createdAt >= start && (!end || order.createdAt < end))
      .reduce((sum, entry) => sum + Number(entry.item.price || 0) * Number(entry.item.quantity || 0), 0);
    const productRatings = new Map<string, number[]>();
    sellerReviews.forEach((review) => {
      if (review.warehouseProductId) productRatings.set(review.warehouseProductId, [...(productRatings.get(review.warehouseProductId) || []), review.rating]);
    });
    const averageRating = sellerReviews.length
      ? sellerReviews.reduce((sum, review) => sum + review.rating, 0) / sellerReviews.length
      : null;
    const firstProductImage = (images: string, thumbnail?: string | null) => {
      if (thumbnail) return thumbnail;
      try {
        const parsed = JSON.parse(images || '[]');
        return Array.isArray(parsed) && typeof parsed[0] === 'string' ? parsed[0] : null;
      } catch {
        return null;
      }
    };
    const productPerformance = sellerProducts.map((product) => {
      const productItems = sellerItems.filter(({ item }) => item.warehouseProductId === product.warehouseProductId);
      const revenue = productItems.reduce((sum, entry) => sum + Number(entry.item.price || 0) * Number(entry.item.quantity || 0), 0);
      const ratings = productRatings.get(product.warehouseProductId) || [];
      return { id: product.id, name: product.warehouseProduct.name, units: productItems.reduce((sum, entry) => sum + Number(entry.item.quantity || 0), 0), revenue, profit: productItems.reduce((sum, entry) => sum + (Number(entry.item.price || 0) - product.warehouseProduct.basePrice) * Number(entry.item.quantity || 0), 0), stock: product.warehouseProduct.stock, price: product.sellingPrice, rating: ratings.length ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length : null, image: firstProductImage(product.warehouseProduct.images, product.warehouseProduct.thumbnail) };
    }).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
    const recentOrders = sellerOrders.slice(0, 10).map((order) => {
      const items = order.sellerItems;
      const amount = items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0);
      const profit = items.reduce((sum, item) => {
        const cost = sellerProducts.find((product) => product.warehouseProductId === item.warehouseProductId)?.warehouseProduct.basePrice ?? 0;
        return sum + (Number(item.price || 0) - Number(cost)) * Number(item.quantity || 0);
      }, 0);
      return { id: order.id, customer: order.customerName, products: items.map((item) => `${item.name} x${item.quantity}`).join(', '), amount, profit, paymentStatus: order.payment?.status ?? 'PENDING', pickupStatus: order.shipment?.status ?? 'PENDING', deliveryStatus: getOrderStatus(order), date: order.createdAt, canProcess: ['PENDING', 'NEW', 'CONFIRMED'].includes(getOrderStatus(order)), canContact: Boolean(order.user?.email) };
    });

    return {
      shop: {
        name: sellerRecord.shop?.name ?? 'Seller Shop',
        role: 'Seller',
        rating: averageRating,
        verified: sellerRecord.status === 'ACTIVE',
      },
      rating: averageRating,
      verified: sellerRecord.status === 'ACTIVE',
      products: sellerProducts.length,
      totalOrders: sellerOrders.length,
      totalSales,
      todayViews: null,
      sales: {
        today: daily.reduce((sum, item) => sum + item.revenue, 0),
        yesterday: revenueBetween(startOfYesterday, startOfDay),
        currentMonth: revenueBetween(startOfMonth),
        lastMonth: revenueBetween(startOfLastMonth, startOfMonth),
      },
      categoryCounts: [...sellerProducts.reduce((categories, product) => categories.set(product.warehouseProduct.category || 'Other', (categories.get(product.warehouseProduct.category || 'Other') || 0) + 1), new Map<string, number>())].map(([name, count]) => ({ name, count })),
      orders: {
        newOrder: pendingOrders,
        pending: pendingOrders,
        processing: processingOrders,
        cancelled: cancelledOrders,
        onDelivery: onDeliveryOrders,
        delivered: deliveredOrders,
        thisMonth: {
          newOrder: monthStatusCount(['PENDING', 'NEW', 'CONFIRMED']),
          cancelled: monthStatusCount(['CANCELLED']),
          onDelivery: monthStatusCount(['SHIPPED', 'ON_DELIVERY', 'OUT_FOR_DELIVERY', 'ON_THE_WAY']),
          delivered: monthStatusCount(['DELIVERED']),
        },
      },
      package: subscription?.plan ? { id: subscription.plan.id, name: subscription.plan.name, uploadLimit: subscription.plan.productLimit, price: subscription.plan.price, active: true } : null,
      topProducts: productPerformance.map((product) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
      })),
      statistics: {
        products: sellerProducts.length,
        totalOrders: sellerOrders.length,
        totalSales,
        todayViews: null,
      },
      kpis: {
        totalOrders: sellerOrders.length,
        pendingOrders,
        processingOrders,
        deliveredOrders,
        totalSales,
        totalProfit,
        availableBalance,
        pendingWithdrawal,
        totalProducts: sellerProducts.length,
        lowStockProducts,
        customerMessages: openConversations,
        pendingRefunds: refundRequests.length,
        unreadNotifications,
      },
      charts: { daily, weekly, monthly, yearly, orders: [...new Set(sellerOrders.map(getOrderStatus))].map((status) => ({ status, count: sellerOrders.filter((order) => getOrderStatus(order) === status).length })), revenueProfit: monthly, productPerformance },
      recentOrders,
      packageInfo: subscription?.plan ? {
        name: subscription.plan.name,
        uploadLimit: subscription.plan.productLimit,
        expiresAt: subscription.expiresAt?.toISOString() ?? null,
      } : undefined,
    };
  }

  async getSellerProducts(userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: true, user: true } });
    if (!seller) return [];

    const [products, sales, reviews] = await Promise.all([
      this.prisma.sellerProduct.findMany({ where: { sellerId: seller.id }, include: { warehouseProduct: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.orderItem.findMany({ where: { sellerId: seller.id }, select: { warehouseProductId: true, quantity: true } }),
      this.prisma.review.findMany({ where: { sellerId: seller.id }, select: { warehouseProductId: true, rating: true } }),
    ]);
    const salesByProduct = new Map<string, number>();
    sales.forEach((item) => item.warehouseProductId && salesByProduct.set(item.warehouseProductId, (salesByProduct.get(item.warehouseProductId) || 0) + item.quantity));
    const ratingsByProduct = new Map<string, number[]>();
    reviews.forEach((review) => review.warehouseProductId && ratingsByProduct.set(review.warehouseProductId, [...(ratingsByProduct.get(review.warehouseProductId) || []), review.rating]));

    return products.map((product) => ({
      ...product,
      id: product.id,
      warehouseProductId: product.warehouseProductId,
      name: product.warehouseProduct.name,
      slug: product.warehouseProduct.slug,
      description: product.warehouseProduct.description,
      shortDescription: product.warehouseProduct.shortDescription,
      sku: product.warehouseProduct.sku,
      price: product.sellingPrice,
      basePrice: product.warehouseProduct.basePrice,
      salePrice: product.warehouseProduct.salePrice,
      stock: product.warehouseProduct.stock,
      category: product.warehouseProduct.category,
      subcategory: product.warehouseProduct.subcategory,
      brand: product.warehouseProduct.brand,
      images: JSON.parse(product.warehouseProduct.images || '[]'),
      thumbnail: product.warehouseProduct.thumbnail,
      minimumOrder: product.warehouseProduct.minimumOrder,
      maximumOrder: product.warehouseProduct.maximumOrder,
      weight: product.warehouseProduct.weight,
      dimensions: product.warehouseProduct.dimensions,
      shippingInformation: product.warehouseProduct.shippingInformation,
      attributes: JSON.parse(product.warehouseProduct.attributes || '[]'),
      variants: JSON.parse(product.warehouseProduct.variants || '[]'),
      discount: product.warehouseProduct.salePrice && product.sellingPrice > product.warehouseProduct.salePrice ? Math.round((1 - product.warehouseProduct.salePrice / product.sellingPrice) * 100) : 0,
      sales: salesByProduct.get(product.warehouseProductId) || 0,
      rating: (ratingsByProduct.get(product.warehouseProductId) || []).reduce((sum, rating) => sum + rating, 0) / Math.max((ratingsByProduct.get(product.warehouseProductId) || []).length, 1),
      status: product.status,
    }));
  }

  async getSellerUploads(userId: string | number, query: { page?: string | number; limit?: string | number; search?: string; type?: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 24), 1), 100);
    const search = String(query.search || '').trim();
    const where: any = { sellerId: seller.id };
    if (search) where.filename = { contains: search };
    if (query.type) where.mimeType = String(query.type);
    const [items, total, types] = await Promise.all([
      this.prisma.uploadedFile.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.uploadedFile.count({ where }),
      this.prisma.uploadedFile.findMany({ where: { sellerId: seller.id }, distinct: ['mimeType'], select: { mimeType: true } }),
    ]);
    return { items, page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)), types: types.map((item) => item.mimeType) };
  }

  async createSellerUpload(userId: string | number, file: { originalname: string; filename: string; mimetype: string; size: number }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const publicUrl = `${process.env.API_PUBLIC_URL || 'http://127.0.0.1:4003'}/api/seller/uploads/file/${file.filename}`;
    return this.prisma.uploadedFile.create({ data: { sellerId: seller.id, filename: file.originalname, storedName: file.filename, mimeType: file.mimetype, size: file.size, url: publicUrl } });
  }

  async getSellerUploadPath(userId: string | number, storedName: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, select: { id: true } });
    const file = seller ? await this.prisma.uploadedFile.findFirst({ where: { sellerId: seller.id, storedName } }) : null;
    if (!file) throw new BadRequestException('Uploaded file not found.');
    return resolve(__dirname, '../uploads', file.storedName);
  }

  async deleteSellerUpload(userId: string | number, id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const file = seller ? await this.prisma.uploadedFile.findFirst({ where: { id, sellerId: seller.id } }) : null;
    if (!file) throw new BadRequestException('Uploaded file not found.');
    await this.prisma.uploadedFile.delete({ where: { id: file.id } });
    await unlink(resolve(__dirname, '../uploads', file.storedName)).catch(() => undefined);
    return { success: true, message: 'File deleted successfully.' };
  }

  async getSellerReviews(userId: string | number, query: { page?: string | number; limit?: string | number; search?: string; rating?: string | number; productId?: string; from?: string; to?: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller account not found.');
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
    const search = String(query.search || '').trim();
    const where: any = { sellerId: seller.id };
    if (query.rating) where.rating = Number(query.rating);
    if (query.productId) where.warehouseProductId = String(query.productId);
    if (query.from || query.to) where.createdAt = { ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}), ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}) };
    if (search) where.OR = [{ text: { contains: search } }, { title: { contains: search } }, { customer: { name: { contains: search } } }, { warehouseProduct: { name: { contains: search } } }];
    const [reviews, total, products] = await Promise.all([
      this.prisma.review.findMany({ where, include: { customer: true, warehouseProduct: true, replies: { include: { author: true }, orderBy: { createdAt: 'asc' } }, reports: true }, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }),
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({ where: { sellerId: seller.id }, distinct: ['warehouseProductId'], select: { warehouseProductId: true, warehouseProduct: { select: { name: true } } } }),
    ]);
    return {
      items: reviews.map((review) => ({ id: review.id, customer: { id: review.customerId, name: review.customer.name, email: review.customer.email }, product: { id: review.warehouseProductId || review.productId || '', name: review.warehouseProduct?.name || 'Product' }, rating: review.rating, title: review.title, text: review.text, images: JSON.parse(review.images || '[]'), date: review.createdAt, status: review.status, replies: review.replies.map((reply) => ({ id: reply.id, authorId: reply.authorId, authorName: reply.author.name, text: reply.text, date: reply.createdAt, isSeller: reply.authorId === String(userId) })), reportCount: review.reports.length })),
      products: products.filter((product) => product.warehouseProductId).map((product) => ({ id: product.warehouseProductId as string, name: product.warehouseProduct?.name || 'Product' })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async replyToSellerReview(reviewId: string, userId: string | number, text?: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const review = seller ? await this.prisma.review.findFirst({ where: { id: reviewId, sellerId: seller.id } }) : null;
    const message = String(text || '').trim();
    if (!review) throw new BadRequestException('Review not found for this seller.');
    if (!message) throw new BadRequestException('Reply text is required.');
    if (message.length > 2000) throw new BadRequestException('Reply must be 2000 characters or fewer.');
    return this.prisma.reviewReply.create({ data: { reviewId: review.id, authorId: String(userId), text: message }, include: { author: true } });
  }

  async reportSellerReview(reviewId: string, userId: string | number, reason?: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const review = seller ? await this.prisma.review.findFirst({ where: { id: reviewId, sellerId: seller.id } }) : null;
    if (!review) throw new BadRequestException('Review not found for this seller.');
    const report = await this.prisma.reviewReport.create({ data: { reviewId: review.id, reporterId: String(userId), reason: String(reason || 'Seller reported this review.').trim() } });
    await this.prisma.review.update({ where: { id: review.id }, data: { reportCount: { increment: 1 } } });
    return report;
  }

  async getAllOrders() {
    return this.prisma.order.findMany({
      include: { items: true, payment: true, shipment: true, statusHistory: true, user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSellerProduct(id: string | number, userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop) throw new BadRequestException('Active seller shop not found.');
    const product = seller ? await this.prisma.sellerProduct.findFirst({
      where: { id: String(id), sellerId: seller.id, shopId: seller.shop.id },
      include: { warehouseProduct: true },
    }) : null;

    if (!product) {
      throw new BadRequestException('Product not found.');
    }

    return {
      ...product,
      name: product.warehouseProduct.name,
      price: product.sellingPrice,
      sellerMargin: product.sellerMargin,
      images: JSON.parse(product.warehouseProduct.images || '[]'),
    };
  }

  async createSellerProduct(userId: number | string, payload: any) {
    void userId;
    void payload;
    throw new BadRequestException('Seller products must be added from the warehouse storehouse.');
  }

  async updateSellerProduct(id: string | number, userId: string | number, payload: any) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop) throw new BadRequestException('Active seller shop not found.');
    const product = await this.prisma.sellerProduct.findFirst({ where: { id: String(id), sellerId: seller.id, shopId: seller.shop.id }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product not found.');

    if (payload.price !== undefined && Number(payload.price) < 0) throw new BadRequestException('Price cannot be negative.');
    if (payload.sellerMargin !== undefined && Number(payload.sellerMargin) < 0) throw new BadRequestException('Seller margin cannot be negative.');
    if (payload.salePrice !== undefined && payload.salePrice !== '' && Number(payload.salePrice) > Number(payload.price ?? product.warehouseProduct.basePrice)) throw new BadRequestException('Sale price cannot exceed price.');
    return this.prisma.$transaction(async (transaction) => {
      return transaction.sellerProduct.update({ where: { id: product.id }, data: { ...(payload.sellingPrice !== undefined ? { sellingPrice: Number(payload.sellingPrice) } : {}), ...(payload.price !== undefined ? { sellingPrice: Number(payload.price) } : {}), ...(payload.salePrice !== undefined ? { sellingPrice: Number(payload.salePrice || payload.price) } : {}), ...(payload.sellerMargin !== undefined ? { sellerMargin: Number(payload.sellerMargin) } : {}), ...(payload.status !== undefined ? { status: payload.status } : {}) }, include: { warehouseProduct: true } });
    });
  }

  async bulkUpdateSellerProducts(userId: string | number, payload: { ids: string[]; action: 'activate' | 'deactivate' | 'delete' | 'stock'; stock?: number }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop || !payload.ids?.length) throw new BadRequestException('An active seller shop and at least one product are required.');
    const products = await this.prisma.sellerProduct.findMany({ where: { sellerId: seller.id, shopId: seller.shop.id, id: { in: payload.ids } } });
    if (products.length !== payload.ids.length) throw new BadRequestException('One or more products do not belong to this seller.');
    if (payload.action === 'delete') await this.prisma.sellerProduct.deleteMany({ where: { sellerId: seller.id, shopId: seller.shop.id, id: { in: payload.ids } } });
    else if (payload.action === 'stock') throw new BadRequestException('Warehouse stock is managed by marketplace administrators.');
    else await this.prisma.sellerProduct.updateMany({ where: { sellerId: seller.id, shopId: seller.shop.id, id: { in: payload.ids } }, data: { status: payload.action === 'activate' ? 'ACTIVE' : 'INACTIVE' } });
    return { success: true, updated: payload.ids.length };
  }

  async deleteSellerProduct(id: string | number, userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop) throw new BadRequestException('Active seller shop not found.');
    const product = await this.prisma.sellerProduct.findFirst({ where: { id: String(id), sellerId: seller.id, shopId: seller.shop.id } });
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
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: true, user: true } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const name = String(payload?.name || '').trim();
    const slug = String(payload?.slug || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    if (!name || !slug) throw new BadRequestException('Shop name and slug are required.');
    if (payload.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(payload.contactEmail))) throw new BadRequestException('Enter a valid contact email.');
    const settings = {
      name, slug, description: payload.description || null, logo: payload.logo || null, banner: payload.banner || null,
      contactEmail: payload.contactEmail || null, contactPhone: payload.contactPhone || null, country: payload.country || null, state: payload.state || null, city: payload.city || null, address: payload.address || null, postalCode: payload.postalCode || null,
      facebook: payload.facebook || null, instagram: payload.instagram || null, tiktok: payload.tiktok || null, youtube: payload.youtube || null,
      businessInformation: payload.businessInformation || null, returnPolicy: payload.returnPolicy || null, shippingPolicy: payload.shippingPolicy || null,
      metaTitle: payload.metaTitle || null, metaDescription: payload.metaDescription || null, keywords: payload.keywords || null,
    };

    if (!seller.shop) {
      return this.prisma.shop.create({ data: { ...settings, sellerId: seller.id } });
    }

    try {
      return await this.prisma.shop.update({ where: { id: seller.shop.id }, data: settings });
    } catch (error: any) {
      if (error?.code === 'P2002') throw new BadRequestException('That shop slug is already in use.');
      throw error;
    }
  }

  async getSellerOrders(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) return [];

    return this.getSellerOrdersForSeller(seller.id);
  }

  async getSellerRefunds(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) return [];

    return this.prisma.refundRequest.findMany({
      where: { sellerId: seller.id },
      include: { order: { include: { items: true } }, customer: true, payment: true },
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getSellerSupportTickets(userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    return this.prisma.conversation.findMany({ where: { sellerId: seller.id, type: 'SELLER_TICKET' }, include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 }, participants: { include: { user: { select: { id: true, name: true, email: true } } } } }, orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }] });
  }

  async createSellerSupportTicket(userId: string | number, payload: { subject?: string; category?: string; priority?: string; description?: string; attachmentUrl?: string; attachmentName?: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) }, include: { shop: true, user: true } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const subject = String(payload.subject || '').trim();
    const description = String(payload.description || '').trim();
    if (!subject || !description) throw new BadRequestException('Subject and description are required.');
    const priority = String(payload.priority || 'NORMAL').toUpperCase();
    if (!['LOW', 'NORMAL', 'HIGH', 'URGENT'].includes(priority)) throw new BadRequestException('Invalid ticket priority.');
    const conversation = await this.prisma.conversation.findFirst({ where: { type: 'SELLER_TICKET', sellerId: seller.id }, orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'asc' }] }) || await this.prisma.conversation.create({ data: { type: 'SELLER_TICKET', sellerId: seller.id, shopId: seller.shop?.id, subject, category: String(payload.category || 'GENERAL').toUpperCase(), priority, status: 'OPEN', lastMessageAt: new Date() } });
    await this.prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: String(userId) } }, update: { role: 'SELLER' }, create: { conversationId: conversation.id, userId: String(userId), role: 'SELLER' } });
    const message = await this.prisma.chatMessage.create({ data: { conversationId: conversation.id, senderId: String(userId), senderRole: 'SELLER', type: payload.attachmentUrl ? (String(payload.attachmentUrl).startsWith('data:image') ? 'IMAGE' : 'FILE') : 'TEXT', content: description, attachmentUrl: payload.attachmentUrl || null, attachmentName: payload.attachmentName || null } });
    await this.prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: message.createdAt, updatedAt: message.createdAt } });
    await this.notificationsService.notifyAdmins({ type: 'CHAT_MESSAGE', title: `New message from ${seller.user?.name || 'seller'}`, message: description, entityId: conversation.id, entityType: 'CONVERSATION' });
    return { ...conversation, message };
  }

  async updateSellerRefund(id: string, userId: string | number, status?: string, sellerNote?: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    const refund = seller ? await this.prisma.refundRequest.findFirst({ where: { id, sellerId: seller.id } }) : null;
    if (!refund) throw new BadRequestException('Refund request not found.');
    const current = String(refund.status).toUpperCase();
    const requested = status ? String(status).toUpperCase() : current;
    const transitions: Record<string, string[]> = { REQUESTED: ['APPROVED', 'REJECTED'], PENDING: ['APPROVED', 'REJECTED'], APPROVED: ['PROCESSING', 'COMPLETED'], PROCESSING: ['COMPLETED'], REJECTED: [], COMPLETED: [] };
    if (status && !transitions[current]?.includes(requested)) throw new BadRequestException(`Cannot move refund from ${current} to ${requested}.`);
    if (sellerNote !== undefined && !String(sellerNote).trim()) throw new BadRequestException('Refund note cannot be empty.');
    return this.prisma.refundRequest.update({ where: { id: refund.id }, data: { ...(status ? { status: requested } : {}), ...(sellerNote !== undefined ? { sellerNote: String(sellerNote).trim() } : {}), ...(status && ['COMPLETED', 'REJECTED'].includes(requested) ? { processedAt: new Date() } : {}) }, include: { order: true, customer: true, payment: true } });
  }

  async getSellerOrder(id: number | string, userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const order = await this.prisma.order.findFirst({
      where: { id: String(id), items: { some: { sellerId: seller.id } } },
      include: { items: true, user: true, payment: true, shipment: true, statusHistory: true },
    });

    if (!order) throw new BadRequestException('Order not found.');
    const sellerProducts = await this.prisma.sellerProduct.findMany({ where: { sellerId: seller.id }, include: { warehouseProduct: { select: { basePrice: true } } } });
    const costs = new Map(sellerProducts.map((product) => [product.warehouseProductId, product.warehouseProduct.basePrice]));
    const sellerItems = order.items.filter((item) => item.sellerId === seller.id).map((item) => {
      const unitCost = costs.get(item.warehouseProductId || '') || 0;
      return { ...item, unitCost, profit: (Number(item.price) - unitCost) * Number(item.quantity) };
    });
    return { ...order, items: sellerItems, customerName: order.user?.name ?? 'Customer', sellerItems, sellerSubtotal: sellerItems.reduce((sum, item) => sum + item.price * item.quantity, 0), sellerProfit: sellerItems.reduce((sum, item) => sum + item.profit, 0) };
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

    const orderItems = await this.prisma.orderItem.findMany({ where: { orderId: order.id }, select: { sellerId: true } });
    if (orderItems.some((item) => item.sellerId !== seller.id)) {
      throw new BadRequestException('Mixed-seller orders must be managed by marketplace administrators.');
    }

    const transitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      NEW: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PROCESSING', 'CANCELLED'],
      PROCESSING: ['READY_FOR_PICKUP', 'CANCELLED'],
      READY_FOR_PICKUP: ['PICKED_UP'],
      PICKED_UP: ['ON_DELIVERY'],
      ON_DELIVERY: ['DELIVERED'],
      SHIPPED: ['ON_DELIVERY'],
      DELIVERED: [],
      CANCELLED: [],
      REFUND_REQUESTED: ['REFUNDED'],
      REFUNDED: [],
    };
    const normalizedStatus = String(status || '').toUpperCase();
    if (!Object.values(transitions).some((values) => values.includes(normalizedStatus)) && !Object.prototype.hasOwnProperty.call(transitions, normalizedStatus)) {
      throw new BadRequestException('Invalid order status.');
    }
    const currentStatus = String(order.status || 'PENDING').toUpperCase();
    if (!transitions[currentStatus]?.includes(normalizedStatus)) throw new BadRequestException(`Cannot move an order from ${currentStatus} to ${normalizedStatus}.`);

    return this.prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: normalizedStatus,
          note: `Status updated to ${normalizedStatus}`,
        },
      });

      await tx.shipment.updateMany({
        where: { orderId: order.id },
        data: { status: normalizedStatus === 'PICKED_UP' ? 'PICKED_UP' : normalizedStatus === 'ON_DELIVERY' ? 'ON_DELIVERY' : normalizedStatus === 'DELIVERED' ? 'DELIVERED' : undefined },
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

  async getPackages(userId?: string | number) {
    const packages = await this.prisma.subscriptionPlan.findMany({ where: { status: 'ACTIVE' }, orderBy: { price: 'asc' } });
    const seller = userId ? await this.prisma.seller.findUnique({ where: { userId: String(userId) } }) : null;
    const subscription = seller ? await this.prisma.sellerSubscription.findUnique({ where: { sellerId: seller.id }, include: { plan: true } }) : null;
    return {
      packages: packages.map((plan) => ({ ...plan, uploadLimit: plan.productLimit, features: JSON.parse(plan.features || '[]'), current: subscription?.planId === plan.id && subscription.status === 'ACTIVE' })),
      currentPackage: subscription ? { ...subscription.plan, uploadLimit: subscription.plan.productLimit, features: JSON.parse(subscription.plan.features || '[]'), subscriptionId: subscription.id, startsAt: subscription.startsAt, expiresAt: subscription.expiresAt, status: subscription.status } : null,
    };
  }

  async purchasePackage(packageId: number | string, userId: number | string, action: 'purchase' | 'upgrade' | 'renew' = 'purchase') {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const selected = await this.prisma.subscriptionPlan.findFirst({ where: { id: String(packageId), status: 'ACTIVE' } });
    if (!selected) throw new BadRequestException('Package not found.');

    const current = await this.prisma.sellerSubscription.findUnique({ where: { sellerId: seller.id } });
    if (action === 'purchase' && current?.status === 'ACTIVE' && current.planId === selected.id) throw new BadRequestException('This package is already active for your seller account.');
    if (action === 'upgrade' && current?.status === 'ACTIVE' && selected.price <= (await this.prisma.subscriptionPlan.findUnique({ where: { id: current.planId } }))?.price!) throw new BadRequestException('Upgrade must select a package with a higher price.');

    const now = new Date();
    const baseDate = action === 'renew' && current?.expiresAt && current.expiresAt > now ? current.expiresAt : now;
    const subscription = await this.prisma.sellerSubscription.upsert({
      where: { sellerId: seller.id },
      update: { planId: selected.id, startsAt: action === 'renew' && current ? current.startsAt : now, expiresAt: new Date(baseDate.getTime() + selected.duration * 24 * 60 * 60 * 1000), status: 'ACTIVE' },
      create: { sellerId: seller.id, planId: selected.id, startsAt: now, expiresAt: new Date(now.getTime() + selected.duration * 24 * 60 * 60 * 1000), status: 'ACTIVE' },
      include: { plan: true },
    });
    const purchase = await this.prisma.sellerSubscriptionPurchase.create({
      data: {
        sellerId: seller.id,
        planId: selected.id,
        amount: selected.price,
        paymentMethod: 'MANUAL',
        status: 'COMPLETED',
        action: action.toUpperCase(),
        purchasedAt: now,
        expiresAt: subscription.expiresAt,
      },
      include: { plan: true },
    });

    return { message: action === 'renew' ? 'Package renewed successfully.' : action === 'upgrade' ? 'Package upgraded successfully.' : 'Package purchased successfully.', package: selected, subscription, purchase, userId };
  }

  async getSellerSubscriptionPurchases(userId: string | number, query: { status?: string; packageId?: string; from?: string; to?: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const where: any = { sellerId: seller.id };
    if (query.status) where.status = String(query.status).toUpperCase();
    if (query.packageId) where.planId = String(query.packageId);
    if (query.from || query.to) where.purchasedAt = { ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}), ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}) };
    const [purchases, packages] = await Promise.all([
      this.prisma.sellerSubscriptionPurchase.findMany({ where, include: { plan: true }, orderBy: { purchasedAt: 'desc' } }),
      this.prisma.sellerSubscriptionPurchase.findMany({ where: { sellerId: seller.id }, distinct: ['planId'], select: { planId: true, plan: { select: { name: true } } } }),
    ]);
    return {
      items: purchases.map((purchase) => ({ id: purchase.id, transactionId: purchase.id, package: { id: purchase.planId, name: purchase.plan.name }, amount: purchase.amount, paymentMethod: purchase.paymentMethod, status: purchase.status, action: purchase.action, purchaseDate: purchase.purchasedAt, expiryDate: purchase.expiresAt })),
      packages: packages.map((item) => ({ id: item.planId, name: item.plan.name })),
    };
  }

  async getTrafficPackages() {
    const packages = await this.prisma.sellerPackage.findMany({ where: { status: 'ACTIVE' }, orderBy: { price: 'asc' } });
    return packages.map((item) => ({ ...item, features: JSON.parse(item.features || '[]') }));
  }

  async purchaseTrafficPackage(packageId: string, userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const selected = await this.prisma.sellerPackage.findFirst({ where: { id: packageId, status: 'ACTIVE' } });
    if (!selected) throw new BadRequestException('Traffic package not found.');
    const purchase = await this.prisma.sellerPackagePurchase.create({ data: { sellerId: seller.id, packageId: selected.id, amount: selected.price, paymentMethod: 'MANUAL', status: 'ACTIVE', startsAt: new Date(), expiresAt: new Date(Date.now() + selected.duration * 24 * 60 * 60 * 1000) }, include: { package: true } });
    return { message: 'Traffic package purchased successfully.', package: { ...selected, features: JSON.parse(selected.features || '[]') }, purchase };
  }

  async getTrafficPackagePurchases(userId: string | number, query: { status?: string; packageId?: string; from?: string; to?: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const where: any = { sellerId: seller.id };
    if (query.status) where.status = String(query.status).toUpperCase();
    if (query.packageId) where.packageId = String(query.packageId);
    if (query.from || query.to) where.createdAt = { ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}), ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}) };
    const [purchases, packages] = await Promise.all([
      this.prisma.sellerPackagePurchase.findMany({ where, include: { package: true }, orderBy: { createdAt: 'desc' } }),
      this.prisma.sellerPackagePurchase.findMany({ where: { sellerId: seller.id }, distinct: ['packageId'], select: { packageId: true, package: { select: { name: true } } } }),
    ]);
    return {
      items: purchases.map((purchase) => ({ id: purchase.id, transactionId: purchase.id, package: { id: purchase.packageId, name: purchase.package.name }, amount: purchase.amount || purchase.package.price, trafficAmount: purchase.package.trafficLimit, paymentMethod: purchase.paymentMethod, status: purchase.status, purchaseDate: purchase.createdAt, expiryDate: purchase.expiresAt })),
      packages: packages.map((item) => ({ id: item.packageId, name: item.package.name })),
    };
  }

  async getSellerCommissionHistory(userId: string | number, query: { page?: string | number; limit?: string | number; status?: string; from?: string; to?: string; search?: string }) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const orders = await this.getSellerOrdersForSeller(seller.id);
    const rows = orders.flatMap((order) => {
      const gross = order.sellerItems.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
      const orderGross = order.items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0) || gross;
      const commission = Number(order.payment?.commission || 0) * (gross / orderGross);
      return [{ id: `${order.id}-${seller.id}`, transaction: order.payment?.transactionId || order.payment?.id || order.id, order: order.id, product: order.sellerItems.map((item) => `${item.name} x${item.quantity}`).join(', '), grossAmount: gross, commission, sellerEarnings: gross - commission, status: String(order.payment?.status || 'PENDING').toUpperCase() === 'PAID' ? 'PAID' : 'PENDING', date: order.createdAt }];
    });
    const search = String(query.search || '').trim().toLowerCase();
    const from = query.from ? new Date(`${query.from}T00:00:00.000Z`).getTime() : Number.NEGATIVE_INFINITY;
    const to = query.to ? new Date(`${query.to}T23:59:59.999Z`).getTime() : Number.POSITIVE_INFINITY;
    const filtered = rows.filter((row) => (!query.status || row.status === String(query.status).toUpperCase()) && (!search || row.transaction.toLowerCase().includes(search) || row.order.toLowerCase().includes(search) || row.product.toLowerCase().includes(search)) && new Date(row.date).getTime() >= from && new Date(row.date).getTime() <= to);
    const currentPeriodStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
    const sum = (items: typeof rows) => items.reduce((total, row) => total + row.commission, 0);
    const page = Math.max(Number(query.page || 1), 1);
    const limit = Math.min(Math.max(Number(query.limit || 10), 1), 50);
    return { items: filtered.slice((page - 1) * limit, page * limit), page, limit, total: filtered.length, totalPages: Math.max(1, Math.ceil(filtered.length / limit)), summary: { totalCommission: sum(rows), pendingCommission: sum(rows.filter((row) => row.status === 'PENDING')), paidCommission: sum(rows.filter((row) => row.status === 'PAID')), currentPeriod: sum(rows.filter((row) => new Date(row.date).getTime() >= currentPeriodStart)) } };
  }

  async getAffiliateDashboard(userId: string | number) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    const affiliate = await this.prisma.affiliateProfile.upsert({ where: { sellerId: seller.id }, update: {}, create: { sellerId: seller.id, code: `SELLER-${seller.id.slice(0, 8).toUpperCase()}` } });
    const [registrations, conversions, pending, paid, referrals, commissions] = await Promise.all([
      this.prisma.affiliateReferral.count({ where: { affiliateId: affiliate.id } }),
      this.prisma.affiliateReferral.count({ where: { affiliateId: affiliate.id, status: 'CONVERTED' } }),
      this.prisma.affiliateCommission.aggregate({ where: { affiliateId: affiliate.id, status: 'PENDING' }, _sum: { amount: true } }),
      this.prisma.affiliateCommission.aggregate({ where: { affiliateId: affiliate.id, status: 'PAID' }, _sum: { amount: true } }),
      this.prisma.affiliateReferral.findMany({ where: { affiliateId: affiliate.id }, orderBy: { registeredAt: 'desc' }, take: 20 }),
      this.prisma.affiliateCommission.findMany({ where: { affiliateId: affiliate.id }, include: { referral: true }, orderBy: { createdAt: 'desc' }, take: 20 }),
    ]);
    const chart = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index), 1);
      return { label: date.toLocaleDateString('en-US', { month: 'short' }), clicks: 0, registrations: 0, conversions: 0, earnings: 0 };
    });
    referrals.forEach((referral) => { const bucket = chart.find((item) => item.label === new Date(referral.registeredAt).toLocaleDateString('en-US', { month: 'short' })); if (bucket) { bucket.registrations += 1; if (referral.status === 'CONVERTED') bucket.conversions += 1; } });
    commissions.forEach((commission) => { const bucket = chart.find((item) => item.label === new Date(commission.createdAt).toLocaleDateString('en-US', { month: 'short' })); if (bucket) bucket.earnings += commission.amount; });
    return {
      affiliateLink: affiliate.code,
      affiliateCode: affiliate.code,
      clicks: affiliate.clicks,
      registrations,
      conversions,
      earnings: Number(pending._sum.amount || 0) + Number(paid._sum.amount || 0),
      pendingEarnings: Number(pending._sum.amount || 0),
      paidEarnings: Number(paid._sum.amount || 0),
      chart,
      referrals: referrals.map((referral) => ({ id: referral.id, name: referral.customerName || 'Anonymous visitor', email: referral.customerEmail || '—', status: referral.status, date: referral.registeredAt, convertedAt: referral.convertedAt })),
      commissionHistory: commissions.map((commission) => ({ id: commission.id, amount: commission.amount, status: commission.status, orderId: commission.orderId, date: commission.createdAt, paidAt: commission.paidAt, referral: commission.referral?.customerEmail || '—' })),
    };
  }

  async trackAffiliateClick(code: string) {
    const affiliate = await this.prisma.affiliateProfile.update({ where: { code: String(code).trim() }, data: { clicks: { increment: 1 } } });
    return { success: true, affiliateId: affiliate.id };
  }

  async registerAffiliateReferral(code: string, payload: { customerName?: string; customerEmail?: string }) {
    const affiliate = await this.prisma.affiliateProfile.findUnique({ where: { code: String(code).trim() } });
    if (!affiliate) throw new BadRequestException('Affiliate link is invalid.');
    return this.prisma.affiliateReferral.create({ data: { affiliateId: affiliate.id, customerName: payload.customerName?.trim() || null, customerEmail: payload.customerEmail?.trim() || null, status: 'REGISTERED' } });
  }

  async getWallet(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    const sellerOrders = await this.getSellerOrdersForSeller(seller.id);
    const earned = sellerOrders.reduce((sum, order) => sum + order.sellerItems.reduce((itemSum, item) => itemSum + Number(item.profit || 0), 0), 0);
    const [paid, pending] = await Promise.all([
      this.prisma.withdrawal.aggregate({ where: { sellerId: seller.id, status: { in: ['PAID', 'COMPLETED', 'APPROVED'] } }, _sum: { amount: true } }),
      this.prisma.withdrawal.aggregate({ where: { sellerId: seller.id, status: 'PENDING' }, _sum: { amount: true } }),
    ]);
    const withdrawnAmount = Number(paid._sum.amount || 0);
    const pendingBalance = Number(pending._sum.amount || 0);

    return {
      userId: String(userId),
      availableBalance: Math.max(0, earned - withdrawnAmount - pendingBalance).toFixed(2),
      pendingBalance: pendingBalance.toFixed(2),
      totalWithdrawn: withdrawnAmount.toFixed(2),
      minimumWithdrawal: 25,
      hasTransactionPassword: Boolean(seller.transactionPasswordHash),
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
    const minimumWithdrawal = 25;
    if (amount < minimumWithdrawal) throw new BadRequestException(`Minimum withdrawal amount is ${minimumWithdrawal}.`);
    const method = String(payload?.method || '').toUpperCase();
    if (!['BANK_TRANSFER', 'PAYPAL', 'MOBILE_MONEY'].includes(method)) throw new BadRequestException('Select a valid withdrawal method.');
    const accountDetails = String(payload?.accountDetails || '').trim();
    if (accountDetails.length < 5) throw new BadRequestException('Valid payment account details are required.');
    if (!seller.transactionPasswordHash || !payload?.transactionPassword || !(await compare(String(payload.transactionPassword), seller.transactionPasswordHash))) throw new BadRequestException('The transaction password is invalid or has not been set.');
    const sellerOrders = await this.getSellerOrdersForSeller(seller.id);
    const earned = sellerOrders.reduce((sum, order) => sum + order.sellerItems.reduce((itemSum, item) => itemSum + Number(item.profit || 0), 0), 0);
    const [paid, pending] = await Promise.all([
      this.prisma.withdrawal.aggregate({ where: { sellerId: seller.id, status: { in: ['PAID', 'COMPLETED', 'APPROVED'] } }, _sum: { amount: true } }),
      this.prisma.withdrawal.aggregate({ where: { sellerId: seller.id, status: 'PENDING' }, _sum: { amount: true } }),
    ]);
    const availableBalance = Math.max(0, earned - Number(paid._sum.amount || 0) - Number(pending._sum.amount || 0));
    if (amount > availableBalance) throw new BadRequestException(`Withdrawal exceeds your available balance of ${availableBalance.toFixed(2)}.`);
    const request = await this.prisma.withdrawal.create({ data: { sellerId: seller.id, amount, method, accountDetails, status: 'PENDING' } });
    return { message: 'Withdrawal request created successfully.', request };
  }

  async getWithdrawals(userId: number | string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');

    return this.prisma.withdrawal.findMany({ where: { sellerId: seller.id }, orderBy: { requestedAt: 'desc' } });
  }

  async setTransactionPassword(userId: number | string, currentPassword: string | undefined, newPassword: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId: String(userId) } });
    if (!seller) throw new BadRequestException('Seller profile not found.');
    if (!newPassword || newPassword.length < 6) throw new BadRequestException('Transaction password must be at least 6 characters.');
    if (seller.transactionPasswordHash && (!currentPassword || !(await compare(currentPassword, seller.transactionPasswordHash)))) throw new BadRequestException('Current transaction password is invalid.');
    await this.prisma.seller.update({ where: { id: seller.id }, data: { transactionPasswordHash: await hash(newPassword, 10) } });
    return { message: seller.transactionPasswordHash ? 'Transaction password updated.' : 'Transaction password created.' };
  }
}
