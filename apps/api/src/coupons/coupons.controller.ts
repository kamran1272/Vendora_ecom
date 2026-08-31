import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Get()
  findAll() {
    return this.couponsService.findAll();
  }

  @Get('validate/:code')
  validateCoupon(@Param('code') code: string) {
    return this.couponsService.validateCoupon(code);
  }

  @Post()
  create(@Body() couponData: any) {
    return this.couponsService.create(couponData);
  }
}
