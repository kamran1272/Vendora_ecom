import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ShippingService } from './shipping.service';

@Controller('shipping')
export class ShippingController {
  constructor(private shippingService: ShippingService) {}

  @Post('calculate')
  calculateShippingCost(@Body() data: any) {
    return {
      cost: this.shippingService.calculateShippingCost(data.weight, data.distance),
    };
  }

  @Post()
  createShipment(@Body() shipmentData: any) {
    return this.shippingService.createShipment(shipmentData);
  }

  @Get('track/:shipmentId')
  trackShipment(@Param('shipmentId') shipmentId: string) {
    return this.shippingService.trackShipment(shipmentId);
  }
}
