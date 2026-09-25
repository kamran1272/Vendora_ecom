import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CouponsService } from '../coupons/coupons.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly couponsService: CouponsService,
  ) {}

  findAll() {
    return this.prisma.order.findMany({
      include: {
        items: true,
        payment: true,
        shipment: true,
        statusHistory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number | string) {
    const order = await this.prisma.order.findUnique({
      where: { id: String(id) },
      include: {
        items: true,
        payment: true,
        shipment: true,
        statusHistory: true,
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    return order;
  }

  findByUser(userId: number | string) {
    return this.prisma.order.findMany({
      where: { userId: String(userId) },
      include: {
        items: true,
        payment: true,
        shipment: true,
        statusHistory: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findUserOrder(userId: number | string, id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: String(id), userId: String(userId) },
      include: {
        items: true,
        payment: true,
        shipment: true,
        statusHistory: true,
      },
    });

    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    return order;
  }

  async checkout(userId: number | string, checkoutData: any) {
    const idempotencyKey = String(checkoutData?.idempotencyKey || '').trim();
    if (!idempotencyKey) throw new BadRequestException('An idempotency key is required for checkout.');
    const existingOrder = await (this.prisma as any).order.findUnique({ where: { idempotencyKey } });
    if (existingOrder && existingOrder.userId === String(userId)) return { message: 'Order already created.', order: await this.findOne(existingOrder.id) };

    const order = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId: String(userId) },
        include: { items: true },
      });

      if (!cart?.items.length) {
        throw new BadRequestException('Cart is empty.');
      }

      const listings = await Promise.all(cart.items.map((item) => tx.sellerProduct.findUnique({
        where: { id: item.productId },
        include: { warehouseProduct: true },
      })));

      if (listings.some((listing) => !listing || listing.status !== 'ACTIVE' || listing.warehouseProduct.status !== 'PUBLISHED')) {
        throw new BadRequestException('One or more cart items are no longer available.');
      }

      const resolvedItems = cart.items.map((item, index) => {
        const listing = listings[index]!;
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new BadRequestException('Cart contains an invalid quantity.');
        }
        return {
          item,
          listing,
          quantity,
          price: Number(listing.sellingPrice),
        };
      });

      for (const resolved of resolvedItems) {
        const updated = await tx.warehouseProduct.updateMany({
          where: { id: resolved.listing.warehouseProductId, stock: { gte: resolved.quantity } },
          data: { stock: { decrement: resolved.quantity } },
        });
        if (updated.count !== 1) {
          throw new BadRequestException(`Not enough stock is available for ${resolved.listing.warehouseProduct.name}.`);
        }
      }

      const subtotal = resolvedItems.reduce((sum, resolved) => sum + resolved.price * resolved.quantity, 0);
      const rules = await (tx as any).commerceConfig.upsert({ where: { id: 'default' }, update: {}, create: { id: 'default' } });
      const tax = subtotal * Number(rules.taxRate);
      const sellerCount = new Set(resolvedItems.map((resolved) => resolved.listing.sellerId)).size;
      const shipping = subtotal >= Number(rules.freeShippingMinimum) ? 0 : sellerCount * Number(rules.shippingPerSeller);
      const coupon = cart.couponCode ? await this.couponsService.getValidCoupon(cart.couponCode, subtotal) : null;
      const discount = coupon?.discount ?? 0;
      if (coupon) {
        await (tx as any).coupon.update({ where: { id: coupon.coupon.id }, data: { usageCount: { increment: 1 } } });
      }
      const total = subtotal + tax + shipping - discount;

      const createdOrder = await tx.order.create({
        data: {
          userId: String(userId),
          subtotal: Number(subtotal.toFixed(2)),
          tax: Number(tax.toFixed(2)),
          shipping: Number(shipping.toFixed(2)),
          discount: Number(discount.toFixed(2)),
          total: Number(total.toFixed(2)),
          status: 'PENDING',
          paymentMethod: checkoutData?.paymentMethod || 'stripe',
          shippingAddress:
            checkoutData?.shippingAddress !== undefined && checkoutData?.shippingAddress !== null
              ? typeof checkoutData.shippingAddress === 'string'
                ? checkoutData.shippingAddress
                : JSON.stringify(checkoutData.shippingAddress)
              : null,
          couponCode: cart.couponCode || null,
          idempotencyKey,
          items: {
            create: resolvedItems.map(({ item, listing, quantity, price }) => ({
              productId: listing.id,
              warehouseProductId: listing.warehouseProductId,
              sellerId: listing.sellerId,
              variantId: item.variantId ?? null,
              variantSku: item.variantSku ?? null,
              name: listing.warehouseProduct.name,
              quantity,
              price,
            })),
          },
          statusHistory: {
            create: [{ status: 'PENDING', note: 'Order created' }],
          },
        } as any,
        include: {
          items: true,
          payment: true,
          shipment: true,
          statusHistory: true,
        },
      });

      await tx.payment.create({
        data: {
          orderId: createdOrder.id,
          amount: Number(createdOrder.total),
          method: createdOrder.paymentMethod,
          status: 'PENDING',
          gateway: 'stripe',
        },
      });

      if (checkoutData?.shippingAddress) {
        await tx.shipment.create({
          data: {
            orderId: createdOrder.id,
            status: 'PENDING',
            shippingAddress:
              typeof checkoutData.shippingAddress === 'string'
                ? checkoutData.shippingAddress
                : JSON.stringify(checkoutData.shippingAddress),
          },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return createdOrder;
    });

    return {
      message: 'Order created successfully.',
      order: await this.findOne(order.id),
    };
  }

  async create(orderData: any) {
    const items = Array.isArray(orderData?.items) ? orderData.items : [];
    const status = orderData?.status || 'PENDING';

    const newOrder = await this.prisma.order.create({
      data: {
        userId: String(orderData.userId),
        subtotal: Number(orderData.subtotal ?? 0),
        tax: Number(orderData.tax ?? 0),
        shipping: Number(orderData.shipping ?? 0),
        discount: Number(orderData.discount ?? 0),
        total: Number(orderData.total ?? 0),
        status,
        paymentMethod: orderData?.paymentMethod || 'stripe',
        shippingAddress:
          orderData?.shippingAddress !== undefined && orderData?.shippingAddress !== null
            ? typeof orderData.shippingAddress === 'string'
              ? orderData.shippingAddress
              : JSON.stringify(orderData.shippingAddress)
            : null,
        couponCode: orderData?.couponCode || null,
        items: {
          create: items.map((item: any) => ({
            productId: String(item.productId),
            warehouseProductId: item.warehouseProductId ?? null,
            sellerId: item.sellerId ? String(item.sellerId) : null,
            variantId: item.variantId ?? null,
            variantSku: item.variantSku ?? null,
            name: item.name || `Product ${item.productId}`,
            quantity: Number(item.quantity ?? 1),
            price: Number(item.price ?? 0),
          })),
        },
        statusHistory: {
          create: [{ status, note: 'Order created' }],
        },
      },
      include: {
        items: true,
        payment: true,
        shipment: true,
        statusHistory: true,
      },
    });

    await this.notificationsService.notifyAdmins({ type: 'NEW_ORDER', title: 'New order received', message: `Order ${newOrder.id} was placed for $${Number(newOrder.total).toFixed(2)}.`, entityId: newOrder.id, entityType: 'ORDER' });
    return newOrder;
  }

  async updateStatus(id: number | string, status: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: String(id) },
      include: { statusHistory: true },
    });

    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status,
          note: `Status updated to ${status}`,
        },
      });

      return tx.order.update({
        where: { id: order.id },
        data: { status },
        include: {
          items: true,
          payment: true,
          shipment: true,
          statusHistory: true,
        },
      });
    });

    return updated;
  }
}
