import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  processPayment(@Body() paymentData: any) {
    return this.paymentsService.processPayment(paymentData);
  }

  @Post('payout')
  createPayout(@Body() payload: { sellerId: number; amount: number; method: string }) {
    return this.paymentsService.createPayout(payload.sellerId, payload.amount, payload.method);
  }

  @Get('payouts')
  getPayouts() {
    return this.paymentsService.getPayouts();
  }

  @Post('payout/:id/complete')
  completePayout(@Param('id') id: string) {
    return this.paymentsService.processPayout(Number(id));
  }

  @Get('order/:orderId')
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }

  @Post(':orderId/refund')
  refund(@Param('orderId') orderId: string) {
    return this.paymentsService.refund(orderId);
  }
}
