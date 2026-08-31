import { BadRequestException, Injectable } from '@nestjs/common';
import { CartService } from '../cart/cart.service';

@Injectable()
export class OrdersService {
  private orders: any[] = [
    {
      id: 1,
      userId: 1,
      items: [{ productId: 1, quantity: 1, price: 119.99 }],
      subtotal: 119.99,
      tax: 9.6,
      shipping: 12,
      discount: 0,
      total: 141.59,
      status: 'paid',
      paymentMethod: 'stripe',
      createdAt: new Date(),
    },
    {
      id: 2,
      userId: 1,
      items: [{ productId: 2, quantity: 1, price: 89.99 }],
      subtotal: 89.99,
      tax: 7.2,
      shipping: 12,
      discount: 0,
      total: 109.19,
      status: 'processing',
      paymentMethod: 'paypal',
      createdAt: new Date(),
    },
  ];

  constructor(private readonly cartService: CartService) {}

  findAll() {
    return this.orders;
  }

  findOne(id: number) {
    return this.orders.find((o) => o.id === id);
  }

  findByUser(userId: number) {
    return this.orders.filter((o) => o.userId === userId);
  }

  async checkout(userId: number, checkoutData: any) {
    const cart = this.cartService.getCart(userId);

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty.');
    }

    const order = {
      id: this.orders.length + 1,
      userId,
      items: cart.items,
      subtotal: Number(cart.subtotal.toFixed(2)),
      tax: Number(cart.tax.toFixed(2)),
      shipping: Number(cart.shipping.toFixed(2)),
      discount: Number(cart.discount.toFixed(2)),
      total: Number(cart.total.toFixed(2)),
      status: 'pending',
      paymentMethod: checkoutData?.paymentMethod || 'stripe',
      shippingAddress: checkoutData?.shippingAddress || null,
      couponCode: cart.couponCode || null,
      createdAt: new Date(),
    };

    this.orders.push(order);
    this.cartService.clear(userId);

    return {
      message: 'Order created successfully.',
      order,
    };
  }

  create(orderData: any) {
    const newOrder = {
      id: this.orders.length + 1,
      ...orderData,
      createdAt: new Date(),
      status: orderData?.status || 'pending',
    };
    this.orders.push(newOrder);
    return newOrder;
  }

  updateStatus(id: number, status: string) {
    const order = this.findOne(id);
    if (!order) {
      throw new BadRequestException('Order not found.');
    }

    order.status = status;
    return order;
  }
}
