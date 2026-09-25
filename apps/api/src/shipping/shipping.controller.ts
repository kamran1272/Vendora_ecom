import { Controller, Post, Get, Body, Param, Req, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';

@Controller('shipping')
@UseGuards(JwtAuthGuard)
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post('calculate')
  async calculateShippingCost(@Body() data: any) {
    return { cost: await this.shippingService.calculateShippingCost(data.weight, data.distance) };
  }

  @Post()
  createShipment(@Req() req: any, @Body() shipmentData: any) {
    return this.shippingService.createShipment({ ...shipmentData, userId: String(req.user.userId) });
  }

  @Get('track/:shipmentId')
  trackShipment(@Req() req: any, @Param('shipmentId') shipmentId: string) {
    return this.shippingService.trackShipment(shipmentId, String(req.user.userId));
  }
}
