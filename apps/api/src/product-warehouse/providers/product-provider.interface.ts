export type ProviderSearchOptions = {
  page?: number
  limit?: number
}

export type NormalizedExternalProduct = {
  externalProductId: string
  externalSku?: string | null
  name: string
  description?: string | null
  basePrice: number
  rating?: number | null
  discountPercentage?: number | null
  currency?: string
  stock: number
  brand?: string | null
  category?: string | null
  images: string[]
  attributes?: Array<{ name: string; value: string }>
  variants?: Array<{ name: string; options: string[] }>
}

export type ProviderSearchResult = {
  items: NormalizedExternalProduct[]
  total: number
  page: number
  limit: number
}

export interface ProductProvider {
  readonly id: string
  readonly label: string
  search(query: string, options?: ProviderSearchOptions): Promise<ProviderSearchResult>
  getProduct(externalId: string): Promise<NormalizedExternalProduct>
}