import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { ProductWarehouseService } from '../product-warehouse.service';
import { DummyJsonProvider } from './dummyjson.provider';
import { FakeStoreApiProvider } from './fake-store.provider';
import { EscuelaJsProvider } from './escuelajs.provider';

describe('product warehouse provider registry', () => {
  it('includes multiple free public product providers', async () => {
    const service = new ProductWarehouseService(
      {} as any,
      new DummyJsonProvider(),
      new FakeStoreApiProvider(),
      new EscuelaJsProvider(),
    );

    const providers = service.listProviders();
    assert.deepEqual(
      providers.map((provider) => provider.id).sort(),
      ['dummyjson', 'escuelajs', 'fakestore'].sort(),
    );
  });
});
