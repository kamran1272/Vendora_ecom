import { Module } from '@nestjs/common';
import { ProductWarehouseController } from './product-warehouse.controller';
import { ProductWarehouseService } from './product-warehouse.service';
import { DummyJsonProvider } from './providers/dummyjson.provider';
import { FakeStoreApiProvider } from './providers/fake-store.provider';
import { EscuelaJsProvider } from './providers/escuelajs.provider';

@Module({
  controllers: [ProductWarehouseController],
  providers: [
    ProductWarehouseService,
    DummyJsonProvider,
    FakeStoreApiProvider,
    EscuelaJsProvider,
  ],
  exports: [ProductWarehouseService],
})
export class ProductWarehouseModule {}
