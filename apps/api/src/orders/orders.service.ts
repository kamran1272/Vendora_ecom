import { BadRequestException, Injectable } from '@nestjs/common';
import { CartService } from '../cart/cart.service';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly cartService: CartService,
    private readonly prisma: PrismaService,
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

  async checkout(userId: number | string, checkoutData: any) {
    const cart = await this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const createdOrder = await tx.order.create({
        data: {
          userId: String(userId),
          subtotal: Number(cart.subtotal),
          tax: Number(cart.tax),
          shipping: Number(cart.shipping),
          discount: Number(cart.discount),
          total: Number(cart.total),
          status: 'PENDING',
          paymentMethod: checkoutData?.paymentMethod || 'stripe',
          shippingAddress:
            checkoutData?.shippingAddress !== undefined && checkoutData?.shippingAddress !== null
              ? typeof checkoutData.shippingAddress === 'string'
                ? checkoutData.shippingAddress
                : JSON.stringify(checkoutData.shippingAddress)
              : null,
          couponCode: cart.couponCode || null,
          items: {
            create: cart.items.map((item) => ({
              productId: String(item.productId),
              warehouseProductId: item.warehouseProductId ?? null,
              sellerId: item.sellerId ? String(item.sellerId) : null,
              name: item.name,
              quantity: Number(item.quantity),
              price: Number(item.price),
            })),
          },
          statusHistory: {
            create: [{ status: 'PENDING', note: 'Order created' }],
          },
        },
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

      return createdOrder;
    });

    await this.cartService.clear(userId);

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
