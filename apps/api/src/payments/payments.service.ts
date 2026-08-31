import { BadRequestException, Injectable } from '@nestjs/common';

@Injectable()
export class PaymentsService {
  private payments: any[] = [];
  private payouts: any[] = [];

  processPayment(paymentData: any) {
    const amount = Number(paymentData?.amount ?? 0);

    if (!amount || amount <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero.');
    }

    const payment = {
      id: this.payments.length + 1,
      orderId: paymentData?.orderId,
      amount,
      method: paymentData?.method || 'stripe',
      status: 'completed',
      createdAt: new Date().toISOString(),
    };
    this.payments.push(payment);
    return payment;
  }

  getPaymentStatus(orderId: number) {
    const payment = this.payments.find((entry) => entry.orderId === orderId);
    return {
      orderId,
      status: payment?.status || 'pending',
      amount: payment?.amount || 0,
      method: payment?.method || 'stripe',
    };
  }

  refund(orderId: number) {
    const payment = this.payments.find((entry) => entry.orderId === orderId);
    if (!payment) {
      throw new BadRequestException('Payment record not found.');
    }

    const refund = {
      orderId,
      status: 'refunded',
      amount: payment.amount,
      refundedAt: new Date().toISOString(),
    };
    return refund;
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
