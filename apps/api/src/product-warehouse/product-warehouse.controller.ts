import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { SellerRoleGuard } from '@/auth/guards/seller-role.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { ProductWarehouseService } from './product-warehouse.service';

@Controller()
export class ProductWarehouseController {
  constructor(private readonly warehouse: ProductWarehouseService) {}

  @Get('public/products')
  publicList(@Query() query: any) { return this.warehouse.listPublicProducts(query); }

  @Get('public/products/:id')
  publicGet(@Param('id') id: string) { return this.warehouse.getPublicProduct(id); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/product/storehouse/search')
  storehouseSearch(@Req() req: any, @Query() query: any) { return this.warehouse.listWarehouse(query, String(req.user.userId)); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/product-warehouse')
  list(@Req() req: any, @Query() query: any) { return this.warehouse.listWarehouse(query, String(req.user.userId)); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/product-warehouse/:id')
  get(@Req() req: any, @Param('id') id: string) { return this.warehouse.getSellerProduct(String(req.user.userId), id); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Post('seller/product/storehouse/add')
  storehouseAdd(@Req() req: any, @Body() body: { warehouseProductIds?: string[]; productIds?: string[] }) { return this.warehouse.addProducts(String(req.user.userId), body.warehouseProductIds || body.productIds || []); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Post('seller/product/storehouse/add-all')
  storehouseAddAll(@Req() req: any, @Body() body: { search?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number; stockStatus?: string; sort?: string }) { return this.warehouse.addAllFilteredProducts(String(req.user.userId), body); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Post('seller/product-warehouse/add')
  add(@Req() req: any, @Body() body: { productIds: string[] }) { return this.warehouse.addProducts(String(req.user.userId), body.productIds); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Delete('seller/product/storehouse/:warehouseProductId')
  removeStorehouseProduct(@Req() req: any, @Param('warehouseProductId') warehouseProductId: string) { return this.warehouse.removeProductByWarehouseProduct(String(req.user.userId), warehouseProductId); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Delete('seller/product-warehouse/:sellerProductId')
  removeSellerProduct(@Req() req: any, @Param('sellerProductId') sellerProductId: string) { return this.warehouse.removeProduct(String(req.user.userId), sellerProductId); }

  @UseGuards(JwtAuthGuard, SellerRoleGuard)
  @Roles(UserRole.SELLER)
  @Get('seller/subscription')
  subscription(@Req() req: any) { return this.warehouse.getSellerState(String(req.user.userId)); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/product-warehouse/summary')
  summary() { return this.warehouse.getSummary(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/product-warehouse/providers')
  providers() { return this.warehouse.listProviders(); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/product-warehouse/import/history')
  importHistory(@Query('limit') limit?: string) { return this.warehouse.getImportHistory(Number(limit || 20)); }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/product-warehouse/import/search')
  searchProvider(@Query('provider') provider: string, @Query('query') query = '', @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.warehouse.searchProvider(provider, query, Number(page || 1), Math.min(50, Number(limit || 24)));
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post('admin/product-warehouse/import')
  importProducts(@Body() body: { provider: string; externalIds: string[] }) { return this.warehouse.importProducts(body.provider, body.externalIds); }

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

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete('admin/subscription-plans/:id')
  deletePlan(@Param('id') id: string) { return this.warehouse.deletePlan(id); }
}
