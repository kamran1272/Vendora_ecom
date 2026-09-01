import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { Prisma } from '@prisma/client';

const unlimited = (limit: number) => limit < 0;

@Injectable()
export class ProductWarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  private parseImages(images: string | null) {
    try {
      return images ? JSON.parse(images) : [];
    } catch {
      return [];
    }
  }

  private formatProduct(product: any) {
    return { ...product, images: this.parseImages(product.images) };
  }

  async listWarehouse(query: { page?: number; limit?: number; search?: string; category?: string; brand?: string; stockStatus?: string; sort?: string; includeInactive?: boolean }) {
    const page = Math.max(1, Number(query.page || 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit || 24)));
    const search = query.search?.trim();
    const where: any = query.includeInactive ? {} : { status: 'PUBLISHED' };
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { sku: { contains: search } },
        { barcode: { contains: search } },
      ];
    }
    if (query.category) where.category = query.category;
    if (query.brand) where.brand = query.brand;
    if (query.stockStatus === 'in_stock') where.stock = { gt: 0 };
    if (query.stockStatus === 'out_of_stock') where.stock = { lte: 0 };

    const orderBy: Prisma.WarehouseProductOrderByWithRelationInput = query.sort === 'oldest' ? { createdAt: 'asc' } : query.sort === 'price_low' ? { basePrice: 'asc' } : query.sort === 'price_high' ? { basePrice: 'desc' } : { createdAt: 'desc' };
    const [items, total, categories, brands] = await Promise.all([
      this.prisma.warehouseProduct.findMany({ where, orderBy, skip: (page - 1) * limit, take: limit }),
      this.prisma.warehouseProduct.count({ where }),
      this.prisma.warehouseProduct.findMany({ where: { status: 'PUBLISHED' }, distinct: ['category'], select: { category: true } }),
      this.prisma.warehouseProduct.findMany({ where: { status: 'PUBLISHED' }, distinct: ['brand'], select: { brand: true } }),
    ]);
    return {
      items: items.map((item) => this.formatProduct(item)),
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      categories: categories.map((item) => item.category).filter(Boolean),
      brands: brands.map((item) => item.brand).filter(Boolean),
    };
  }

  private toMarketplaceProduct(product: any) {
    const imageList = Array.isArray(product.images) ? product.images : this.parseImages(product.images);
    return {
      id: product.id,
      name: product.name,
      slug: product.slug ?? product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
      category: product.category ?? 'General',
      brand: product.brand ?? 'Generic',
      seller: product.seller ?? 'Vendora seller',
      shop: product.shop ?? 'Vendora seller',
      price: Number(product.basePrice ?? product.price ?? 0),
      oldPrice: Number(product.basePrice ?? product.price ?? 0),
      rating: 4.8,
      popularity: 90,
      inStock: Number(product.stock ?? 0) > 0,
      attributes: Array.isArray(product.attributes) ? product.attributes : ['featured'],
      badge: product.status === 'PUBLISHED' ? 'Featured' : 'New',
      description: product.description ?? '',
      images: imageList,
      stock: Number(product.stock ?? 0),
      sellerId: product.sellerId ?? null,
    };
  }

  async listPublicProducts(query: any = {}) {
    const result = await this.listWarehouse({
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      search: query.search,
      category: query.category,
      brand: query.brand,
      stockStatus: query.stockStatus,
      sort: query.sort,
      includeInactive: false,
    });

    return {
      ...result,
      items: result.items.map((item) => this.toMarketplaceProduct(item)),
    };
  }

  async getPublicProduct(id: string) {
    const product = await this.getProduct(id);
    return this.toMarketplaceProduct(product);
  }

  async getProduct(id: string) {
    const product = await this.prisma.warehouseProduct.findUnique({ where: { id } });
    if (!product) throw new NotFoundException('Warehouse product not found.');
    return this.formatProduct(product);
  }

  async createWarehouseProduct(data: any) {
    return this.prisma.warehouseProduct.create({
      data: {
        name: data.name,
        description: data.description,
        sku: data.sku,
        barcode: data.barcode,
        images: JSON.stringify(data.images || []),
        category: data.category,
        brand: data.brand,
        basePrice: Number(data.basePrice),
        sellerMargin: Number(data.sellerMargin || 0),
        stock: Number(data.stock || 0),
        status: data.status || 'PUBLISHED',
      },
    });
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
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.brand !== undefined ? { brand: data.brand } : {}),
        ...(data.basePrice !== undefined ? { basePrice: Number(data.basePrice) } : {}),
        ...(data.sellerMargin !== undefined ? { sellerMargin: Number(data.sellerMargin) } : {}),
        ...(data.stock !== undefined ? { stock: Number(data.stock) } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
      },
    });
  }

  async deleteWarehouseProduct(id: string) {
    await this.prisma.warehouseProduct.delete({ where: { id } });
    return { message: 'Warehouse product deleted successfully.' };
  }

  private async getPlan(sellerId: string) {
    let subscription = await this.prisma.sellerSubscription.findFirst({
      where: { sellerId, status: 'ACTIVE', plan: { status: 'ACTIVE' } },
      include: { plan: true },
    });
    if (!subscription) {
      const plan = await this.prisma.subscriptionPlan.upsert({
        where: { name: 'FREE' },
        update: {},
        create: { name: 'FREE', productLimit: 200, price: 0, duration: 30 },
      });
      subscription = await this.prisma.sellerSubscription.upsert({
        where: { sellerId },
        update: { planId: plan.id, status: 'ACTIVE' },
        create: { sellerId, planId: plan.id },
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
    const result = await this.prisma.$transaction(async (tx) => {
      const seller = await tx.seller.findUnique({ where: { userId } });
      if (!seller || String(seller.status).toUpperCase() !== 'ACTIVE') {
        throw new BadRequestException('Only approved sellers can add warehouse products.');
      }

      const requestedIds = [...new Set(productIds || [])];
      if (!requestedIds.length) {
        throw new BadRequestException('Select at least one product.');
      }

      const [plan, currentCount, products, shop] = await Promise.all([
        this.getPlan(seller.id),
        tx.sellerProduct.count({ where: { sellerId: seller.id } }),
        tx.warehouseProduct.findMany({ where: { id: { in: requestedIds }, status: 'PUBLISHED' } }),
        tx.shop.findUnique({ where: { sellerId: seller.id }, select: { id: true } }),
      ]);

      if (products.length !== requestedIds.length) {
        throw new BadRequestException('One or more warehouse products are unavailable.');
      }

      if (products.some((product) => product.stock <= 0)) {
        throw new BadRequestException('Out-of-stock products cannot be added.');
      }

      const existing = await tx.sellerProduct.findMany({
        where: { sellerId: seller.id, warehouseProductId: { in: requestedIds } },
        select: { warehouseProductId: true },
      });

      const existingIds = new Set(existing.map((item) => item.warehouseProductId));
      const newProducts = products.filter((product) => !existingIds.has(product.id));

      if (!newProducts.length) {
        return { success: false, code: 'PRODUCT_ALREADY_ADDED', message: 'Product already added to your shop.', addedCount: 0 };
      }

      if (!unlimited(plan.productLimit) && currentCount + newProducts.length > plan.productLimit) {
        return {
          success: false,
          code: 'PRODUCT_LIMIT_EXCEEDED',
          currentCount,
          productLimit: plan.productLimit,
          requestedCount: newProducts.length,
          remainingSlots: Math.max(0, plan.productLimit - currentCount),
        };
      }

      await tx.sellerProduct.createMany({
        data: newProducts.map((product) => ({
          sellerId: seller.id,
          shopId: shop?.id,
          warehouseProductId: product.id,
          sellingPrice: product.basePrice + product.sellerMargin,
        })),
      });

      return { success: true, addedCount: newProducts.length, message: `${newProducts.length} product${newProducts.length === 1 ? '' : 's'} added successfully.` };
    });

    return result;
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
    return this.prisma.subscriptionPlan.create({ data: { name: data.name, price: Number(data.price || 0), productLimit: Number(data.productLimit), duration: Number(data.duration || 30), features: JSON.stringify(data.features || []), status: data.status || 'ACTIVE' } });
  }

  async updatePlan(id: string, data: any) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: { ...(data.name !== undefined ? { name: data.name } : {}), ...(data.price !== undefined ? { price: Number(data.price) } : {}), ...(data.productLimit !== undefined ? { productLimit: Number(data.productLimit) } : {}), ...(data.duration !== undefined ? { duration: Number(data.duration) } : {}), ...(data.features !== undefined ? { features: JSON.stringify(data.features) } : {}), ...(data.status !== undefined ? { status: data.status } : {}) } });
  }
}
