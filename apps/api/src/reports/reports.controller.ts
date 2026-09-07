import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('sales')
  getSalesReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sellerId') sellerId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getSalesReport(from, to, sellerId, categoryId);
  }

  @Get('orders')
  getOrdersReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sellerId') sellerId?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getOrdersReport(from, to, sellerId, categoryId);
  }

  @Get('products')
  getProductsReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getProductsReport(from, to, categoryId);
  }

  @Get('sellers')
  getSellersReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    return this.reportsService.getSellersReport(from, to, categoryId);
  }

  @Get('customers')
  getCustomersReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getCustomersReport(from, to);
  }

  @Get('financial')
  getFinancialReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.reportsService.getFinancialReport(from, to, sellerId);
  }

  @Get('refunds')
  getRefundsReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.reportsService.getRefundsReport(from, to, sellerId);
  }

  @Get('withdrawals')
  getWithdrawalsReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.reportsService.getWithdrawalsReport(from, to, sellerId);
  }

  @Get('commissions')
  getCommissionReport(
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('sellerId') sellerId?: string,
  ) {
    return this.reportsService.getCommissionReport(from, to, sellerId);
  }
}
