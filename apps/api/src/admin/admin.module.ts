import { Module } from '@nestjs/common';
import { PaymentsModule } from '../payments/payments.module';
import { SellersModule } from '../sellers/sellers.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { ProductWarehouseModule } from '../product-warehouse/product-warehouse.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SellersModule, PaymentsModule, ProductWarehouseModule, NotificationsModule, SettingsModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
