import { Controller, Get, Post, Body, Param, Put, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Get('user/:userId')
  findByUser(@Req() req: any) {
    return this.ordersService.findByUser(req.user.userId);
  }

  @Get('user/current/:id')
  findUserOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.findUserOrder(req.user.userId, id);
  }

  @Post('checkout/:userId')
  checkout(@Req() req: any, @Body() payload: any) {
    return this.ordersService.checkout(req.user.userId, payload);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() orderData: any) {
    return this.ordersService.create(orderData);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateStatus(@Param('id') id: string, @Body() data: any) {
    return this.ordersService.updateStatus(id, data.status);
  }
}
