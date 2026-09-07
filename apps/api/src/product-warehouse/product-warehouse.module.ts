import { Module } from '@nestjs/common';
import { ProductWarehouseController } from './product-warehouse.controller';
import { ProductWarehouseService } from './product-warehouse.service';
import { DummyJsonProvider } from './providers/dummyjson.provider';

@Module({
  controllers: [ProductWarehouseController],
  providers: [ProductWarehouseService, DummyJsonProvider],
  exports: [ProductWarehouseService],
})
export class ProductWarehouseModule {}
