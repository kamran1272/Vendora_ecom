import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { SellersModule } from '../sellers/sellers.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProductWarehouseModule } from '../product-warehouse/product-warehouse.module';

@Module({
  imports: [SellersModule, PaymentsModule, ProductWarehouseModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
