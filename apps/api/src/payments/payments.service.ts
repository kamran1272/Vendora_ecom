import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService, private readonly notificationsService: NotificationsService) {}

  async processPayment(paymentData: any) {
    const amount = Number(paymentData?.amount ?? 0);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const payment = await this.prisma.payment.upsert({
      where: { orderId: String(paymentData?.orderId) },
      update: {
        amount,
        fee: Number(paymentData?.fee ?? 0),
        commission: Number(paymentData?.commission ?? 0),
        method: paymentData?.method || 'stripe',
        status: paymentData?.status || 'COMPLETED',
        gateway: paymentData?.gateway || 'stripe',
        transactionId: paymentData?.transactionId || null,
        rawResponse: paymentData?.rawResponse ? JSON.stringify(paymentData.rawResponse) : null,
      },
      create: {
        orderId: String(paymentData?.orderId),
        amount,
        fee: Number(paymentData?.fee ?? 0),
        commission: Number(paymentData?.commission ?? 0),
        method: paymentData?.method || 'stripe',
        status: paymentData?.status || 'COMPLETED',
        gateway: paymentData?.gateway || 'stripe',
        transactionId: paymentData?.transactionId || null,
        rawResponse: paymentData?.rawResponse ? JSON.stringify(paymentData.rawResponse) : null,
      },
    });

    await this.notificationsService.notifyAdmins({ type: 'PAYMENT', title: 'Payment processed', message: `Payment for order ${payment.orderId} is ${payment.status}.`, entityId: payment.id, entityType: 'PAYMENT' });
    return payment;
  }

  async getPaymentStatus(orderId: number | string) {
    const payment = await this.prisma.payment.findUnique({
      where: { orderId: String(orderId) },
    });

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
    });

    if (!payment) {
      throw new BadRequestException('Payment record not found.');
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
