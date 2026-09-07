import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  processPayment(@Body() paymentData: any) {
    return this.paymentsService.processPayment(paymentData);
  }

  @Post('payout')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  createPayout(@Req() req: any, @Body() payload: { amount: number; method: string }) {
    return this.paymentsService.createPayout(req.user.userId, payload.amount, payload.method);
  }

  @Get('payouts')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getPayouts() {
    return this.paymentsService.getPayouts();
  }

  @Post('payout/:id/complete')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  completePayout(@Param('id') id: string) {
    return this.paymentsService.processPayout(Number(id));
  }

  @Get('order/:orderId')
  getPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentStatus(orderId);
  }

  @Post(':orderId/refund')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  refund(@Param('orderId') orderId: string) {
    return this.paymentsService.refund(orderId);
  }
}
