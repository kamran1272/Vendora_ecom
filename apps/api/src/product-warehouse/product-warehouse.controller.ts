import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { ProductWarehouseService } from './product-warehouse.service';

@Controller()
export class ProductWarehouseController {
  constructor(private readonly warehouse: ProductWarehouseService) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/product-warehouse')
  list(@Query() query: any) { return this.warehouse.listWarehouse(query); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/product-warehouse/:id')
  get(@Param('id') id: string) { return this.warehouse.getProduct(id); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('seller/product-warehouse/add')
  add(@Req() req: any, @Body() body: { productIds: string[] }) { return this.warehouse.addProducts(String(req.user.userId), body.productIds); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/subscription')
  subscription(@Req() req: any) { return this.warehouse.getSellerState(String(req.user.userId)); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/product-warehouse')
  adminList(@Query() query: any) { return this.warehouse.listWarehouse({ ...query, includeInactive: true, limit: query.limit || 100 }); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/product-warehouse')
  create(@Body() body: any) { return this.warehouse.createWarehouseProduct(body); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/product-warehouse/:id')
  update(@Param('id') id: string, @Body() body: any) { return this.warehouse.updateWarehouseProduct(id, body); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('admin/product-warehouse/:id')
  remove(@Param('id') id: string) { return this.warehouse.deleteWarehouseProduct(id); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/subscription-plans')
  plans() { return this.warehouse.listPlans(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/subscription-plans')
  createPlan(@Body() body: any) { return this.warehouse.createPlan(body); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch('admin/subscription-plans/:id')
  updatePlan(@Param('id') id: string, @Body() body: any) { return this.warehouse.updatePlan(id, body); }
}
