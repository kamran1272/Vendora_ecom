import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PaymentsService {
  private payouts: any[] = [];

  constructor(private readonly prisma: PrismaService) {}

  async processPayment(paymentData: any) {
    const amount = Number(paymentData?.amount ?? 0);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const payment = await this.prisma.payment.upsert({
      where: { orderId: String(paymentData?.orderId) },
      update: {
        amount,
        method: paymentData?.method || 'stripe',
        status: paymentData?.status || 'COMPLETED',
        gateway: paymentData?.gateway || 'stripe',
        transactionId: paymentData?.transactionId || null,
        rawResponse: paymentData?.rawResponse ? JSON.stringify(paymentData.rawResponse) : null,
      },
      create: {
        orderId: String(paymentData?.orderId),
        amount,
        method: paymentData?.method || 'stripe',
        status: paymentData?.status || 'COMPLETED',
        gateway: paymentData?.gateway || 'stripe',
        transactionId: paymentData?.transactionId || null,
        rawResponse: paymentData?.rawResponse ? JSON.stringify(paymentData.rawResponse) : null,
      },
    });

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

  createPayout(sellerId: number, amount: number, method: string) {
    const payout = {
      id: this.payouts.length + 1,
      sellerId,
      amount: Number(amount),
      method,
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    this.payouts.push(payout);
    return payout;
  }

  getPayouts() {
    return this.payouts;
  }

  processPayout(id: number) {
    const payout = this.payouts.find((entry) => entry.id === id);
    if (!payout) {
      throw new BadRequestException('Payout not found.');
    }

    payout.status = 'processed';
    payout.processedAt = new Date().toISOString();
    return { message: 'Payout processed successfully.', payout };
  }
}
