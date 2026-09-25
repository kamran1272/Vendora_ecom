import { BadGatewayException, Injectable } from '@nestjs/common';
import type {
  NormalizedExternalProduct,
  ProductProvider,
  ProviderSearchOptions,
  ProviderSearchResult,
} from './product-provider.interface';

type EscuelaJsCategory = {
  id?: number;
  name?: string;
};

type EscuelaJsProduct = {
  id: number;
  title: string;
  price: number;
  description?: string;
  category?: EscuelaJsCategory;
  images?: string[];
};

@Injectable()
export class EscuelaJsProvider implements ProductProvider {
  readonly id = 'escuelajs';
  readonly label = 'EscuelaJS store';
  private readonly baseUrl = 'https://api.escuelajs.co/api/v1';

  private normalize(product: EscuelaJsProduct): NormalizedExternalProduct {
    return {
      externalProductId: String(product.id),
      externalSku: null,
      name: product.title,
      description: product.description || null,
      basePrice: Number(product.price || 0),
      rating: null,
      discountPercentage: null,
      currency: 'USD',
      stock: 100,
      brand: null,
      category: product.category?.name || null,
      images: Array.isArray(product.images) ? product.images.filter(Boolean) : [],
      attributes: [],
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

    const products = await this.request<EscuelaJsProduct[]>('/products?offset=0&limit=250');
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? products.filter((product) => {
          const haystack = [product.title, product.description, product.category?.name]
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
    const product = await this.request<EscuelaJsProduct>(`/products/${encodeURIComponent(externalId)}`);
    return this.normalize(product);
  }
}
