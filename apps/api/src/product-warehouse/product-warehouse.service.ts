import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@prisma/client';
import { DummyJsonProvider } from './providers/dummyjson.provider';
import type { NormalizedExternalProduct, ProductProvider } from './providers/product-provider.interface';

const unlimited = (limit: number) => limit < 0;

@Injectable()
export class ProductWarehouseService {
  private readonly providers: Map<string, ProductProvider>;

  constructor(private readonly prisma: PrismaService, dummyJsonProvider: DummyJsonProvider) {
    this.providers = new Map([[dummyJsonProvider.id, dummyJsonProvider]]);
  }

  private parseImages(images: string | null) {
    try {
      return images ? JSON.parse(images) : [];
    } catch {
      return [];
    }
  }

  private parseJson<T>(value: string | null, fallback: T): T {
    try {
      return value ? JSON.parse(value) as T : fallback;
    } catch {
      return fallback;
    }
  }

  private formatProduct(product: any) {
    return {
      ...product,
      images: this.parseImages(product.images),
      attributes: this.parseJson(product.attributes, []),
      variants: this.parseJson(product.variants, []),
    };
  }

  private normalizePage(page?: number) {
    const value = Number(page ?? 1);
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 1;
  }

  private normalizeLimit(limit?: number) {
    const value = Number(limit ?? 24);
    return Number.isFinite(value) && value > 0 ? Math.min(100, Math.floor(value)) : 24;
  }

  private normalizeSort(sort?: string) {
    switch (String(sort ?? 'newest').trim().toLowerCase()) {
      case 'oldest':
        return 'oldest';
      case 'price_low':
        return 'price_low';
      case 'price_high':
        return 'price_high';
      default:
        return 'newest';
    }
  }

  private getProvider(providerId: string) {
    const provider = this.providers.get(String(providerId || '').trim().toLowerCase());
    if (!provider) throw new BadRequestException('This product provider is not configured.');
    return provider;
  }

  listProviders() {
    return [...this.providers.values()].map((provider) => ({ id: provider.id, label: provider.label }));
  }

  searchProvider(providerId: string, query: string, page?: number, limit?: number) {
    return this.getProvider(providerId).search(query, { page, limit });
  }

  async getSummary() {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const [total, active, importedToday, providers, failedImports] = await Promise.all([
      this.prisma.warehouseProduct.count(),
      this.prisma.warehouseProduct.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.warehouseProduct.count({ where: { importedAt: { gte: startOfDay } } }),
      this.prisma.warehouseProduct.findMany({ distinct: ['sourceId'], select: { sourceId: true } }),
      this.prisma.warehouseProduct.count({ where: { lastImportError: { not: null } } }),
    ]);
    return { total, active, importedToday, providers: providers.length, failedImports };
  }

  getImportHistory(limit = 20) {
    return this.prisma.warehouseImport.findMany({ orderBy: { createdAt: 'desc' }, take: Math.min(50, Math.max(1, Number(limit) || 20)) });
  }

  async listWarehouse(query: { page?: number; limit?: number; search?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number; stockStatus?: string; status?: string; sort?: string; includeInactive?: boolean }, userId?: string) {
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit);
    const search = query.search?.trim();
    const sort = this.normalizeSort(query.sort);
    const seller = userId ? await this.prisma.seller.findUnique({ where: { userId }, select: { id: true, status: true } }) : null;
    if (userId && (!seller || String(seller.status || '').toUpperCase() !== 'ACTIVE')) {
      throw new BadRequestException('Only approved sellers can browse the product storehouse.');
    }
    const where: any = query.includeInactive
      ? {}
      : seller
        ? { OR: [{ status: 'PUBLISHED' }, { sellerProducts: { some: { sellerId: seller.id } } }] }
        : { status: 'PUBLISHED' };
    if (search) {
      const searchWhere = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
      if (where.OR) {
        where.AND = [{ OR: where.OR }, { OR: searchWhere }];
        delete where.OR;
      } else {
        where.OR = searchWhere;
      }
    }
    if (query.category) where.category = query.category;
    if (query.brand) where.brand = query.brand;
    const minPrice = Number(query.minPrice);
    const maxPrice = Number(query.maxPrice);
    if (Number.isFinite(minPrice) || Number.isFinite(maxPrice)) {
      where.basePrice = {
        ...(Number.isFinite(minPrice) ? { gte: Math.max(0, minPrice) } : {}),
        ...(Number.isFinite(maxPrice) ? { lte: Math.max(0, maxPrice) } : {}),
      };
    }
    if (query.status) where.status = query.status;
    if (query.stockStatus === 'in_stock') where.stock = { gt: 0 };
    if (query.stockStatus === 'out_of_stock') where.stock = { lte: 0 };

