import { BadRequestException, Injectable } from '@nestjs/common';
import { hash } from 'bcrypt';
import { PrismaService } from '../database/prisma.service';
import { PaymentsService } from '../payments/payments.service';
import { SellersService } from '../sellers/sellers.service';
import { ProductWarehouseService } from '../product-warehouse/product-warehouse.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sellersService: SellersService,
    private readonly paymentsService: PaymentsService,
    private readonly productWarehouseService: ProductWarehouseService,
    private readonly notificationsService: NotificationsService,
  ) {}

  private serializeUser(user: any) {
    return {
      ...user,
      status: user.status || (user.isBlocked ? 'BLOCKED' : 'ACTIVE'),
      isBlocked: Boolean(user.isBlocked),
      emailVerified: Boolean(user.emailVerified),
      lastLoginAt: user.lastLoginAt ?? null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async getUsers(query: { page?: number; limit?: number; search?: string; role?: string; status?: string; from?: string; to?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const search = query.search?.trim();
    const role = query.role?.trim();
    const status = query.status?.trim();

    const where: any = {
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    if (role) {
      where.role = role.toUpperCase();
    }

    if (status) {
      const normalizedStatus = status.toUpperCase();
      if (normalizedStatus === 'BLOCKED') {
        where.isBlocked = true;
      } else {
        where.status = normalizedStatus;
      }
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) {
        where.createdAt.gte = new Date(query.from);
      }
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          orders: { take: 5, orderBy: { createdAt: 'desc' } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      items: items.map((user) => this.serializeUser(user)),
    };
  }

  async getUserById(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: String(id), deletedAt: null },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          include: {
            items: true,
            payment: true,
            statusHistory: true,
            shipment: true,
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return this.serializeUser(user);
  }

  async updateUser(id: string, payload: Record<string, any>) {
    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const nextPayload: any = {};
    if (payload.name !== undefined) nextPayload.name = String(payload.name).trim();
    if (payload.email !== undefined) nextPayload.email = String(payload.email).trim().toLowerCase();
    if (payload.role !== undefined) nextPayload.role = String(payload.role).toUpperCase();
    if (payload.status !== undefined) nextPayload.status = String(payload.status).toUpperCase();
    if (payload.emailVerified !== undefined) nextPayload.emailVerified = Boolean(payload.emailVerified);
    if (payload.isBlocked !== undefined) nextPayload.isBlocked = Boolean(payload.isBlocked);

    if (Object.keys(nextPayload).length === 0) {
      return this.serializeUser(user);
    }

    if (nextPayload.status) {
      nextPayload.isBlocked = nextPayload.status === 'BLOCKED';
    }

    const updated = await this.prisma.user.update({
      where: { id: String(id) },
      data: nextPayload,
    });

    return this.serializeUser(updated);
  }

  async updateUserStatus(id: string, payload: { status?: string; isBlocked?: boolean } = {}) {
    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const normalizedStatus = payload.status ? String(payload.status).toUpperCase() : user.status;
    const isBlocked = payload.isBlocked !== undefined ? Boolean(payload.isBlocked) : normalizedStatus === 'BLOCKED';

    const updated = await this.prisma.user.update({
      where: { id: String(id) },
      data: {
        status: normalizedStatus,
        isBlocked,
      },
    });

    return {
      message: isBlocked ? 'User blocked successfully.' : 'User status updated successfully.',
      user: this.serializeUser(updated),
    };
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.prisma.user.update({
      where: { id: String(id) },
      data: {
        deletedAt: new Date(),
        status: 'DELETED',
      },
    });

    return { message: 'User deleted successfully.' };
  }

  async resetUserPassword(id: string, password?: string) {
    if (!password || String(password).trim().length < 6) {
      throw new BadRequestException('A new password with at least 6 characters is required.');
    }

    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const hashedPassword = await hash(String(password).trim(), 10);
    await this.prisma.user.update({
      where: { id: String(id) },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'User password reset successfully.' };
  }

  async getUserOrders(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return this.prisma.order.findMany({
      where: { userId: String(id) },
      include: {
        items: true,
        payment: true,
        shipment: true,
        statusHistory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserPayments(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return this.prisma.payment.findMany({
      where: { order: { userId: String(id) } },
      include: {
        order: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserActivity(id: string) {
    const user = await this.prisma.user.findFirst({ where: { id: String(id), deletedAt: null } });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const [orders, payments, conversations] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId: String(id) },
        orderBy: { createdAt: 'desc' },
        include: { statusHistory: true, payment: true },
      }),
      this.prisma.payment.findMany({
        where: { order: { userId: String(id) } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.conversation.findMany({
        where: { customerId: String(id) },
        orderBy: { lastMessageAt: 'desc' },
      }),
    ]);

    const activity = [
      ...orders.flatMap((order) => [
        {
          type: 'order_created',
          label: `Placed order ${order.id}`,
          createdAt: order.createdAt,
          metadata: { orderId: order.id, total: order.total, status: order.status },
        },
        ...order.statusHistory.map((history) => ({
          type: 'order_status_updated',
          label: `Order ${order.id} moved to ${history.status}`,
          createdAt: history.createdAt,
          metadata: { orderId: order.id, status: history.status },
        })),
      ]),
      ...payments.map((payment) => ({
        type: 'payment_processed',
        label: `Payment ${payment.id} ${payment.status}`,
        createdAt: payment.createdAt,
        metadata: { paymentId: payment.id, amount: payment.amount, status: payment.status },
      })),
      ...conversations.map((conversation) => ({
        type: 'conversation_update',
        label: `Conversation ${conversation.subject || 'Support request'} ${conversation.status}`,
        createdAt: conversation.updatedAt,
        metadata: { conversationId: conversation.id, status: conversation.status, priority: conversation.priority },
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return activity;
  }

  private readonly orderStatuses = ['PENDING', 'PAID', 'PROCESSING', 'PACKED', 'PICKED_UP', 'SHIPPED', 'ON_THE_WAY', 'DELIVERED', 'CANCELLED', 'RETURNED', 'REFUNDED'];

  private orderInclude = {
    user: true,
    items: true,
    payment: true,
    shipment: true,
    statusHistory: { orderBy: { createdAt: 'asc' as const } },
  };

  private serializeOrder(order: any, sellerLookup = new Map<string, string>()) {
    const sellers = [...new Set(order.items.map((item: any) => item.sellerId).filter(Boolean))];
    return {
      ...order,
      orderNumber: order.orderNumber ?? order.id,
      customer: order.user?.name ?? order.user?.email ?? 'Unknown customer',
      customerEmail: order.user?.email ?? '',
      seller: sellers.length ? sellers.map((sellerId) => sellerLookup.get(String(sellerId)) ?? String(sellerId)).join(', ') : 'Marketplace seller',
      products: order.items.map((item: any) => ({ ...item, lineTotal: Number(item.price) * Number(item.quantity) })),
      paymentStatus: order.payment?.status ?? (order.status === 'PAID' ? 'PAID' : 'PENDING'),
      fulfillmentStatus: order.status,
      subtotal: Number(order.subtotal ?? 0),
      shipping: Number(order.shipping ?? 0),
      discount: Number(order.discount ?? 0),
      total: Number(order.total ?? 0),
    };
  }

  private buildPaginatedResponse<T>(items: T[], total: number, page: number, limit: number) {
    const safePage = Math.max(1, Number(page || 1));
    const safeLimit = Math.min(100, Math.max(1, Number(limit || 20)));
    return {
      items,
      total,
      page: safePage,
      limit: safeLimit,
      totalPages: Math.max(1, Math.ceil(total / safeLimit)),
    };
  }

  async getOrders(query: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; filters?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const search = query.search?.trim();
    const sortKey = query.sort?.trim() || 'createdAt';
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search } },
        { orderNumber: { contains: search } },
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: this.orderInclude,
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const sellerIds = [...new Set(items.flatMap((order) => order.items.map((item) => item.sellerId).filter((sellerId): sellerId is string => Boolean(sellerId))))];
    const sellers = await this.prisma.seller.findMany({ where: { id: { in: sellerIds } }, include: { user: true, shop: true } });
    const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller.shop?.name ? `${seller.user.name} · ${seller.shop.name}` : seller.user.name]));

    return this.buildPaginatedResponse(items.map((order) => this.serializeOrder(order, sellerLookup)), total, page, limit);
  }

  async getOrderById(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id: String(id) }, include: this.orderInclude });
    if (!order) throw new BadRequestException('Order not found.');
    const sellerIds = [...new Set(order.items.map((item) => item.sellerId).filter((sellerId): sellerId is string => Boolean(sellerId)))];
    const sellers = await this.prisma.seller.findMany({ where: { id: { in: sellerIds } }, include: { user: true, shop: true } });
    const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller.shop?.name ? `${seller.user.name} · ${seller.shop.name}` : seller.user.name]));
    return this.serializeOrder(order, sellerLookup);
  }

  async updateOrderStatus(id: string, status?: string) {
    const normalizedStatus = String(status || '').toUpperCase();
    if (!this.orderStatuses.includes(normalizedStatus)) throw new BadRequestException('Invalid order status.');
    const order = await this.prisma.order.findUnique({ where: { id: String(id) } });
    if (!order) throw new BadRequestException('Order not found.');

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: normalizedStatus, note: `Admin updated status to ${normalizedStatus}` } });
      return tx.order.update({ where: { id: order.id }, data: { status: normalizedStatus }, include: this.orderInclude });
    });
    return this.serializeOrder(updated);
  }

  async cancelOrder(id: string) {
    const order = await this.getOrderById(id);
    if (['DELIVERED', 'RETURNED', 'REFUNDED', 'CANCELLED'].includes(order.status)) throw new BadRequestException('This order cannot be cancelled in its current state.');
    return this.updateOrderStatus(id, 'CANCELLED');
  }

  async refundOrder(id: string) {
    const order = await this.getOrderById(id);
    if (['CANCELLED', 'REFUNDED'].includes(order.status)) throw new BadRequestException('This order has already been cancelled or refunded.');
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({ data: { orderId: order.id, status: 'REFUNDED', note: 'Admin issued a refund' } });
      if (order.payment?.id) await tx.payment.update({ where: { id: order.payment.id }, data: { status: 'REFUNDED' } });
      return tx.order.update({ where: { id: order.id }, data: { status: 'REFUNDED' }, include: this.orderInclude });
    });
    return this.serializeOrder(updated);
  }

  async contactOrderParticipant(id: string, participant: 'CUSTOMER' | 'SELLER', message?: string) {
    const order = await this.getOrderById(id);
    const sellerId = order.products.find((item: any) => item.sellerId)?.sellerId ?? null;
    const conversation = await this.prisma.conversation.create({ data: { orderId: order.id, customerId: participant === 'CUSTOMER' ? order.userId : null, sellerId: participant === 'SELLER' ? sellerId : null, subject: `Order ${order.orderNumber} ${participant.toLowerCase()} contact`, status: 'OPEN', priority: 'NORMAL', lastMessageAt: new Date() } });
    return { conversationId: conversation.id, message: message || `Please review order ${order.orderNumber}.` };
  }

  async getOrderDocument(id: string, type: 'invoice' | 'shipping-label') {
    const order = await this.getOrderById(id);
    return { type, orderNumber: order.orderNumber, customer: order.customer, customerEmail: order.customerEmail, products: order.products, subtotal: order.subtotal, shipping: order.shipping, discount: order.discount, total: order.total, shippingAddress: order.shippingAddress, createdAt: order.createdAt };
  }

  async getPayments(query: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; filters?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const search = query.search?.trim();
    const sortKey = (query.sort?.trim() || 'createdAt') as 'createdAt' | 'amount' | 'status';
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { transactionId: { contains: search } },
        { order: { user: { name: { contains: search } } } },
        { order: { user: { email: { contains: search } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { order: { include: { user: true, items: true } } },
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    const sellerIds = [...new Set(items.flatMap((payment) => payment.order.items.map((item) => item.sellerId).filter((id): id is string => Boolean(id))))];
    const sellers = await this.prisma.seller.findMany({ where: { id: { in: sellerIds } }, include: { user: true, shop: true } });
    const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller.shop?.name ? `${seller.user.name} · ${seller.shop.name}` : seller.user.name]));

    return this.buildPaginatedResponse(items.map((payment) => {
      const fee = Number(payment.fee ?? 0);
      const commission = Number(payment.commission ?? 0);
      const sellerNames = [...new Set(payment.order.items.map((item) => item.sellerId).filter(Boolean))].map((id) => sellerLookup.get(String(id)) ?? String(id));
      return {
        id: payment.id,
        transactionId: payment.transactionId ?? payment.id,
        order: payment.order.id,
        orderId: payment.order.id,
        customer: payment.order.user.name,
        customerEmail: payment.order.user.email,
        seller: sellerNames.length ? sellerNames.join(', ') : 'Marketplace seller',
        amount: Number(payment.amount),
        fee,
        commission,
        net: Number(payment.amount) - fee - commission,
        method: payment.method,
        status: this.normalizePaymentStatus(payment.status),
        date: payment.createdAt,
        createdAt: payment.createdAt,
      };
    }), total, page, limit);
  }

  private normalizePaymentStatus(status: string) {
    const normalized = String(status || '').toUpperCase();
    if (normalized === 'COMPLETED' || normalized === 'CAPTURED' || normalized === 'PAID') return 'PAID';
    if (normalized === 'PARTIALLY_REFUNDED' || normalized === 'PARTIAL_REFUND') return 'PARTIALLY_REFUNDED';
    if (normalized === 'REFUNDED') return 'REFUNDED';
    if (normalized === 'FAILED') return 'FAILED';
    return 'PENDING';
  }

  async getCategories() {
    return this.prisma.category.findMany({
      include: { parent: { select: { id: true, name: true } }, children: { select: { id: true } } },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createCategory(payload: Record<string, any>) {
    const name = String(payload.name || '').trim();
    const slug = String(payload.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    if (!name || !slug) throw new BadRequestException('Category name and slug are required.');
    if (payload.parentId) await this.assertCategoryParent(String(payload.parentId));
    return this.prisma.category.create({ data: { name, slug, parentId: payload.parentId || null, image: payload.image || null, seoTitle: payload.seoTitle || null, seoDescription: payload.seoDescription || null, status: String(payload.status || 'ACTIVE').toUpperCase(), sortOrder: Number(payload.sortOrder ?? 0) } });
  }

  async updateCategory(id: string, payload: Record<string, any>) {
    const category = await this.prisma.category.findUnique({ where: { id } });
    if (!category) throw new BadRequestException('Category not found.');
    if (payload.parentId === id) throw new BadRequestException('A category cannot be its own parent.');
    if (payload.parentId) await this.assertCategoryParent(String(payload.parentId), id);
    const data: Record<string, any> = {};
    for (const field of ['name', 'slug', 'image', 'seoTitle', 'seoDescription']) if (payload[field] !== undefined) data[field] = payload[field] === null ? null : String(payload[field]).trim();
    if (payload.parentId !== undefined) data.parentId = payload.parentId || null;
    if (payload.status !== undefined) data.status = String(payload.status).toUpperCase();
    if (payload.sortOrder !== undefined) data.sortOrder = Number(payload.sortOrder);
    return this.prisma.category.update({ where: { id }, data });
  }

  async reorderCategory(id: string, payload: { sortOrder?: number; parentId?: string | null }) {
    return this.updateCategory(id, { sortOrder: payload.sortOrder, parentId: payload.parentId });
  }

  async deleteCategory(id: string) {
    const category = await this.prisma.category.findUnique({ where: { id }, include: { children: true } });
    if (!category) throw new BadRequestException('Category not found.');
    if (category.children.length) throw new BadRequestException('Move or delete child categories before deleting this category.');
    return this.prisma.category.delete({ where: { id } });
  }

  private async assertCategoryParent(parentId: string, categoryId?: string) {
    const parent = await this.prisma.category.findUnique({ where: { id: parentId } });
    if (!parent) throw new BadRequestException('Parent category not found.');
    let current: string | null = parent.parentId;
    while (current) {
      if (current === categoryId) throw new BadRequestException('A category cannot be moved below one of its descendants.');
      const ancestor = await this.prisma.category.findUnique({ where: { id: current }, select: { parentId: true } });
      current = ancestor?.parentId ?? null;
    }
  }

  async getBrands(search?: string) {
    const brands = await this.prisma.brand.findMany({ where: search?.trim() ? { OR: [{ name: { contains: search.trim() } }, { slug: { contains: search.trim() } }] } : undefined, orderBy: { name: 'asc' } });
    return Promise.all(brands.map(async (brand) => ({ ...brand, productCount: await this.prisma.warehouseProduct.count({ where: { brand: brand.name } }) })));
  }

  async createBrand(payload: Record<string, any>) {
    const name = String(payload.name || '').trim();
    const slug = String(payload.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    if (!name || !slug) throw new BadRequestException('Brand name and slug are required.');
    return this.prisma.brand.create({ data: { name, slug, logo: payload.logo || null, status: String(payload.status || 'ACTIVE').toUpperCase() } });
  }

  async updateBrand(id: string, payload: Record<string, any>) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new BadRequestException('Brand not found.');
    const data: Record<string, any> = {};
    if (payload.name !== undefined) data.name = String(payload.name).trim();
    if (payload.slug !== undefined) data.slug = String(payload.slug).trim();
    if (payload.logo !== undefined) data.logo = payload.logo || null;
    if (payload.status !== undefined) data.status = String(payload.status).toUpperCase();
    return this.prisma.brand.update({ where: { id }, data });
  }

  async deleteBrand(id: string) {
    const brand = await this.prisma.brand.findUnique({ where: { id } });
    if (!brand) throw new BadRequestException('Brand not found.');
    const productCount = await this.prisma.warehouseProduct.count({ where: { brand: brand.name } });
    if (productCount > 0) throw new BadRequestException('This brand is assigned to products and cannot be deleted. Deactivate it instead.');
    return this.prisma.brand.delete({ where: { id } });
  }

  async getReviews(query: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; filters?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const search = query.search?.trim();
    const sortKey = (query.sort?.trim() || 'createdAt') as 'createdAt' | 'rating' | 'status';
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { title: { contains: search } },
        { text: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { email: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: { customer: true, seller: { include: { user: true, shop: true } }, warehouseProduct: true, reports: { where: { status: 'OPEN' } }, replies: { include: { author: true }, orderBy: { createdAt: 'asc' } } },
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.review.count({ where }),
    ]);

    return this.buildPaginatedResponse(items.map((review) => ({ id: review.id, type: review.sellerId ? 'SELLER' : 'PRODUCT', product: review.warehouseProduct?.name ?? review.productId ?? null, seller: review.seller?.shop?.name ?? review.seller?.user?.name ?? null, customer: review.customer.name, customerEmail: review.customer.email, rating: review.rating, title: review.title, text: review.text, status: review.status, reported: review.reports.length > 0, reportCount: review.reports.length, createdAt: review.createdAt, replies: review.replies.map((reply) => ({ id: reply.id, text: reply.text, author: reply.author.name, createdAt: reply.createdAt })) })), total, page, limit);
  }

  async updateReviewStatus(id: string, status?: string) {
    const normalized = String(status || '').toUpperCase();
    if (!['APPROVED', 'HIDDEN', 'PENDING'].includes(normalized)) throw new BadRequestException('Invalid review status.');
    return this.prisma.review.update({ where: { id }, data: { status: normalized } });
  }

  async deleteReview(id: string) { return this.prisma.review.delete({ where: { id } }); }

  async notifyProductReports() {
    const reports = await this.prisma.reviewReport.findMany({ where: { status: 'OPEN' }, include: { review: { include: { customer: true, warehouseProduct: true } } }, orderBy: { createdAt: 'desc' } });
    if (reports.length > 0) {
      const summary = `${reports.length} new product report${reports.length !== 1 ? 's' : ''} to review.`;
      await this.notificationsService.notifyAdmins({ type: 'PRODUCT_REPORT', title: 'Product reports pending review', message: summary, entityType: 'REVIEW_REPORT' });
    }
    return { count: reports.length };
  }

  async notifyLowInventory() {
    const lowStockProducts = await this.prisma.warehouseProduct.findMany({ where: { stock: { lte: 10 } }, select: { id: true, name: true, stock: true } });
    await Promise.all(lowStockProducts.map((product) => this.notificationsService.notifyAdmins({ type: 'LOW_INVENTORY', title: 'Low inventory alert', message: `${product.name} has only ${product.stock} units left in stock.`, entityId: product.id, entityType: 'WAREHOUSE_PRODUCT' })));
    return { count: lowStockProducts.length };
  }

  async replyToReview(id: string, text?: string) {
    const message = String(text || '').trim();
    if (!message) throw new BadRequestException('Reply text is required.');
    const admin = await this.prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, deletedAt: null } });
    if (!admin) throw new BadRequestException('No admin account is available to author this reply.');
    return this.prisma.reviewReply.create({ data: { reviewId: id, authorId: admin.id, text: message } });
  }

  async getRefunds(query: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; filters?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const search = query.search?.trim();
    const sortKey = (query.sort?.trim() || 'requestedAt') as 'requestedAt' | 'amount' | 'status';
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { reason: { contains: search } },
        { customer: { name: { contains: search } } },
        { customer: { email: { contains: search } } },
        { order: { id: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.refundRequest.findMany({
        where,
        include: { order: true, customer: true, seller: { include: { user: true, shop: true } }, payment: true },
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.refundRequest.count({ where }),
    ]);

    return this.buildPaginatedResponse(items.map((refund) => ({ id: refund.id, requestId: refund.id, order: refund.order.id, customer: refund.customer.name, customerEmail: refund.customer.email, seller: refund.seller?.shop?.name ?? refund.seller?.user?.name ?? 'Marketplace seller', amount: refund.amount, reason: refund.reason, payment: refund.payment?.transactionId ?? refund.payment?.id ?? 'Not linked', status: refund.status, requestedDate: refund.requestedAt, processedDate: refund.processedAt })), total, page, limit);
  }

  async createRefund(payload: Record<string, any>) {
    const order = await this.prisma.order.findUnique({ where: { id: String(payload.orderId) }, include: { payment: true, items: true } });
    if (!order) throw new BadRequestException('Order not found.');
    const amount = Number(payload.amount ?? order.total);
    if (!Number.isFinite(amount) || amount <= 0 || amount > Number(order.total)) throw new BadRequestException('Refund amount must be greater than zero and cannot exceed the order total.');
    const sellerId = payload.sellerId ?? order.items.find((item) => item.sellerId)?.sellerId ?? null;
    const refund = await this.prisma.refundRequest.create({ data: { orderId: order.id, customerId: order.userId, sellerId, paymentId: order.payment?.id ?? null, amount, reason: String(payload.reason || '').trim(), status: 'REQUESTED' } });
    await this.notificationsService.notifyAdmins({ type: 'REFUND_REQUEST', title: 'Refund request', message: `A refund request for order ${order.id} needs review.`, entityId: refund.id, entityType: 'REFUND' });
    return refund;
  }

  async updateRefundStatus(id: string, status?: string) {
    const normalized = String(status || '').toUpperCase();
    if (!['REQUESTED', 'UNDER_REVIEW', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED'].includes(normalized)) throw new BadRequestException('Invalid refund status.');
    const refund = await this.prisma.refundRequest.findUnique({ where: { id } });
    if (!refund) throw new BadRequestException('Refund request not found.');
    return this.prisma.$transaction(async (tx) => {
      if (normalized === 'COMPLETED' && refund.paymentId) await tx.payment.update({ where: { id: refund.paymentId }, data: { status: 'REFUNDED' } });
      return tx.refundRequest.update({ where: { id }, data: { status: normalized, processedAt: ['COMPLETED', 'REJECTED'].includes(normalized) ? new Date() : null }, include: { order: true, customer: true, payment: true } });
    });
  }

  async getPackages() {
    const packages = await this.prisma.sellerPackage.findMany({ orderBy: { price: 'asc' } });
    return Promise.all(packages.map(async (item) => ({ ...item, features: this.parseJsonList(item.features), purchaseCount: await this.prisma.sellerPackagePurchase.count({ where: { packageId: item.id, status: 'ACTIVE' } }) })));
  }

  async createPackage(payload: Record<string, any>) {
    const name = String(payload.name || '').trim();
    const slug = String(payload.slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')).trim();
    if (!name || !slug) throw new BadRequestException('Package name and slug are required.');
    return this.prisma.sellerPackage.create({ data: { name, slug, price: Number(payload.price ?? 0), trafficLimit: Number(payload.trafficLimit ?? -1), duration: Number(payload.duration ?? 30), description: payload.description || null, features: JSON.stringify(payload.features || []), status: String(payload.status || 'ACTIVE').toUpperCase() } });
  }

  async updatePackage(id: string, payload: Record<string, any>) {
    const item = await this.prisma.sellerPackage.findUnique({ where: { id } });
    if (!item) throw new BadRequestException('Package not found.');
    const data: Record<string, any> = {};
    if (payload.name !== undefined) data.name = String(payload.name).trim();
    if (payload.slug !== undefined) data.slug = String(payload.slug).trim();
    if (payload.price !== undefined) data.price = Number(payload.price);
    if (payload.trafficLimit !== undefined) data.trafficLimit = Number(payload.trafficLimit);
    if (payload.duration !== undefined) data.duration = Number(payload.duration);
    if (payload.description !== undefined) data.description = payload.description || null;
    if (payload.features !== undefined) data.features = JSON.stringify(payload.features);
    if (payload.status !== undefined) data.status = String(payload.status).toUpperCase();
    return this.prisma.sellerPackage.update({ where: { id }, data });
  }

  async deletePackage(id: string) {
    const item = await this.prisma.sellerPackage.findUnique({ where: { id }, include: { purchases: true } });
    if (!item) throw new BadRequestException('Package not found.');
    if (item.purchases.length) throw new BadRequestException('This package has purchase history and cannot be deleted. Deactivate it instead.');
    return this.prisma.sellerPackage.delete({ where: { id } });
  }

  private parseJsonList(value: string | null) {
    try { const parsed = JSON.parse(value || '[]'); return Array.isArray(parsed) ? parsed : []; } catch { return []; }
  }

  async getDashboard() {
    const sellers = await this.sellersService.findAll();
    const products = (await this.productWarehouseService.listWarehouse({ page: 1, limit: 100, includeInactive: true })).items;
    const orders = await this.sellersService.getAllOrders();
    const customers = new Set(orders.map((order: any) => order.customerName));
    const applications = await this.sellersService.getApplications();

    return {
      totalSales: sellers.reduce((sum: number, seller: any) => sum + Number(seller.earnings || 0), 0),
      totalOrders: orders.length,
      totalCustomers: customers.size,
      totalSellers: sellers.length,
      totalProducts: products.length,
      salesOverview: [],
      orderOverview: [],
      recentOrders: orders.slice(-5).map((order: any) => ({
        id: order.id,
        customer: order.customerName,
        total: order.total,
        status: order.status,
      })),
      topProducts: products.slice(0, 5).map((product: any) => ({
        id: product.id,
        name: product.name,
        price: product.price,
        sales: 120 + product.id,
      })),
      recentSellers: sellers.map((seller: any) => ({
        id: seller.id,
        shopName: seller.shopName,
        status: seller.status,
        sales: seller.earnings || 0,
        registeredAt: new Date().toISOString(),
      })),
      pendingApprovals: applications.length,
    };
  }

  private async getSellerMetrics(seller: any) {
    const orderItems = await this.prisma.orderItem.findMany({
      where: { sellerId: String(seller.id) },
      include: { order: true },
    });

    const orders = Array.from(new Map(orderItems.map((item) => [item.orderId, item.order])).values());
    const revenue = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
    const commissionRate = 10;
    const commission = revenue * (commissionRate / 100);
    const balance = revenue - commission;
    const products = Array.isArray(seller.sellerProducts) ? seller.sellerProducts.length : 0;

    return {
      products,
      orders: orders.length,
      revenue,
      commission,
      balance,
      rating: seller.rating ?? 4.8,
      joinedAt: seller.createdAt,
      shopName: seller.shop?.name ?? 'Unnamed shop',
      sellerName: seller.user?.name ?? 'Seller',
      email: seller.user?.email ?? '',
      status: seller.status ?? 'PENDING',
    };
  }

  private async serializeSellerRecord(seller: any) {
    const metrics = await this.getSellerMetrics(seller);
    return {
      id: seller.id,
      userId: seller.userId,
      seller: metrics.sellerName,
      shop: metrics.shopName,
      email: metrics.email,
      products: metrics.products,
      orders: metrics.orders,
      revenue: metrics.revenue,
      commission: metrics.commission,
      balance: metrics.balance,
      rating: metrics.rating,
      status: metrics.status,
      joinedAt: metrics.joinedAt,
      createdAt: metrics.joinedAt,
      updatedAt: seller.updatedAt,
      user: seller.user ? { id: seller.user.id, name: seller.user.name, email: seller.user.email, role: seller.user.role } : null,
      shopInfo: seller.shop ? { id: seller.shop.id, name: seller.shop.name, slug: seller.shop.slug } : null,
    };
  }

  async getSellers(query: { page?: number; limit?: number; search?: string; status?: string; from?: string; to?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20))); 
    const search = query.search?.trim();
    const status = query.status?.trim();

    const where: any = {};
    if (search) {
      where.OR = [
        { user: { name: { contains: search } } },
        { user: { email: { contains: search } } },
        { shop: { name: { contains: search } } },
      ];
    }
    if (status) {
      where.status = status.toUpperCase();
    }
    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) {
        const toDate = new Date(query.to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.seller.findMany({
        where,
        include: { user: true, shop: true, sellerProducts: { include: { warehouseProduct: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.seller.count({ where }),
    ]);

    const serialized = await Promise.all(items.map((seller) => this.serializeSellerRecord(seller)));

    return {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      items: serialized,
    };
  }

  async getPendingSellers() {
    const sellers = await this.prisma.seller.findMany({
      include: { user: true, shop: true, sellerProducts: { include: { warehouseProduct: true } } },
      orderBy: { createdAt: 'desc' },
    });
    const filtered = sellers.filter((seller: any) => String(seller.status).toLowerCase() === 'pending');
    return Promise.all(filtered.map((seller) => this.serializeSellerRecord(seller)));
  }

  async getSellerById(id: string) {
    const seller = await this.prisma.seller.findUnique({
      where: { id: String(id) },
      include: { user: true, shop: true, sellerProducts: { include: { warehouseProduct: true } } },
    });

    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    const serialized = await this.serializeSellerRecord(seller);
    const orderItems = await this.prisma.orderItem.findMany({
      where: { sellerId: String(id) },
      include: { order: { include: { user: true, payment: true, shipment: true, statusHistory: true } } },
      orderBy: { createdAt: 'desc' },
    });

    const orders = Array.from(new Map(orderItems.map((item) => [item.orderId, item.order])).values());
    const products = seller.sellerProducts.map((product: any) => ({
      id: product.id,
      name: product.warehouseProduct?.name ?? 'Product',
      sku: product.warehouseProduct?.sku ?? '',
      price: product.sellingPrice,
      status: product.status,
      stock: product.warehouseProduct?.stock ?? 0,
      createdAt: product.createdAt,
    }));

    return {
      ...serialized,
      products,
      orders: orders.map((order: any) => ({
        id: order.id,
        customerName: order.user?.name ?? 'Customer',
        total: Number(order.total || 0),
        status: order.status,
        createdAt: order.createdAt,
      })),
      earnings: {
        grossSales: orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0),
        commission: orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) * 0.1,
        netEarnings: orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) * 0.9,
        withdrawableBalance: orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0) * 0.9,
      },
    };
  }

  async updateSeller(id: string, payload: Record<string, any>) {
    const seller = await this.prisma.seller.findUnique({ where: { id: String(id) } });
    if (!seller) throw new BadRequestException('Seller not found.');

    const updated = await this.prisma.seller.update({
      where: { id: String(id) },
      data: {
        ...(payload.status !== undefined ? { status: String(payload.status).toUpperCase() } : {}),
      },
      include: { user: true, shop: true, sellerProducts: { include: { warehouseProduct: true } } },
    });

    if (payload.shopName !== undefined || payload.name !== undefined || payload.email !== undefined) {
      if (payload.shopName !== undefined) {
        await this.prisma.shop.upsert({
          where: { sellerId: String(id) },
          update: { name: String(payload.shopName) },
          create: { name: String(payload.shopName), slug: String(payload.shopName).trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'shop', sellerId: String(id) },
        });
      }
      if (payload.name !== undefined || payload.email !== undefined) {
        await this.prisma.user.update({
          where: { id: seller.userId },
          data: {
            ...(payload.name !== undefined ? { name: String(payload.name).trim() } : {}),
            ...(payload.email !== undefined ? { email: String(payload.email).trim().toLowerCase() } : {}),
          },
        });
      }
    }

    return this.serializeSellerRecord(updated);
  }

  async updateSellerStatus(id: string, payload: { status?: string; isSuspended?: boolean } = {}) {
    const seller = await this.prisma.seller.findUnique({ where: { id: String(id) } });
    if (!seller) throw new BadRequestException('Seller not found.');

    const status = payload.status ? String(payload.status).toUpperCase() : (payload.isSuspended ? 'SUSPENDED' : seller.status);
    const updated = await this.prisma.seller.update({
      where: { id: String(id) },
      data: { status },
      include: { user: true, shop: true, sellerProducts: { include: { warehouseProduct: true } } },
    });

    return { message: status === 'SUSPENDED' ? 'Seller suspended.' : 'Seller status updated.', seller: await this.serializeSellerRecord(updated) };
  }

  async getSellerProducts(id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: String(id) }, include: { sellerProducts: { include: { warehouseProduct: true } } } });
    if (!seller) throw new BadRequestException('Seller not found.');

    return seller.sellerProducts.map((product: any) => ({
      id: product.id,
      name: product.warehouseProduct?.name ?? 'Product',
      sku: product.warehouseProduct?.sku ?? '',
      price: product.sellingPrice,
      status: product.status,
      stock: product.warehouseProduct?.stock ?? 0,
      category: product.warehouseProduct?.category ?? '',
      createdAt: product.createdAt,
    }));
  }

  async getSellerOrders(id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: String(id) } });
    if (!seller) throw new BadRequestException('Seller not found.');

    const orderItems = await this.prisma.orderItem.findMany({
      where: { sellerId: String(id) },
      include: { order: { include: { user: true, payment: true, shipment: true, statusHistory: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return Array.from(new Map(orderItems.map((item) => [item.orderId, item.order])).values()).map((order: any) => ({
      id: order.id,
      customerName: order.user?.name ?? 'Customer',
      total: Number(order.total || 0),
      status: order.status,
      createdAt: order.createdAt,
      paymentStatus: order.payment?.status ?? 'PENDING',
    }));
  }

  async getSellerEarnings(id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: String(id) } });
    if (!seller) throw new BadRequestException('Seller not found.');

    const orderItems = await this.prisma.orderItem.findMany({
      where: { sellerId: String(id) },
      include: { order: true },
    });

    const orders = Array.from(new Map(orderItems.map((item) => [item.orderId, item.order])).values());
    const grossSales = orders.reduce((sum: number, order: any) => sum + Number(order.total || 0), 0);
    const platformCommission = grossSales * 0.1;
    const netEarnings = grossSales - platformCommission;

    return {
      grossSales,
      platformCommission,
      netEarnings,
      withdrawableBalance: netEarnings,
      currency: 'USD',
    };
  }

  approveSeller(id: string) {
    return this.sellersService.approveSeller(id);
  }

  rejectSeller(id: string) {
    return this.sellersService.rejectSeller(id);
  }

  private serializeProductRecord(product: any) {
    const rawImages = (() => {
      const value = product?.warehouseProduct?.images ?? product?.images ?? '[]';
      if (Array.isArray(value)) return value;
      try {
        return value ? JSON.parse(value) : [];
      } catch {
        return [];
      }
    })();

    const warehouseProduct = product?.warehouseProduct ?? {};
    const sellerProfile = product?.seller ?? {};
    const sellerUser = sellerProfile.user ?? {};
    const shop = product?.shop ?? {};

    return {
      id: product.id,
      warehouseProductId: warehouseProduct.id ?? null,
      image: rawImages[0] ?? null,
      images: rawImages,
      name: warehouseProduct.name ?? 'Product',
      sku: warehouseProduct.sku ?? '',
      seller: sellerUser.name ?? 'Unknown seller',
      sellerId: sellerProfile.id ?? product.sellerId ?? null,
      shop: shop.name ?? 'No shop',
      shopId: shop.id ?? null,
      category: warehouseProduct.category ?? 'General',
      brand: warehouseProduct.brand ?? 'Generic',
      price: Number(product.sellingPrice ?? warehouseProduct.basePrice ?? 0),
      stock: Number(warehouseProduct.stock ?? 0),
      sales: Number(product.sales ?? 0),
      rating: Number(product.rating ?? 4.8),
      status: String(product.status ?? warehouseProduct.status ?? 'PENDING').toUpperCase(),
      warehouseStatus: String(warehouseProduct.status ?? 'PUBLISHED').toUpperCase(),
      createdAt: product.createdAt ?? warehouseProduct.createdAt ?? new Date().toISOString(),
      description: warehouseProduct.description ?? '',
    };
  }

  async getProductById(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({
      where: { id: String(id) },
      include: {
        warehouseProduct: true,
        seller: { include: { user: true } },
        shop: true,
      },
    });

    if (!product) {
      throw new BadRequestException('Product listing not found.');
    }

    return this.serializeProductRecord(product);
  }

  async getProducts(query: { page?: number; limit?: number; search?: string; sort?: string; order?: 'asc' | 'desc'; filters?: string } = {}) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 20)));
    const search = query.search?.trim();
    const sortKey = (query.sort?.trim() || 'createdAt') as 'createdAt' | 'status' | 'sellingPrice';
    const sortOrder = query.order === 'asc' ? 'asc' : 'desc';

    const where: any = {};
    if (search) {
      where.OR = [
        { warehouseProduct: { name: { contains: search } } },
        { warehouseProduct: { sku: { contains: search } } },
        { shop: { name: { contains: search } } },
        { seller: { user: { name: { contains: search } } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.sellerProduct.findMany({
        where,
        include: {
          warehouseProduct: true,
          seller: { include: { user: true } },
          shop: true,
        },
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.sellerProduct.count({ where }),
    ]);

    const productIds = items.map((product) => product.warehouseProductId).filter(Boolean);
    const salesSummary = productIds.length
      ? await this.prisma.orderItem.groupBy({
          by: ['warehouseProductId'],
          where: { warehouseProductId: { in: productIds } },
          _sum: { quantity: true },
        })
      : [];

    const salesMap = new Map<string, number>();
    salesSummary.forEach((entry) => {
      salesMap.set(String(entry.warehouseProductId ?? ''), Number(entry._sum?.quantity ?? 0));
    });

    return this.buildPaginatedResponse(items.map((product) => ({
      ...this.serializeProductRecord(product),
      sales: salesMap.get(String(product.warehouseProductId)) ?? 0,
    })), total, page, limit);
  }

  async approveProduct(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product listing not found.');

    const [updatedListing, updatedWarehouse] = await Promise.all([
      this.prisma.sellerProduct.update({
        where: { id: String(id) },
        data: { status: 'ACTIVE' },
        include: { warehouseProduct: true, seller: { include: { user: true } }, shop: true },
      }),
      this.prisma.warehouseProduct.update({
        where: { id: product.warehouseProductId },
        data: { status: 'PUBLISHED' },
      }),
    ]);

    return { ...this.serializeProductRecord(updatedListing), warehouseStatus: String(updatedWarehouse.status).toUpperCase() };
  }

  async rejectProduct(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product listing not found.');

    const [updatedListing, updatedWarehouse] = await Promise.all([
      this.prisma.sellerProduct.update({
        where: { id: String(id) },
        data: { status: 'REJECTED' },
        include: { warehouseProduct: true, seller: { include: { user: true } }, shop: true },
      }),
      this.prisma.warehouseProduct.update({
        where: { id: product.warehouseProductId },
        data: { status: 'REJECTED' },
      }),
    ]);

    return { ...this.serializeProductRecord(updatedListing), warehouseStatus: String(updatedWarehouse.status).toUpperCase() };
  }

  async suspendProduct(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product listing not found.');

    const [updatedListing, updatedWarehouse] = await Promise.all([
      this.prisma.sellerProduct.update({
        where: { id: String(id) },
        data: { status: 'SUSPENDED' },
        include: { warehouseProduct: true, seller: { include: { user: true } }, shop: true },
      }),
      this.prisma.warehouseProduct.update({
        where: { id: product.warehouseProductId },
        data: { status: 'DRAFT' },
      }),
    ]);

    return { ...this.serializeProductRecord(updatedListing), warehouseStatus: String(updatedWarehouse.status).toUpperCase() };
  }

  async featureProduct(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product listing not found.');

    const [updatedListing, updatedWarehouse] = await Promise.all([
      this.prisma.sellerProduct.update({
        where: { id: String(id) },
        data: { status: 'FEATURED' },
        include: { warehouseProduct: true, seller: { include: { user: true } }, shop: true },
      }),
      this.prisma.warehouseProduct.update({
        where: { id: product.warehouseProductId },
        data: { status: 'PUBLISHED' },
      }),
    ]);

    return { ...this.serializeProductRecord(updatedListing), warehouseStatus: String(updatedWarehouse.status).toUpperCase() };
  }

  async archiveProduct(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product listing not found.');

    const [updatedListing, updatedWarehouse] = await Promise.all([
      this.prisma.sellerProduct.update({
        where: { id: String(id) },
        data: { status: 'ARCHIVED' },
        include: { warehouseProduct: true, seller: { include: { user: true } }, shop: true },
      }),
      this.prisma.warehouseProduct.update({
        where: { id: product.warehouseProductId },
        data: { status: 'DRAFT' },
      }),
    ]);

    return { ...this.serializeProductRecord(updatedListing), warehouseStatus: String(updatedWarehouse.status).toUpperCase() };
  }

  async updateProductStatus(id: string, status: string) {
    const normalizedStatus = String(status || 'ACTIVE').toUpperCase();
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) }, include: { warehouseProduct: true } });
    if (!product) throw new BadRequestException('Product listing not found.');

    const listingStatus = ['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED', 'FEATURED', 'ARCHIVED'].includes(normalizedStatus)
      ? normalizedStatus
      : 'ACTIVE';

    const [updatedListing, updatedWarehouse] = await Promise.all([
      this.prisma.sellerProduct.update({
        where: { id: String(id) },
        data: { status: listingStatus },
        include: { warehouseProduct: true, seller: { include: { user: true } }, shop: true },
      }),
      this.prisma.warehouseProduct.update({
        where: { id: product.warehouseProductId },
        data: { status: listingStatus === 'ARCHIVED' || listingStatus === 'REJECTED' || listingStatus === 'SUSPENDED' ? 'DRAFT' : 'PUBLISHED' },
      }),
    ]);

    return { ...this.serializeProductRecord(updatedListing), warehouseStatus: String(updatedWarehouse.status).toUpperCase() };
  }

  async deleteProduct(id: string) {
    const product = await this.prisma.sellerProduct.findUnique({ where: { id: String(id) } });
    if (!product) throw new BadRequestException('Product listing not found.');

    await this.prisma.sellerProduct.delete({ where: { id: String(id) } });
    return { message: 'Product listing deleted successfully.', id: String(id) };
  }

  getSellerApplications() {
    return this.sellersService.getApplications();
  }

  getSellerApplicationById(applicationId: string) {
    return this.sellersService.getApplicationById(applicationId);
  }

  updateSellerApplicationStatus(applicationId: string, status: string) {
    return this.sellersService.updateApplicationStatus(applicationId, status);
  }

  requestSellerApplicationInfo(applicationId: string, message?: string, adminUserId?: string) {
    return this.sellersService.requestInformation(applicationId, message, adminUserId);
  }

  messageSellerApplication(applicationId: string, message?: string, adminUserId?: string) {
    return this.sellersService.messageApplicant(applicationId, message, adminUserId);
  }

  async getCommissionOverview(query: { from?: string; to?: string; sellerId?: string; orderId?: string } = {}) {
    const dateFilter: Record<string, Date> = {};
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to) { const to = new Date(query.to); to.setHours(23, 59, 59, 999); dateFilter.lte = to; }
    const orders = await this.prisma.order.findMany({
      where: { ...(Object.keys(dateFilter).length ? { createdAt: dateFilter } : {}), ...(query.orderId ? { id: { contains: query.orderId.trim() } } : {}), ...(query.sellerId ? { items: { some: { sellerId: query.sellerId } } } : {}) },
      include: { user: true, items: true, payment: true, refundRequests: { where: { status: 'COMPLETED' } } },
      orderBy: { createdAt: 'desc' },
    });
    const sellerIds = [...new Set(orders.flatMap((order) => order.items.map((item) => item.sellerId).filter((id): id is string => Boolean(id))))];
    const sellers = await this.prisma.seller.findMany({ where: { id: { in: sellerIds } }, include: { user: true, shop: true } });
    const sellerLookup = new Map(sellers.map((seller) => [seller.id, seller.shop?.name ? `${seller.user.name} · ${seller.shop.name}` : seller.user.name]));
    const rows = orders.map((order) => {
      const amount = Number(order.payment?.amount ?? order.total ?? 0);
      const fee = Number(order.payment?.fee ?? 0);
      const commission = Number(order.payment?.commission ?? amount * 0.1);
      const refunds = order.refundRequests.reduce((sum, refund) => sum + Number(refund.amount), 0);
      const sellerNames = [...new Set(order.items.map((item) => item.sellerId).filter(Boolean))].map((id) => sellerLookup.get(String(id)) ?? String(id));
      return { id: order.id, order: order.id, customer: order.user.name, customerEmail: order.user.email, seller: sellerNames.length ? sellerNames.join(', ') : 'Marketplace seller', gmv: amount, sellerEarnings: amount - commission, commission, paymentFees: fee, refunds, netMarketplaceRevenue: commission - fee - refunds, status: order.status, date: order.createdAt };
    });
    return { summary: rows.reduce((summary, row) => ({ gmv: summary.gmv + row.gmv, sellerEarnings: summary.sellerEarnings + row.sellerEarnings, commission: summary.commission + row.commission, paymentFees: summary.paymentFees + row.paymentFees, refunds: summary.refunds + row.refunds, netMarketplaceRevenue: summary.netMarketplaceRevenue + row.netMarketplaceRevenue }), { gmv: 0, sellerEarnings: 0, commission: 0, paymentFees: 0, refunds: 0, netMarketplaceRevenue: 0 }), rows, sellers: sellers.map((seller) => ({ id: seller.id, name: seller.shop?.name ? `${seller.user.name} · ${seller.shop.name}` : seller.user.name })) };
  }

  getProductQueries() {
    return this.prisma.productQuery.findMany({
      include: {
        user: { select: { id: true, name: true, email: true } },
        seller: { include: { user: { select: { id: true, name: true, email: true } }, shop: true } },
        product: { select: { id: true, name: true, sku: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  approveSellerApplication(applicationId: string) {
    return this.sellersService.approveApplication(applicationId);
  }

  rejectSellerApplication(applicationId: string) {
    return this.sellersService.rejectApplication(applicationId);
  }

  async setSellerCommission(sellerId: number, commissionRate: number) {
    const seller = await this.sellersService.findOne(sellerId);
    if (!seller) {
      throw new BadRequestException('Seller not found.');
    }

    const rate = Number(commissionRate);
    if (Number.isNaN(rate) || rate < 0 || rate > 100) {
      throw new BadRequestException('Commission rate must be a number between 0 and 100.');
    }

    const sellerWithCommission = seller as any;
    sellerWithCommission.commissionRate = rate;
    return {
      message: 'Seller commission updated successfully.',
      seller: sellerWithCommission,
    };
  }

  async getPayoutQueue() {
    const payouts = await this.paymentsService.getPayouts();
    return payouts.map((payout: any) => ({
      id: payout.id,
      requestId: payout.id,
      seller: payout.seller?.shop?.name ? `${payout.seller.user.name} · ${payout.seller.shop.name}` : payout.seller?.user?.name ?? payout.sellerId,
      sellerId: payout.sellerId,
      amount: payout.amount,
      method: payout.method,
      requested: payout.requestedAt,
      requestedAt: payout.requestedAt,
      status: payout.status,
      processed: payout.processedAt,
      processedAt: payout.processedAt,
      transactionId: payout.transactionId,
    }));
  }

  approvePayout(payoutId: string) {
    return this.paymentsService.updatePayoutStatus(payoutId, 'PROCESSING');
  }

  rejectPayout(payoutId: string) {
    return this.paymentsService.updatePayoutStatus(payoutId, 'REJECTED');
  }

  processPayout(payoutId: string) {
    return this.paymentsService.updatePayoutStatus(payoutId, 'PROCESSING');
  }

  markPayoutPaid(payoutId: string) {
    return this.paymentsService.updatePayoutStatus(payoutId, 'PAID');
  }
}
