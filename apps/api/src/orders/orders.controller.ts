import { Controller, Get, Post, Body, Param, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(Number(id));
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.ordersService.findByUser(Number(userId));
  }

  @Post('checkout/:userId')
  checkout(@Param('userId') userId: string, @Body() payload: any) {
    return this.ordersService.checkout(Number(userId), payload);
  }

  @Post()
  create(@Body() orderData: any) {
    return this.ordersService.create(orderData);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: any) {
    return this.ordersService.updateStatus(Number(id), data.status);
  }
}