    const orderBy: Prisma.WarehouseProductOrderByWithRelationInput = sort === 'oldest' ? { createdAt: 'asc' } : sort === 'price_low' ? { basePrice: 'asc' } : sort === 'price_high' ? { basePrice: 'desc' } : { createdAt: 'desc' };
    const [items, total, categories, brands, sellerProducts] = await Promise.all([
      this.prisma.warehouseProduct.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.warehouseProduct.count({ where }),
      this.prisma.warehouseProduct.findMany({ where: { status: 'PUBLISHED' }, distinct: ['category'], select: { category: true } }),
      this.prisma.warehouseProduct.findMany({ where: { status: 'PUBLISHED' }, distinct: ['brand'], select: { brand: true } }),
      seller ? this.prisma.sellerProduct.findMany({ where: { sellerId: seller.id }, select: { id: true, warehouseProductId: true, sellingPrice: true, sellerMargin: true, status: true } }) : Promise.resolve([]),
    ]);
    const sellerProductMap = new Map(sellerProducts.map((product) => [product.warehouseProductId, product]));
    return {
      items: items.map((item) => {
        const sellerProduct = sellerProductMap.get(item.id);
        return { ...this.formatProduct(item), sellerProductId: sellerProduct?.id ?? null, addedToStore: Boolean(sellerProduct), sellerMargin: sellerProduct?.sellerMargin ?? 0, sellerPrice: sellerProduct?.sellingPrice ?? Number(item.basePrice), sellerStatus: sellerProduct?.status ?? null };
      }),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page < Math.ceil(total / limit),
      categories: categories.map((item) => item.category).filter(Boolean),
      brands: brands.map((item) => item.brand).filter(Boolean),
    };
  }

  private toMarketplaceProduct(product: any, listing?: any) {
    const warehouse = listing?.warehouseProduct ?? product;
    const imageList = Array.isArray(warehouse.images) ? warehouse.images : this.parseImages(warehouse.images);
    return {
      id: listing?.id ?? warehouse.id,
      warehouseProductId: warehouse.id,
      name: warehouse.name,
      slug: warehouse.slug || warehouse.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: warehouse.category ?? 'General',
      brand: warehouse.brand ?? 'Generic',
      seller: listing?.seller?.user?.name ?? 'Vendora seller',
      shop: listing?.shop?.name ?? 'Vendora seller',
      shopId: listing?.shopId ?? null,
      price: Number(listing?.sellingPrice ?? warehouse.basePrice ?? 0),
      oldPrice: Number(warehouse.basePrice ?? 0),
      rating: Number(warehouse.rating ?? 0),
      popularity: Number(warehouse.popularity ?? warehouse.sales ?? 0),
      inStock: Number(warehouse.stock ?? 0) > 0,
      attributes: Array.isArray(warehouse.attributes) ? warehouse.attributes : ['featured'],
      badge: warehouse.badge ?? null,
      description: warehouse.description ?? '',
      images: imageList,
      stock: Number(warehouse.stock ?? 0),
      sellerId: listing?.sellerId ?? null,
    };
  }

  async listPublicProducts(query: any = {}) {
    const page = this.normalizePage(query.page);
    const limit = this.normalizeLimit(query.limit ?? 12);
    const warehouseWhere: any = { status: 'PUBLISHED' };
    const search = String(query.search || '').trim();
    if (search) warehouseWhere.OR = [{ name: { contains: search } }, { sku: { contains: search } }, { barcode: { contains: search } }];
    if (query.category) warehouseWhere.category = query.category;
    if (query.brand) warehouseWhere.brand = query.brand;
    if (query.stockStatus === 'in_stock') warehouseWhere.stock = { gt: 0 };
    if (query.stockStatus === 'out_of_stock') warehouseWhere.stock = { lte: 0 };
    if (query.minPrice !== undefined || query.maxPrice !== undefined) warehouseWhere.basePrice = { ...(query.minPrice !== undefined ? { gte: Math.max(0, Number(query.minPrice)) } : {}), ...(query.maxPrice !== undefined ? { lte: Math.max(0, Number(query.maxPrice)) } : {}) };
    const orderBy: Prisma.SellerProductOrderByWithRelationInput = this.normalizeSort(query.sort) === 'oldest' ? { createdAt: 'asc' } : { createdAt: 'desc' };
    const listingWhere: any = { status: 'ACTIVE', shopId: { not: null }, seller: { status: 'ACTIVE' }, warehouseProduct: warehouseWhere };
    if (query.seller) listingWhere.shop = { OR: [{ name: { contains: String(query.seller).trim() } }, { slug: { contains: String(query.seller).trim().toLowerCase() } }] };
    const [items, total, categories, brands] = await Promise.all([
      this.prisma.sellerProduct.findMany({ where: listingWhere, include: { warehouseProduct: true, shop: true, seller: { include: { user: { select: { name: true } } } } }, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.sellerProduct.count({ where: listingWhere }),
      this.prisma.warehouseProduct.findMany({ where: { status: 'PUBLISHED' }, distinct: ['category'], select: { category: true } }),
      this.prisma.warehouseProduct.findMany({ where: { status: 'PUBLISHED' }, distinct: ['brand'], select: { brand: true } }),
    ]);

    return {
      items: items.map((item) => this.toMarketplaceProduct(item.warehouseProduct, item)),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      hasNext: page < Math.ceil(total / limit),
      categories: categories.map((item) => item.category).filter(Boolean),
      brands: brands.map((item) => item.brand).filter(Boolean),
    };
  }

  async getPublicProduct(id: string) {
    const listing = await this.prisma.sellerProduct.findFirst({ where: { id, status: 'ACTIVE', shopId: { not: null }, seller: { status: 'ACTIVE' }, warehouseProduct: { status: 'PUBLISHED' } }, include: { warehouseProduct: true, shop: true, seller: { include: { user: { select: { name: true } } } } } });
    if (!listing) throw new NotFoundException('Published product listing not found.');
    return this.toMarketplaceProduct(listing.warehouseProduct, listing);
  }

  async getProduct(id: string) {
    const product = await this.prisma.warehouseProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Warehouse product not found.');
    return this.formatProduct(product);
  }

  async getSellerProduct(userId: string, id: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop) throw new NotFoundException('Active seller shop not found.');
    const product = await this.prisma.sellerProduct.findFirst({
      where: { id, sellerId: seller.id, shopId: seller.shop?.id },
      include: { warehouseProduct: true },
    });
    if (!product) throw new NotFoundException('Seller product not found.');
    return { ...product, warehouseProduct: this.formatProduct(product.warehouseProduct) };
  }

  async createWarehouseProduct(data: any) {
    const sku = String(data.sku || '').trim();
    if (!sku) throw new BadRequestException('A warehouse SKU is required.');

    const values = {
      name: String(data.name || '').trim(),
      description: data.description ?? null,
      barcode: data.barcode ?? null,
      images: JSON.stringify(data.images || []),
      attributes: JSON.stringify(data.attributes || []),
      variants: JSON.stringify(data.variants || []),
      category: data.category ?? null,
      brand: data.brand ?? null,
      sourceId: 'manual',
      externalProductId: `manual:${sku}`,
      externalSku: sku,
      currency: data.currency || 'USD',
      basePrice: Number(data.basePrice),
      sellerMargin: Number(data.sellerMargin || 0),
      stock: Number(data.stock || 0),
      status: data.status || 'PUBLISHED',
    };

    if (!values.name || !Number.isFinite(values.basePrice) || values.basePrice < 0) {
      throw new BadRequestException('Name and a valid non-negative base price are required.');
    }

    return this.prisma.warehouseProduct.upsert({
      where: { sku },
      update: values,
      create: { ...values, sku },
    });
  }

  private warehouseDataFromExternal(sourceId: string, product: NormalizedExternalProduct) {
    const normalizedSourceId = String(sourceId || '').trim().toLowerCase();
    const externalProductId = String(product.externalProductId || '').trim();
    const name = String(product.name || '').trim();
    const basePrice = Number(product.basePrice);
    const stock = Number(product.stock);
    if (!externalProductId) throw new BadRequestException('The provider returned a product without an external ID.');
    if (!normalizedSourceId) throw new BadRequestException('The product source is not configured correctly.');
    if (!name) throw new BadRequestException('The provider returned a product without a title.');
    if (!Number.isFinite(basePrice) || basePrice < 0) throw new BadRequestException('The provider returned an invalid price.');
    if (!Number.isFinite(stock) || stock < 0) throw new BadRequestException('The provider returned an invalid stock value.');
    const externalSku = product.externalSku?.trim() || null;
    const images = [...new Set((product.images || []).map((image) => String(image).trim()).filter(Boolean))];
    const attributes = Array.isArray(product.attributes) ? product.attributes : [];
    const variants = Array.isArray(product.variants) ? product.variants : [];
    return {
      name,
      description: product.description ?? null,
      sku: `${normalizedSourceId}-${externalProductId}`.replace(/[^a-zA-Z0-9._-]+/g, '-'),
      externalSku,
      barcode: null,
      sourceId: normalizedSourceId,
      externalProductId,
      currency: product.currency || 'USD',
      images: JSON.stringify(images),
      category: product.category ?? null,
      brand: product.brand ?? null,
      basePrice,
      rating: product.rating ?? null,
      discountPercentage: product.discountPercentage ?? null,
      sellerMargin: 0,
      stock: Math.floor(stock),
      attributes: JSON.stringify(attributes),
      variants: JSON.stringify(variants),
      importedAt: new Date(),
      lastImportError: null,
      status: 'PUBLISHED',
    };
  }

  async importProduct(providerId: string, externalId: string) {
    const provider = this.getProvider(providerId);
    const requestedExternalId = String(externalId || '').trim();
    if (!requestedExternalId) throw new BadRequestException('An external product ID is required.');
    const normalized = await provider.getProduct(requestedExternalId);
    const data = this.warehouseDataFromExternal(provider.id, normalized);
    const existing = await this.prisma.warehouseProduct.findUnique({ where: { sourceId_externalProductId: { sourceId: provider.id, externalProductId: normalized.externalProductId } } });
    let product;
    try {
      product = await this.prisma.warehouseProduct.upsert({
        where: { sourceId_externalProductId: { sourceId: provider.id, externalProductId: normalized.externalProductId } },
        update: { ...data, sku: existing?.sku ?? data.sku },
        create: data,
      });
    } catch (error) {
      if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') throw error;
      const racedProduct = await this.prisma.warehouseProduct.findUnique({ where: { sourceId_externalProductId: { sourceId: provider.id, externalProductId: normalized.externalProductId } } });
      if (!racedProduct) throw error;
      product = await this.prisma.warehouseProduct.update({ where: { id: racedProduct.id }, data: { ...data, sku: racedProduct.sku } });
    }
    return { product: this.formatProduct(product), action: existing ? 'updated' : 'created' };
  }

  async importProducts(providerId: string, externalIds: string[]) {
    const ids = [...new Set((externalIds || []).map(String).map((id) => id.trim()).filter(Boolean))];
    if (!ids.length) throw new BadRequestException('Select at least one external product.');
    if (ids.length > 50) throw new BadRequestException('Import is limited to 50 products per batch.');
    const history = await this.prisma.warehouseImport.create({ data: { providerId, status: 'RUNNING', errors: '[]' } });
    const result = { success: true, createdCount: 0, updatedCount: 0, failedCount: 0, failures: [] as Array<{ externalId: string; message: string }> };
    for (const externalId of ids) {
      try {
        const imported = await this.importProduct(providerId, externalId);
        if (imported.action === 'created') result.createdCount += 1;
        else result.updatedCount += 1;
      } catch (error) {
        result.failedCount += 1;
        result.failures.push({ externalId, message: error instanceof Error ? error.message : 'Import failed.' });
      }
    }
    await this.prisma.warehouseImport.update({ where: { id: history.id }, data: { status: result.failedCount ? 'COMPLETED_WITH_ERRORS' : 'COMPLETED', createdCount: result.createdCount, updatedCount: result.updatedCount, failedCount: result.failedCount, errors: JSON.stringify(result.failures), completedAt: new Date() } });
    return { ...result, importId: history.id };
  }

  async addAllFilteredProducts(userId: string, query: { search?: string; category?: string; brand?: string; minPrice?: number; maxPrice?: number; stockStatus?: string; sort?: string }) {
    const result = await this.listWarehouse({ ...query, page: 1, limit: 50 });
    if (result.total > 50) {
      return { success: false, code: 'BATCH_LIMIT_EXCEEDED', matchedCount: result.total, batchLimit: 50, message: 'Refine the filters before adding products. A maximum of 50 products can be added at once.' };
    }
    return this.addProducts(userId, result.items.filter((product: any) => product.stock > 0).map((product: any) => product.id));
  }

  async updateWarehouseProduct(id: string, data: any) {
    return this.prisma.warehouseProduct.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.sku !== undefined ? { sku: data.sku } : {}),
        ...(data.barcode !== undefined ? { barcode: data.barcode } : {}),
        ...(data.images !== undefined ? { images: JSON.stringify(data.images) } : {}),
        ...(data.attributes !== undefined ? { attributes: JSON.stringify(data.attributes) } : {}),
        ...(data.variants !== undefined ? { variants: JSON.stringify(data.variants) } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.brand !== undefined ? { brand: data.brand } : {}),
        ...(data.basePrice !== undefined ? { basePrice: Number(data.basePrice) } : {}),
        ...(data.rating !== undefined ? { rating: data.rating === null ? null : Number(data.rating) } : {}),
        ...(data.discountPercentage !== undefined ? { discountPercentage: data.discountPercentage === null ? null : Number(data.discountPercentage) } : {}),
        ...(data.sellerMargin !== undefined ? { sellerMargin: Number(data.sellerMargin) } : {}),
        ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async deleteWarehouseProduct(id: string) {
    const assignments = await this.prisma.sellerProduct.count({ where: { warehouseProductId: id } });
    if (assignments > 0) {
      throw new BadRequestException('This warehouse product is assigned to sellers. Deactivate it instead of deleting it.');
    }
    await this.prisma.warehouseProduct.delete({ where: { id } });
    return { message: 'Warehouse product deleted successfully.' };
  }

  private async getPlan(sellerId: string, tx: Prisma.TransactionClient | PrismaService = this.prisma) {
    let subscription = await tx.sellerSubscription.findFirst({
      where: { sellerId, status: 'ACTIVE', plan: { status: 'ACTIVE' } },
      include: { plan: true },
    });
    if (!subscription) {
      const plan = await tx.subscriptionPlan.upsert({
        where: { name: 'FREE' },
        update: {},
        create: { name: 'FREE', productLimit: 200, price: 0, duration: 30 },
      });
      subscription = await tx.sellerSubscription.upsert({
        where: { sellerId },
        update: { planId: plan.id, status: 'ACTIVE', expiresAt: null },
        create: { sellerId, planId: plan.id, status: 'ACTIVE' },
        include: { plan: true },
      });
    }
    return subscription.plan;
  }

  async getSellerState(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId } });
    if (!seller) throw new NotFoundException('Seller account not found.');
    const [plan, products] = await Promise.all([
      this.getPlan(seller.id),
      this.prisma.sellerProduct.count({ where: { sellerId: seller.id } }),
    ]);
    return { sellerId: seller.id, status: seller.status, plan: { ...plan, features: JSON.parse(plan.features || '[]') }, currentCount: products, remainingSlots: unlimited(plan.productLimit) ? null : Math.max(0, plan.productLimit - products) };
  }

  async addProducts(userId: string, productIds: string[]) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.findUnique({ where: { userId } });
      if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE') {
        throw new BadRequestException('Only approved sellers can add warehouse products.');
      }

      const requestedIds = [...new Set((productIds || []).filter(Boolean))];
      if (!requestedIds.length) {
        throw new BadRequestException('Select at least one product.');
      }

      const [plan, currentCount, products, shop] = await Promise.all([
        this.getPlan(seller.id, tx),
        tx.sellerProduct.count({ where: { sellerId: seller.id } }),
        tx.warehouseProduct.findMany({ where: { id: { in: requestedIds }, status: 'PUBLISHED' } }),
        tx.shop.findUnique({ where: { sellerId: seller.id }, select: { id: true } }),
      ]);

      if (products.length !== requestedIds.length) {
        throw new BadRequestException('One or more warehouse products are unavailable.');
      }

      const outOfStock = products.filter((product) => Number(product.stock ?? 0) <= 0);
      if (outOfStock.length) {
        throw new BadRequestException('Out-of-stock products cannot be added.');
      }

      if (!shop) {
        throw new BadRequestException('Create your seller shop before adding warehouse products.');
      }

      const existing = await tx.sellerProduct.findMany({
        where: { sellerId: seller.id, warehouseProductId: { in: requestedIds } },
        select: { warehouseProductId: true },
      });

      const limit = Number(plan?.productLimit ?? 0);
      const existingIds = new Set(existing.map((item) => item.warehouseProductId));
      const replacedCount = products.filter((product) => existingIds.has(product.id)).length;
      const finalCount = currentCount - replacedCount + products.length;

      if (!unlimited(limit) && finalCount > limit) {
        return {
          success: false,
          code: 'PRODUCT_LIMIT_EXCEEDED',
          currentCount,
          productLimit: limit,
          requestedCount: products.length,
          remainingSlots: Math.max(0, limit - currentCount),
        };
      }

      if (existing.length) {
        await tx.sellerProduct.deleteMany({
          where: { sellerId: seller.id, warehouseProductId: { in: requestedIds } },
        });
      }

      await tx.sellerProduct.createMany({
        data: products.map((product) => ({
          sellerId: seller.id,
          shopId: shop.id,
          warehouseProductId: product.id,
            sellingPrice: Number(product.basePrice ?? 0),
            sellerMargin: 0,
        })),
      });

      return {
        success: true,
        createdCount: products.length,
        alreadyExistsCount: 0,
        failedCount: 0,
        addedCount: products.length,
        replacedCount,
        message: replacedCount
          ? `${products.length} product${products.length === 1 ? '' : 's'} synchronized. ${replacedCount} previous assignment${replacedCount === 1 ? '' : 's'} replaced.`
          : `${products.length} product${products.length === 1 ? '' : 's'} added successfully.`,
      };
      });

      return result;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new ConflictException('A product assignment changed while the store was being synchronized. Please try again.');
      }
      throw error;
    }
  }

  async removeProduct(userId: string, sellerProductId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop) throw new NotFoundException('Active seller shop not found.');
    const product = await this.prisma.sellerProduct.findFirst({ where: { id: sellerProductId, sellerId: seller.id, shopId: seller.shop?.id } });
    if (!product) throw new NotFoundException('Store product not found.');
    await this.prisma.sellerProduct.delete({ where: { id: product.id } });
    return { success: true, message: 'Product removed from your store.' };
  }

  async removeProductByWarehouseProduct(userId: string, warehouseProductId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId }, include: { shop: { select: { id: true } } } });
    if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE' || !seller.shop) throw new NotFoundException('Active seller shop not found.');
    const product = await this.prisma.sellerProduct.findFirst({ where: { sellerId: seller.id, warehouseProductId, shopId: seller.shop?.id } });
    if (!product) throw new NotFoundException('This product is not assigned to your storehouse.');
    await this.prisma.sellerProduct.delete({ where: { id: product.id } });
    return { success: true, message: 'Product removed from your storehouse.' };
  }

  async listPlans() {
    for (const plan of [
      { name: 'FREE', productLimit: 200, price: 0 },
      { name: 'BASIC', productLimit: 500, price: 19 },
      { name: 'PREMIUM', productLimit: 1000, price: 49 },
      { name: 'ENTERPRISE', productLimit: -1, price: 99 },
    ]) {
      await this.prisma.subscriptionPlan.upsert({ where: { name: plan.name }, update: {}, create: plan });
    }
    return this.prisma.subscriptionPlan.findMany({ orderBy: { price: 'asc' } });
  }

  async createPlan(data: any) {
    const values = this.planData(data);
    return this.prisma.subscriptionPlan.create({ data: values as Prisma.SubscriptionPlanCreateInput });
  }

  async updatePlan(id: string, data: any) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: this.planData(data, true) });
  }

  async deletePlan(id: string) {
    const subscriptions = await this.prisma.sellerSubscription.count({ where: { planId: id } });
    if (subscriptions > 0) {
      throw new BadRequestException('This plan cannot be deleted because sellers are subscribed to it. Deactivate it instead.');
    }

    return this.prisma.subscriptionPlan.delete({ where: { id } });
  }

  private planData(data: any, partial = false) {
    const values: Prisma.SubscriptionPlanCreateInput = {
      name: String(data.name || '').trim(),
      price: Number(data.price ?? 0),
      productLimit: Number(data.productLimit ?? -1),
      orderLimit: Number(data.orderLimit ?? -1),
      storageLimit: Number(data.storageLimit ?? -1),
      duration: Number(data.duration ?? 30),
      features: JSON.stringify(data.features ?? []),
      analytics: Boolean(data.analytics),
      support: data.support || 'STANDARD',
      featuredProducts: Boolean(data.featuredProducts),
      customShop: Boolean(data.customShop),
      status: data.status || 'ACTIVE',
    };

    if (!partial) return values;

    return Object.fromEntries(Object.entries(values).filter(([key]) => data[key] !== undefined));
  }
}
