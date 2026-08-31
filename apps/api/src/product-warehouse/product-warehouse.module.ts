import { Module } from '@nestjs/common';
import { ProductWarehouseController } from './product-warehouse.controller';
import { ProductWarehouseService } from './product-warehouse.service';

@Module({
  controllers: [ProductWarehouseController],
  providers: [ProductWarehouseService],
  exports: [ProductWarehouseService],
})
export class ProductWarehouseModule {}
