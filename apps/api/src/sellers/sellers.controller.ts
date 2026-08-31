import { Controller, Get, Post, Body, Param, Put, Delete, Patch, Query } from '@nestjs/common';
import { SellersService } from './sellers.service';

@Controller(['seller', 'sellers'])
export class SellersController {
  constructor(private sellersService: SellersService) {}

  @Post('register')
  register(@Body() body: { name: string; email: string; password: string; shopName: string; category?: string }) {
    return this.sellersService.registerSeller(body);
  }

  @Get('dashboard')
  getDashboard(@Query('userId') userId?: string) {
    return this.sellersService.getDashboard(userId ?? '3');
  }

  @Get('products')
  getProducts(@Query('userId') userId?: string) {
    return this.sellersService.getSellerProducts(userId ?? '3');
  }

  @Get('products/:id')
  getProduct(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.sellersService.getSellerProduct(id, userId ?? '3');
  }

  @Post('products')
  createProduct(@Body() payload: any, @Query('userId') userId?: string) {
    return this.sellersService.createSellerProduct(Number(userId ?? 3), payload);
  }

  @Patch('products/:id')
  updateProduct(@Param('id') id: string, @Body() payload: any, @Query('userId') userId?: string) {
    return this.sellersService.updateSellerProduct(id, userId ?? '3', payload);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.sellersService.deleteSellerProduct(id, userId ?? '3');
  }

  @Get('product-storehouse')
  getProductStorehouse(@Query('userId') userId?: string) {
    return this.sellersService.getProductStorehouse(userId ?? '3');
  }

  @Get('shop')
  getShop(@Query('userId') userId?: string) {
    return this.sellersService.getShop(Number(userId ?? 3));
  }

  @Patch('shop')
  updateShop(@Body() payload: any, @Query('userId') userId?: string) {
    return this.sellersService.updateShop(Number(userId ?? 3), payload);
  }

  @Get('orders')
  getOrders(@Query('userId') userId?: string) {
    return this.sellersService.getSellerOrders(Number(userId ?? 3));
  }

  @Get('orders/:id')
  getOrder(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.sellersService.getSellerOrder(Number(id), Number(userId ?? 3));
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() payload: any, @Query('userId') userId?: string) {
    return this.sellersService.updateSellerOrderStatus(Number(id), Number(userId ?? 3), payload?.status);
  }

  @Get('package')
  getPackage(@Query('userId') userId?: string) {
    return this.sellersService.getSellerPackage(userId ?? '3');
  }

  @Get('packages')
  getPackages() {
    return this.sellersService.getPackages();
  }

  @Post('packages/:id/purchase')
  purchasePackage(@Param('id') id: string, @Query('userId') userId?: string) {
    return this.sellersService.purchasePackage(Number(id), Number(userId ?? 3));
  }

  @Get('wallet')
  getWallet(@Query('userId') userId?: string) {
    return this.sellersService.getWallet(Number(userId ?? 3));
  }

  @Get('withdrawals')
  getWithdrawals(@Query('userId') userId?: string) {
    return this.sellersService.getWithdrawals(Number(userId ?? 3));
  }

  @Post('withdrawals')
  requestWithdrawal(@Body() payload: any, @Query('userId') userId?: string) {
    return this.sellersService.requestWithdrawal(Number(userId ?? 3), payload);
  }

  @Get() 
  findAll() {
    return this.sellersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.sellersService.findOne(Number(id));
  }

  @Get('user/:userId')
  findByUser(@Param('userId') userId: string) {
    return this.sellersService.findByUserId(Number(userId));
  }

  @Get('earnings/:userId')
  getEarnings(@Param('userId') userId: string) {
    return this.sellersService.getEarnings(Number(userId));
  }

  @Post('apply')
  apply(@Body() body: { userId: number; shopName: string; ownerName?: string; email?: string; businessType?: string; country?: string; city?: string }) {
    return this.sellersService.applyForSeller(body.userId, body.shopName, body);
  }

  @Post(':id/approve')
  approveSeller(@Param('id') id: string) {
    return this.sellersService.approveSeller(Number(id));
  }

  @Post(':id/reject')
  rejectSeller(@Param('id') id: string) {
    return this.sellersService.rejectSeller(Number(id));
  }

  @Post(':id/suspend')
  suspendSeller(@Param('id') id: string) {
    return this.sellersService.suspendSeller(Number(id));
  }

  @Post()
  create(@Body() sellerData: any) {
    return this.sellersService.create(sellerData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() sellerData: any) {
    return this.sellersService.update(Number(id), sellerData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.sellersService.remove(Number(id));
  }
}
