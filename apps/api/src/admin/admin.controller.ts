import { BadRequestException, Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { AdminPaginationDto, AdminStatusDto, AdminUserQueryDto, ResetPasswordDto } from './dto/admin-pagination.dto';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly settingsService: SettingsService,
  ) {}

  @Get('settings')
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() payload: Record<string, any>) {
    return this.settingsService.updateSettings(payload);
  }

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('users')
  getUsers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getUsers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      role: query.role,
      status: query.status,
      from: query.from,
      to: query.to,
    });
  }

  @Get('users/:id')
  getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id') id: string, @Body() payload: Record<string, any>) {
    return this.adminService.updateUser(id, payload);
  }

  @Patch('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() payload: AdminStatusDto) {
    return this.adminService.updateUserStatus(id, payload);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  resetUserPassword(@Param('id') id: string, @Body() payload: ResetPasswordDto) {
    return this.adminService.resetUserPassword(id, payload.password);
  }

  @Get('users/:id/orders')
  getUserOrders(@Param('id') id: string) {
    return this.adminService.getUserOrders(id);
  }

  @Get('users/:id/payments')
  getUserPayments(@Param('id') id: string) {
    return this.adminService.getUserPayments(id);
  }

  @Get('users/:id/activity')
  getUserActivity(@Param('id') id: string) {
    return this.adminService.getUserActivity(id);
  }

  @Get('sellers')
  getSellers(@Query() query: AdminUserQueryDto) {
    return this.adminService.getSellers({
      page: query.page,
      limit: query.limit,
      search: query.search,
      status: query.status,
      from: query.from,
      to: query.to,
    });
  }

  @Get('sellers/pending')
  getPendingSellers() {
    return this.adminService.getPendingSellers();
  }

  @Get('sellers/:id')
  getSellerById(@Param('id') id: string) {
    return this.adminService.getSellerById(id);
  }

  @Patch('sellers/:id')
  updateSeller(@Param('id') id: string, @Body() payload: Record<string, any>) {
    return this.adminService.updateSeller(id, payload);
  }

  @Patch('sellers/:id/status')
  updateSellerStatus(@Param('id') id: string, @Body() payload: AdminStatusDto) {
    return this.adminService.updateSellerStatus(id, payload);
  }

  @Patch('sellers/:id/approve')
  approveSeller(@Param('id') id: string) {
    return this.adminService.approveSeller(id);
  }

  @Patch('sellers/:id/reject')
  rejectSeller(@Param('id') id: string) {
    return this.adminService.rejectSeller(id);
  }

  @Get('sellers/:id/products')
  getSellerProducts(@Param('id') id: string) {
    return this.adminService.getSellerProducts(id);
  }

  @Get('sellers/:id/orders')
  getSellerOrders(@Param('id') id: string) {
    return this.adminService.getSellerOrders(id);
  }

  @Get('sellers/:id/earnings')
  getSellerEarnings(@Param('id') id: string) {
    return this.adminService.getSellerEarnings(id);
  }

  @Get('orders')
  getOrders(@Query() query: AdminPaginationDto) {
    return this.adminService.getOrders({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      order: query.order,
      filters: query.filters,
    });
  }

  @Get('orders/:id')
  getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Patch('orders/:id/status')
  updateOrderStatus(@Param('id') id: string, @Body() payload: AdminStatusDto) {
    return this.adminService.updateOrderStatus(id, payload.status);
  }

  @Post('orders/:id/cancel')
  cancelOrder(@Param('id') id: string) {
    return this.adminService.cancelOrder(id);
  }

  @Post('orders/:id/refund')
  refundOrder(@Param('id') id: string) {
    return this.adminService.refundOrder(id);
  }

  @Post('orders/:id/contact-customer')
  contactCustomer(@Param('id') id: string, @Body() payload: { message?: string }) {
    return this.adminService.contactOrderParticipant(id, 'CUSTOMER', payload?.message);
  }

  @Post('orders/:id/contact-seller')
  contactSeller(@Param('id') id: string, @Body() payload: { message?: string }) {
    return this.adminService.contactOrderParticipant(id, 'SELLER', payload?.message);
  }

  @Get('orders/:id/invoice')
  getInvoice(@Param('id') id: string) {
    return this.adminService.getOrderDocument(id, 'invoice');
  }

  @Get('orders/:id/shipping-label')
  getShippingLabel(@Param('id') id: string) {
    return this.adminService.getOrderDocument(id, 'shipping-label');
  }

  @Get('payments')
  getPayments(@Query() query: AdminPaginationDto) {
    return this.adminService.getPayments({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      order: query.order,
      filters: query.filters,
    });
  }

  @Get('products')
  getProducts(@Query() query: AdminPaginationDto) {
    return this.adminService.getProducts({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      order: query.order,
      filters: query.filters,
    });
  }

  @Get('product-queries')
  getProductQueries() {
    return this.adminService.getProductQueries();
  }

  @Get('categories')
  getCategories() {
    return this.adminService.getCategories();
  }

  @Post('categories')
  createCategory(@Body() payload: Record<string, any>) {
    return this.adminService.createCategory(payload);
  }

  @Patch('categories/:id/reorder')
  reorderCategory(@Param('id') id: string, @Body() payload: { sortOrder?: number; parentId?: string | null }) {
    return this.adminService.reorderCategory(id, payload);
  }

  @Patch('categories/:id')
  updateCategory(@Param('id') id: string, @Body() payload: Record<string, any>) {
    return this.adminService.updateCategory(id, payload);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  @Get('brands')
  getBrands(@Query('search') search?: string) {
    return this.adminService.getBrands(search);
  }

  @Post('brands')
  createBrand(@Body() payload: Record<string, any>) {
    return this.adminService.createBrand(payload);
  }

  @Patch('brands/:id')
  updateBrand(@Param('id') id: string, @Body() payload: Record<string, any>) {
    return this.adminService.updateBrand(id, payload);
  }

  @Delete('brands/:id')
  deleteBrand(@Param('id') id: string) {
    return this.adminService.deleteBrand(id);
  }

  @Get('reviews')
  getReviews(@Query() query: AdminPaginationDto) {
    return this.adminService.getReviews({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      order: query.order,
      filters: query.filters,
    });
  }

  @Patch('reviews/:id/status')
  updateReviewStatus(@Param('id') id: string, @Body() payload: AdminStatusDto) { return this.adminService.updateReviewStatus(id, payload.status); }

  @Delete('reviews/:id')
  deleteReview(@Param('id') id: string) { return this.adminService.deleteReview(id); }

  @Post('reviews/:id/reply')
  replyToReview(@Param('id') id: string, @Body() payload: { text?: string }) { return this.adminService.replyToReview(id, payload?.text); }

  @Get('refunds')
  getRefunds(@Query() query: AdminPaginationDto) {
    return this.adminService.getRefunds({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      order: query.order,
      filters: query.filters,
    });
  }

  @Post('refunds')
  createRefund(@Body() payload: Record<string, any>) { return this.adminService.createRefund(payload); }

  @Patch('refunds/:id/status')
  updateRefundStatus(@Param('id') id: string, @Body() payload: { status?: string }) { return this.adminService.updateRefundStatus(id, payload?.status); }

  @Get('packages')
  getPackages() {
    return this.adminService.getPackages();
  }

  @Post('packages')
  createPackage(@Body() payload: Record<string, any>) {
    return this.adminService.createPackage(payload);
  }

  @Patch('packages/:id')
  updatePackage(@Param('id') id: string, @Body() payload: Record<string, any>) {
    return this.adminService.updatePackage(id, payload);
  }

  @Delete('packages/:id')
  deletePackage(@Param('id') id: string) {
    return this.adminService.deletePackage(id);
  }

  @Get('products/:id')
  getProductById(@Param('id') id: string) {
    return this.adminService.getProductById(id);
  }

  @Patch('products/:id/approve')
  approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Patch('products/:id/reject')
  rejectProduct(@Param('id') id: string) {
    return this.adminService.rejectProduct(id);
  }

  @Patch('products/:id/suspend')
  suspendProduct(@Param('id') id: string) {
    return this.adminService.suspendProduct(id);
  }

  @Patch('products/:id/feature')
  featureProduct(@Param('id') id: string) {
    return this.adminService.featureProduct(id);
  }

  @Patch('products/:id/archive')
  archiveProduct(@Param('id') id: string) {
    return this.adminService.archiveProduct(id);
  }

  @Patch('products/:id/status')
  updateProductStatus(@Param('id') id: string, @Body() payload: { status: string }) {
    return this.adminService.updateProductStatus(id, payload?.status);
  }

  @Delete('products/:id')
  deleteProduct(@Param('id') id: string) {
    return this.adminService.deleteProduct(id);
  }

  @Get('seller-applications')
  getSellerApplications() {
    return this.adminService.getSellerApplications();
  }

  @Get('seller-applications/:id')
  getSellerApplicationById(@Param('id') id: string) {
    return this.adminService.getSellerApplicationById(id);
  }

  @Patch('seller-applications/:id/status')
  updateSellerApplicationStatus(@Param('id') id: string, @Body() payload: { status: string }) {
    return this.adminService.updateSellerApplicationStatus(id, payload?.status);
  }

  @Post('seller-applications/:id/approve')
  approveSellerApplication(@Param('id') id: string) {
    return this.adminService.approveSellerApplication(id);
  }

  @Post('seller-applications/:id/reject')
  rejectSellerApplication(@Param('id') id: string) {
    return this.adminService.rejectSellerApplication(id);
  }

  @Post('seller-applications/:id/request-info')
  requestSellerApplicationInfo(@Param('id') id: string, @Body() payload: { message?: string }, @Req() req: any) {
    return this.adminService.requestSellerApplicationInfo(id, payload?.message, req.user.userId);
  }

  @Post('seller-applications/:id/message')
  messageSellerApplication(@Param('id') id: string, @Body() payload: { message?: string }, @Req() req: any) {
    return this.adminService.messageSellerApplication(id, payload?.message, req.user.userId);
  }

  @Get('commission-overview')
  getCommissionOverview(@Query('from') from?: string, @Query('to') to?: string, @Query('sellerId') sellerId?: string, @Query('orderId') orderId?: string) {
    return this.adminService.getCommissionOverview({ from, to, sellerId, orderId });
  }

  @Get('commissions')
  getCommissions(@Query() query: AdminPaginationDto) {
    return this.adminService.getPayments({
      page: query.page,
      limit: query.limit,
      search: query.search,
      sort: query.sort,
      order: query.order,
    });
  }

  @Post('notify-low-inventory')
  notifyLowInventory() {
    return this.adminService.notifyLowInventory();
  }

  @Post('notify-product-reports')
  notifyProductReports() {
    return this.adminService.notifyProductReports();
  }

  @Post('sellers/:sellerId/commission')
  setSellerCommission(@Param('sellerId') sellerId: string, @Body() payload: { commissionRate: number }) {
    return this.adminService.setSellerCommission(Number(sellerId), Number(payload.commissionRate));
  }

  @Get('payouts')
  getPayoutQueue() {
    return this.adminService.getPayoutQueue();
  }

  @Post('payouts/:id/approve')
  approvePayout(@Param('id') id: string) {
    return this.adminService.approvePayout(id);
  }

  @Post('payouts/:id/reject')
  rejectPayout(@Param('id') id: string) {
    return this.adminService.rejectPayout(id);
  }

  @Post('payouts/:id/processing')
  processPayout(@Param('id') id: string) {
    return this.adminService.processPayout(id);
  }

  @Post('payouts/:id/paid')
  markPayoutPaid(@Param('id') id: string) {
    return this.adminService.markPayoutPaid(id);
  }

  @Get('payouts/:id/transaction')
  async getPayoutTransaction(@Param('id') id: string) {
    const payouts = await this.adminService.getPayoutQueue();
    const payout = payouts.find((item: any) => String(item.id) === String(id));
    if (!payout) throw new BadRequestException('Payout not found.');
    return payout;
  }
}
