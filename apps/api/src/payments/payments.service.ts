import { BadRequestException, Injectable } from '@nestjs/common';
import Stripe from 'stripe';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly notificationsService: NotificationsService) {}

  private configured(value?: string) {
    return Boolean(value && !value.includes('your_') && !value.includes('replace-with'));
  }

  private async createPayPalOrder(order: { id: string; total: unknown; currency: string }, userId: string) {
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    const baseUrl = process.env.PAYPAL_MODE === 'live' ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com';
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const tokenResponse = await fetch(`${baseUrl}/v1/oauth2/token`, { method: 'POST', headers: { Authorization: `Basic ${credentials}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: 'grant_type=client_credentials' });
    if (!tokenResponse.ok) throw new BadRequestException('PayPal authentication failed.');
    const token = (await tokenResponse.json() as { access_token?: string }).access_token;
    if (!token) throw new BadRequestException('PayPal did not return an access token.');
    const orderResponse = await fetch(`${baseUrl}/v2/checkout/orders`, { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ intent: 'CAPTURE', purchase_units: [{ reference_id: order.id, amount: { currency_code: order.currency, value: Number(order.total).toFixed(2) }, custom_id: userId }], application_context: { return_url: `${process.env.PUBLIC_WEB_URL || 'http://localhost:4173'}/account/orders/${order.id}?payment=success`, cancel_url: `${process.env.PUBLIC_WEB_URL || 'http://localhost:4173'}/checkout?payment=cancelled` } }) });
    if (!orderResponse.ok) throw new BadRequestException('PayPal could not create the payment order.');
    const paypalOrder = await orderResponse.json() as { id?: string; links?: Array<{ rel?: string; href?: string }> };
    const approvalUrl = paypalOrder.links?.find((link) => link.rel === 'approve')?.href;
    if (!paypalOrder.id || !approvalUrl) throw new BadRequestException('PayPal did not return an approval URL.');
    return { id: paypalOrder.id, approvalUrl };
  }

  getAvailableMethods() {
    return [
      { id: 'card', label: 'Credit or debit card', provider: 'stripe', configured: this.configured(process.env.STRIPE_SECRET_KEY) },
      { id: 'paypal', label: 'PayPal', provider: 'paypal', configured: this.configured(process.env.PAYPAL_CLIENT_ID) && this.configured(process.env.PAYPAL_CLIENT_SECRET) },
      { id: 'cod', label: 'Cash on delivery', provider: 'cash_on_delivery', configured: true },
      { id: 'upi', label: 'UPI', provider: 'razorpay', configured: this.configured(process.env.RAZORPAY_KEY_ID) && this.configured(process.env.RAZORPAY_KEY_SECRET) },
      { id: 'binance_pay', label: 'Binance Pay', provider: 'binance_pay', configured: this.configured(process.env.BINANCE_PAY_API_KEY) && this.configured(process.env.BINANCE_PAY_SECRET_KEY) },
      { id: 'bitcoin', label: 'Bitcoin', provider: 'btcpay', configured: this.configured(process.env.BTCPAY_API_URL) && this.configured(process.env.BTCPAY_API_KEY) },
    ];
  }

  async createCheckoutSession(orderId: string, userId: string, method: string) {
    const order = await this.prisma.order.findFirst({ where: { id: orderId, userId }, include: { items: true, payment: true } });
    if (!order || !order.payment) throw new BadRequestException('Order payment could not be initialized.');
    if (order.payment.status === 'PAID') throw new BadRequestException('This order is already paid.');
    if (method === 'cod') {
      await this.prisma.$transaction([
        this.prisma.payment.update({ where: { id: order.payment.id }, data: { method: 'cod', gateway: 'cash_on_delivery', status: 'PENDING' } }),
        this.prisma.order.update({ where: { id: order.id }, data: { paymentMethod: 'cod', status: 'PENDING' } }),
        this.prisma.orderStatusHistory.create({ data: { orderId: order.id, status: 'PENDING', note: 'Cash on delivery selected' } }),
      ]);
      return { provider: 'cash_on_delivery', status: 'PENDING' };
    }
    if (method === 'paypal') {
      if (!this.configured(process.env.PAYPAL_CLIENT_ID) || !this.configured(process.env.PAYPAL_CLIENT_SECRET)) throw new BadRequestException('PayPal is not configured.');
      const paypalOrder = await this.createPayPalOrder(order, userId);
      await this.prisma.payment.update({ where: { id: order.payment.id }, data: { method: 'paypal', gateway: 'paypal', status: 'REQUIRES_ACTION', transactionId: paypalOrder.id } });
      return { provider: 'paypal', sessionId: paypalOrder.id, redirectUrl: paypalOrder.approvalUrl, status: 'REQUIRES_ACTION' };
    }
    if (method !== 'card') throw new BadRequestException('This payment provider is not configured yet.');
    if (!this.configured(process.env.STRIPE_SECRET_KEY)) throw new BadRequestException('Card payments are not configured. Add STRIPE_SECRET_KEY to the API environment.');

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-09-30.acacia' });
    const publicWebUrl = process.env.PUBLIC_WEB_URL?.trim() || 'http://localhost:4173';
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: order.items.map((item) => ({ price_data: { currency: order.currency.toLowerCase(), product_data: { name: item.name }, unit_amount: Math.round(Number(item.price) * 100) }, quantity: item.quantity })),
      metadata: { orderId: order.id, userId },
      success_url: `${publicWebUrl}/account/orders/${order.id}?payment=success`,
      cancel_url: `${publicWebUrl}/checkout?payment=cancelled`,
    });

    await this.prisma.payment.update({ where: { id: order.payment.id }, data: { method: 'card', gateway: 'stripe', status: 'REQUIRES_ACTION', transactionId: session.id } });
    return { provider: 'stripe', sessionId: session.id, redirectUrl: session.url, status: 'REQUIRES_ACTION' };
  }

  async handleStripeWebhook(signature: string | undefined, rawBody: Buffer) {
    if (!this.configured(process.env.STRIPE_SECRET_KEY) || !this.configured(process.env.STRIPE_WEBHOOK_SECRET)) {
      throw new BadRequestException('Stripe webhook is not configured.');
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-09-30.acacia' });
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature || '', process.env.STRIPE_WEBHOOK_SECRET!);
    } catch {
      throw new BadRequestException('Invalid Stripe webhook signature.');
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await this.prisma.$transaction(async (tx) => {
          const payment = await tx.payment.findUnique({ where: { orderId } });
          if (!payment || payment.status === 'PAID') return;
          await tx.payment.update({ where: { id: payment.id }, data: { status: 'PAID', transactionId: String(session.payment_intent || session.id), rawResponse: JSON.stringify(session) } });
          await tx.order.update({ where: { id: orderId }, data: { status: 'PAID' } });
          await tx.orderStatusHistory.create({ data: { orderId, status: 'PAID', note: 'Stripe Checkout payment confirmed' } });
        });
      }
    }

    return { received: true };
  }

  async processPayment(paymentData: any) {
    const orderId = String(paymentData?.orderId || '');
    if (!orderId) throw new BadRequestException('Order ID is required.');
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new BadRequestException('Order not found.');
    const amount = Number(order.total);
    if (!amount || amount <= 0) throw new BadRequestException('Order total must be positive.');

    const payment = await this.prisma.payment.upsert({
      where: { orderId },
      update: {
        amount,
        fee: 0,
        commission: 0,
        method: order.paymentMethod || 'stripe',
        status: 'PENDING',
        gateway: 'server_pending',
        transactionId: null,
        rawResponse: null,
      },
      create: {
        orderId,
        amount,
        fee: 0,
        commission: 0,
        method: order.paymentMethod || 'stripe',
        status: 'PENDING',
        gateway: 'server_pending',
        transactionId: null,
        rawResponse: null,
      },
    });

    await this.notificationsService.notifyAdmins({ type: 'PAYMENT', title: 'Payment processed', message: `Payment for order ${payment.orderId} is ${payment.status}.`, entityId: payment.id, entityType: 'PAYMENT' });
    return payment;
  }

  async getPaymentStatus(orderId: number | string, actor?: { userId?: string; role?: string }) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: String(orderId) },
      include: { order: { select: { userId: true } } },
    });

    const isAdmin = actor?.role === 'ADMIN' || actor?.role === 'SUPER_ADMIN';
    if (payment && !isAdmin && payment.order.userId !== String(actor?.userId)) {
      throw new BadRequestException('Payment record not found.');
    }

    return {
      orderId: String(orderId),
      status: payment?.status || 'PENDING',
      amount: payment?.amount || 0,
      method: payment?.method || 'stripe',
    };
  }

  async refund(orderId: number | string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: String(orderId) },
      include: { order: true },
    });

    if (!payment) {
      throw new BadRequestException('Payment record not found.');
    }

    if (payment.status !== 'PAID') throw new BadRequestException('Only paid orders can be refunded.');
    if (payment.gateway === 'stripe' && payment.transactionId && this.configured(process.env.STRIPE_SECRET_KEY)) {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2024-09-30.acacia' });
      await stripe.refunds.create({ payment_intent: payment.transactionId });
    } else if (payment.gateway !== 'stripe') {
      throw new BadRequestException('A refund provider is not configured for this payment.');
    }

    const refunded = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'REFUNDED' },
    });

    return {
      orderId: String(orderId),
      status: refunded.status,
      amount: refunded.amount,
      refundedAt: new Date().toISOString(),
    };
  }

  async createPayout(sellerId: number | string, amount: number, method: string) {
    const seller = await this.prisma.seller.findUnique({ where: { id: String(sellerId) } });
    if (!seller) throw new BadRequestException('Seller not found.');
    if (!Number.isFinite(Number(amount)) || Number(amount) <= 0) throw new BadRequestException('Payout amount must be greater than zero.');
    const payout = await this.prisma.withdrawal.create({ data: { sellerId: seller.id, amount: Number(amount), method: method || 'BANK_TRANSFER', status: 'PENDING' } });
    await this.notificationsService.notifyAdmins({ type: 'WITHDRAWAL_REQUEST', title: 'Withdrawal request', message: `A seller requested a payout of $${Number(amount).toFixed(2)}.`, entityId: payout.id, entityType: 'WITHDRAWAL' });
    return payout;
  }

  getPayouts() {
    return this.prisma.withdrawal.findMany({ include: { seller: { include: { user: true, shop: true } } }, orderBy: { requestedAt: 'desc' } });
  }

  async updatePayoutStatus(id: number | string, status: string) {
    const normalizedStatus = String(status || '').toUpperCase();
    if (!['PENDING', 'PROCESSING', 'PAID', 'REJECTED'].includes(normalizedStatus)) throw new BadRequestException('Invalid payout status.');
    const payout = await this.prisma.withdrawal.findUnique({ where: { id: String(id) } });
    if (!payout) throw new BadRequestException('Payout not found.');
    return this.prisma.withdrawal.update({ where: { id: payout.id }, data: { status: normalizedStatus, processedAt: ['PAID', 'REJECTED'].includes(normalizedStatus) ? new Date() : null }, include: { seller: { include: { user: true, shop: true } } } });
  }

  processPayout(id: number | string) {
    return this.updatePayoutStatus(id, 'PAID');
  }
}
