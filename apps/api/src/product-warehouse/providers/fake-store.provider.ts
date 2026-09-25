import { BadGatewayException, Injectable } from '@nestjs/common';
import type {
  NormalizedExternalProduct,
  ProductProvider,
  ProviderSearchOptions,
  ProviderSearchResult,
} from './product-provider.interface';

type FakeStoreProduct = {
  id: number;
  title: string;
  price: number;
  description?: string;
  category?: string;
  image?: string;
  rating?: {
    rate?: number;
    count?: number;
  };
};

@Injectable()
export class FakeStoreApiProvider implements ProductProvider {
  readonly id = 'fakestore';
  readonly label = 'Fake Store API';
  private readonly baseUrl = 'https://fakestoreapi.com';

  private normalize(product: FakeStoreProduct): NormalizedExternalProduct {
    const rating = typeof product.rating?.rate === 'number' ? product.rating.rate : null;

    return {
      externalProductId: String(product.id),
      externalSku: null,
      name: product.title,
      description: product.description || null,
      basePrice: Number(product.price || 0),
      rating,
      discountPercentage: null,
      currency: 'USD',
      stock: 100,
      brand: null,
      category: product.category || null,
      images: product.image ? [product.image] : [],
      attributes: rating !== null ? [{ name: 'Rating', value: String(rating) }] : [],
      variants: [],
    };
  }

  private async request<T>(path: string): Promise<T> {
    const response = await fetch(`${this.baseUrl}${path}`);
    if (!response.ok) {
      throw new BadGatewayException(`The product provider returned ${response.status}.`);
    }
    return response.json() as Promise<T>;
  }

  async search(query: string, options: ProviderSearchOptions = {}): Promise<ProviderSearchResult> {
    const page = Math.max(1, Number(options.page || 1));
    const limit = Math.min(50, Math.max(1, Number(options.limit || 24)));

    const products = await this.request<FakeStoreProduct[]>('/products');
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? products.filter((product) => {
          const haystack = [
            product.title,
            product.description,
            product.category,
          ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
          return haystack.includes(needle);
        })
      : products;

    const total = filtered.length;
    const start = (page - 1) * limit;
    const items = filtered.slice(start, start + limit).map((product) => this.normalize(product));

    return { items, total, page, limit };
  }

  async getProduct(externalId: string) {
    const product = await this.request<FakeStoreProduct>(`/products/${encodeURIComponent(externalId)}`);
    return this.normalize(product);
  }
}
