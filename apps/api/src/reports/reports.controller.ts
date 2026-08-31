import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('sales/:period')
  getSalesReport(@Param('period') period: string) {
    return this.reportsService.getSalesReport(period);
  }

  @Get('analytics/:sellerId')
  getAnalytics(@Param('sellerId') sellerId: string) {
    return this.reportsService.getAnalytics(Number(sellerId));
  }

  @Post()
  generateReport(@Body() data: any) {
    return this.reportsService.generateReport(data.type, data.filters);
  }
}
