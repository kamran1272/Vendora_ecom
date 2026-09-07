import { Controller, Get, Post, Body, Param, Put, Delete, Patch, Query, Req, Res, UseGuards, UploadedFile, UseInterceptors, BadRequestException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { mkdirSync } from 'fs';
import { SellersService } from './sellers.service';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { ChatService } from '@/chat.disabled/chat.service';

@Controller(['seller', 'sellers'])
export class SellersController {
  constructor(private sellersService: SellersService, private chatService: ChatService) {}

  @Get('chat/messages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async getSellerChatMessages(@Req() req: any, @Query() query: any) {
    const conversation = await this.chatService.getSellerSupportConversationForUser(req.user.userId);
    return this.chatService.getMessagesForConversation(
      conversation.id,
      req.user,
      query.page ? Number(query.page) : 1,
      query.limit ? Number(query.limit) : 50,
      query.search,
    );
  }

  @Post('chat/send')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async sendSellerChatMessage(@Req() req: any, @Body() payload: any) {
    const conversation = await this.chatService.getSellerSupportConversationForUser(req.user.userId);
    return this.chatService.sendMessage(conversation.id, req.user, payload);
  }

  @Post('chat/upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({ destination: (_req, _file, callback) => { const destination = require('path').resolve(__dirname, '../uploads'); mkdirSync(destination, { recursive: true }); callback(null, destination); }, filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`) }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => callback(null, Boolean(file.mimetype.match(/^(image|application|text|audio|video)\//))),
  }))
  uploadSellerChatFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('A supported file is required.');
    return this.sellersService.createSellerUpload(req.user.userId, file);
  }

  @Put('chat/mark-read')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async markSellerChatRead(@Req() req: any) {
    const conversation = await this.chatService.getSellerSupportConversationForUser(req.user.userId);
    return this.chatService.markConversationRead(conversation.id, req.user);
  }

  @Get('uploads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getUploads(@Req() req: any, @Query() query: any) { return this.sellersService.getSellerUploads(req.user.userId, query); }

  @Get('uploads/file/:storedName')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  async downloadUpload(@Param('storedName') storedName: string, @Req() req: any, @Res() response: any) {
    const filePath = await this.sellersService.getSellerUploadPath(req.user.userId, storedName);
    return response.sendFile(filePath);
  }

  @Post('uploads')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({ destination: (_req, _file, callback) => { const destination = require('path').resolve(__dirname, '../uploads'); mkdirSync(destination, { recursive: true }); callback(null, destination); }, filename: (_req, file, callback) => callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`) }),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (_req, file, callback) => callback(null, Boolean(file.mimetype.match(/^(image|application|text|audio|video)\//))),
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File, @Req() req: any) {
    if (!file) throw new BadRequestException('A supported file is required.');
    return this.sellersService.createSellerUpload(req.user.userId, file);
  }

  @Delete('uploads/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  deleteUpload(@Param('id') id: string, @Req() req: any) { return this.sellersService.deleteSellerUpload(req.user.userId, id); }

  @Post('register')
  register(@Body() body: { name: string; email: string; password: string; shopName: string; category?: string }) {
    return this.sellersService.registerSeller(body);
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getDashboard(@Req() req: any) {
    return this.sellersService.getDashboard(req.user.userId);
  }

  @Get('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getProducts(@Req() req: any) {
    return this.sellersService.getSellerProducts(req.user.userId);
  }

  @Get('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getProduct(@Param('id') id: string, @Req() req: any) {
    return this.sellersService.getSellerProduct(id, req.user.userId);
  }

  @Get('reviews')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getReviews(@Query() query: any, @Req() req: any) {
    return this.sellersService.getSellerReviews(req.user.userId, query);
  }

  @Post('reviews/:id/reply')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  replyToReview(@Param('id') id: string, @Body() payload: { text?: string }, @Req() req: any) {
    return this.sellersService.replyToSellerReview(id, req.user.userId, payload?.text);
  }

  @Post('reviews/:id/report')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  reportReview(@Param('id') id: string, @Body() payload: { reason?: string }, @Req() req: any) {
    return this.sellersService.reportSellerReview(id, req.user.userId, payload?.reason);
  }

  @Post('products/bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  bulkProducts(@Body() payload: any, @Req() req: any) {
    return this.sellersService.bulkUpdateSellerProducts(req.user.userId, payload);
  }

  @Post('products')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  createProduct(@Body() payload: any, @Req() req: any) {
    return this.sellersService.createSellerProduct(req.user.userId, payload);
  }

  @Patch('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  updateProduct(@Param('id') id: string, @Body() payload: any, @Req() req: any) {
    return this.sellersService.updateSellerProduct(id, req.user.userId, payload);
  }

  @Delete('products/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  deleteProduct(@Param('id') id: string, @Req() req: any) {
    return this.sellersService.deleteSellerProduct(id, req.user.userId);
  }

  @Get('product-storehouse')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getProductStorehouse(@Req() req: any) {
    return this.sellersService.getProductStorehouse(req.user.userId);
  }

  @Get('shop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getShop(@Req() req: any) {
    return this.sellersService.getShop(req.user.userId);
  }

  @Patch('shop')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  updateShop(@Body() payload: any, @Req() req: any) {
    return this.sellersService.updateShop(req.user.userId, payload);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getOrders(@Req() req: any) {
    return this.sellersService.getSellerOrders(req.user.userId);
  }

  @Get('refunds')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getRefunds(@Req() req: any) {
    return this.sellersService.getSellerRefunds(req.user.userId);
  }

  @Get('support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getSupportTickets(@Req() req: any) {
    return this.sellersService.getSellerSupportTickets(req.user.userId);
  }

  @Post('support-tickets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  createSupportTicket(@Body() payload: any, @Req() req: any) {
    return this.sellersService.createSellerSupportTicket(req.user.userId, payload);
  }

  @Patch('refunds/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  updateRefund(@Param('id') id: string, @Body() payload: { status?: string; sellerNote?: string }, @Req() req: any) {
    return this.sellersService.updateSellerRefund(id, req.user.userId, payload?.status, payload?.sellerNote);
  }

  @Get('orders/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getOrder(@Param('id') id: string, @Req() req: any) {
    return this.sellersService.getSellerOrder(id, req.user.userId);
  }

  @Patch('orders/:id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  updateOrderStatus(@Param('id') id: string, @Body() payload: any, @Req() req: any) {
    return this.sellersService.updateSellerOrderStatus(id, req.user.userId, payload?.status);
  }

  @Get('package')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getPackage(@Req() req: any) {
    return this.sellersService.getSellerPackage(req.user.userId);
  }

  @Get('packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getPackages(@Req() req: any) {
    return this.sellersService.getPackages(req.user.userId);
  }

  @Post('packages/:id/purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  purchasePackage(@Param('id') id: string, @Body() payload: { action?: 'purchase' | 'upgrade' | 'renew' }, @Req() req: any) {
    return this.sellersService.purchasePackage(id, req.user.userId, payload?.action || 'purchase');
  }

  @Get('packages-payment-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getSubscriptionPurchases(@Query() query: any, @Req() req: any) {
    return this.sellersService.getSellerSubscriptionPurchases(req.user.userId, query);
  }

  @Get('traffic-packages')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getTrafficPackages() {
    return this.sellersService.getTrafficPackages();
  }

  @Get('affiliate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getAffiliate(@Req() req: any) {
    return this.sellersService.getAffiliateDashboard(req.user.userId);
  }

  @Post('traffic-packages/:id/purchase')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  purchaseTrafficPackage(@Param('id') id: string, @Req() req: any) {
    return this.sellersService.purchaseTrafficPackage(id, req.user.userId);
  }

  @Post('affiliate/click')
  trackAffiliateClick(@Body() payload: { code?: string }) {
    return this.sellersService.trackAffiliateClick(payload?.code || '');
  }

  @Post('affiliate/referral')
  registerAffiliateReferral(@Body() payload: { code?: string; customerName?: string; customerEmail?: string }) {
    return this.sellersService.registerAffiliateReferral(payload?.code || '', payload);
  }

  @Get('spread-packages-payment-list')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getTrafficPackagePurchases(@Query() query: any, @Req() req: any) {
    return this.sellersService.getTrafficPackagePurchases(req.user.userId, query);
  }

  @Get('commission-history')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getCommissionHistory(@Query() query: any, @Req() req: any) {
    return this.sellersService.getSellerCommissionHistory(req.user.userId, query);
  }

  @Get('wallet')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getWallet(@Req() req: any) {
    return this.sellersService.getWallet(req.user.userId);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  getWithdrawals(@Req() req: any) {
    return this.sellersService.getWithdrawals(req.user.userId);
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  requestWithdrawal(@Body() payload: any, @Req() req: any) {
    return this.sellersService.requestWithdrawal(req.user.userId, payload);
  }

  @Post('transaction-password')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  setTransactionPassword(@Body() payload: { currentPassword?: string; newPassword?: string }, @Req() req: any) {
    return this.sellersService.setTransactionPassword(req.user.userId, payload?.currentPassword, payload?.newPassword || '');
  }

  @Get() 
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll() {
    return this.sellersService.findAll();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.sellersService.findOne(id);
  }

  @Get('user/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findByUser(@Param('userId') userId: string) {
    return this.sellersService.findByUserId(userId);
  }

  @Get('earnings/:userId')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getEarnings(@Param('userId') userId: string) {
    return this.sellersService.getEarnings(userId);
  }

  @Post('apply')
  @UseGuards(JwtAuthGuard)
  apply(@Body() body: { shopName: string; ownerName?: string; email?: string; businessType?: string; country?: string; city?: string }, @Req() req: any) {
    return this.sellersService.applyForSeller(req.user.userId, body.shopName, body);
  }

  @Post(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  approveSeller(@Param('id') id: string) {
    return this.sellersService.approveSeller(id);
  }

  @Post(':id/reject')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  rejectSeller(@Param('id') id: string) {
    return this.sellersService.rejectSeller(id);
  }

  @Post(':id/suspend')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  suspendSeller(@Param('id') id: string) {
    return this.sellersService.suspendSeller(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() sellerData: any) {
    return this.sellersService.create(sellerData);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() sellerData: any) {
    return this.sellersService.update(id, sellerData);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.sellersService.remove(id);
  }
}
