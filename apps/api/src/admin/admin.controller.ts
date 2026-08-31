import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard')
  getDashboard() {
    return this.adminService.getDashboard();
  }

  @Get('sellers')
  getSellers() {
    return this.adminService.getSellers();
  }

  @Get('sellers/pending')
  getPendingSellers() {
    return this.adminService.getPendingSellers();
  }

  @Get('sellers/:id')
  getSellerById(@Param('id') id: string) {
    return this.adminService.getSellerById(Number(id));
  }

  @Patch('sellers/:id/approve')
  approveSeller(@Param('id') id: string) {
    return this.adminService.approveSeller(Number(id));
  }

  @Patch('sellers/:id/reject')
  rejectSeller(@Param('id') id: string) {
    return this.adminService.rejectSeller(Number(id));
  }

  @Get('products')
  getProducts() {
    return this.adminService.getProducts();
  }

  @Patch('products/:id/approve')
  approveProduct(@Param('id') id: string) {
    return this.adminService.approveProduct(id);
  }

  @Patch('products/:id/reject')
  rejectProduct(@Param('id') id: string) {
    return this.adminService.rejectProduct(id);
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

  @Post('seller-applications/:id/approve')
  approveSellerApplication(@Param('id') id: string) {
    return this.adminService.approveSellerApplication(id);
  }

  @Post('seller-applications/:id/reject')
  rejectSellerApplication(@Param('id') id: string) {
    return this.adminService.rejectSellerApplication(id);
  }

  @Get('commission-overview')
  getCommissionOverview() {
    return this.adminService.getCommissionOverview();
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
    return this.adminService.approvePayout(Number(id));
  }
}
