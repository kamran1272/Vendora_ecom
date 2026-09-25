import { Controller, Headers, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service';

@Controller('payments/webhooks')
export class StripeWebhookController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('stripe')
  handleStripeWebhook(@Headers('stripe-signature') signature: string | undefined, @Req() request: Request & { rawBody?: Buffer }) {
    return this.paymentsService.handleStripeWebhook(signature, request.rawBody || Buffer.from(''));
  }
}