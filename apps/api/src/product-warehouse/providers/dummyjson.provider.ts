import { BadGatewayException, Injectable } from '@nestjs/common'
import type { NormalizedExternalProduct, ProductProvider, ProviderSearchOptions, ProviderSearchResult } from './product-provider.interface'

type DummyProduct = {
  id: number
  title: string
  description?: string
  price?: number
  stock?: number
  brand?: string
  category?: string
  thumbnail?: string
  images?: string[]
  sku?: string
  rating?: number
  discountPercentage?: number
}

@Injectable()
export class DummyJsonProvider implements ProductProvider {
  readonly id = 'dummyjson'
  readonly label = 'DummyJSON catalog'
  private readonly baseUrl = 'https://dummyjson.com'

  private normalize(product: DummyProduct): NormalizedExternalProduct {
    return {
      externalProductId: String(product.id),
      externalSku: product.sku || null,
      name: product.title,
      description: product.description || null,
      basePrice: Number(product.price || 0),
      rating: product.rating ?? null,
      discountPercentage: product.discountPercentage ?? null,
      currency: 'USD',
      stock: Number(product.stock || 0),
      brand: product.brand || null,
      category: product.category || null,
      images: Array.from(new Set([...(product.images || []), product.thumbnail].filter((image): image is string => Boolean(image)))),
      attributes: product.rating ? [{ name: 'Rating', value: String(product.rating) }] : [],
      variants: [],
    }
  }

  private async request<T>(path: string): Promise<T> {
    let response: Response
    try {
      response = await fetch(`${this.baseUrl}${path}`)
    } catch {
      throw new BadGatewayException('The product provider could not be reached.')
    }
    if (!response.ok) throw new BadGatewayException(`The product provider returned ${response.status}.`)
    return response.json() as Promise<T>
  }

  async search(query: string, options: ProviderSearchOptions = {}): Promise<ProviderSearchResult> {
    const page = Math.max(1, Number(options.page || 1))
    const limit = Math.min(50, Math.max(1, Number(options.limit || 24)))
    const skip = (page - 1) * limit
    const params = new URLSearchParams({ limit: String(limit), skip: String(skip) })
    const payload = await this.request<{ products: DummyProduct[]; total: number }>(query.trim() ? `/products/search?q=${encodeURIComponent(query.trim())}&${params}` : `/products?${params}`)
    return { items: payload.products.map((product) => this.normalize(product)), total: payload.total, page, limit }
  }

  async getProduct(externalId: string) {
    return this.normalize(await this.request<DummyProduct>(`/products/${encodeURIComponent(externalId)}`))
  }
}