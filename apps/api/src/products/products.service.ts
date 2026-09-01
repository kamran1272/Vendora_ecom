import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private normalizeProduct(product: any) {
    const images = (() => {
      try {
        return product.images ? JSON.parse(product.images) : [];
      } catch {
        return [];
      }
    })();

    return {
      id: product.id,
      sellerId: product.sellerId ?? null,
      warehouseProductId: product.warehouseProductId ?? null,
      name: product.name,
      category: product.category ?? 'General',
      brand: product.brand ?? null,
      price: Number(product.sellingPrice ?? product.basePrice ?? 0),
      stock: Number(product.stock ?? product.warehouseProduct?.stock ?? 0),
      rating: 4.8,
      image: images[0] ?? null,
      images,
      description: product.description ?? product.warehouseProduct?.description ?? '',
      status: product.status ?? product.warehouseProduct?.status ?? 'PUBLISHED',
      createdAt: product.createdAt,
    };
  }

  async findAll() {
    const products = await this.prisma.sellerProduct.findMany({
      include: { warehouseProduct: true },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.normalizeProduct(product));
  }

  async findOne(id: number | string) {
    const product = await this.prisma.sellerProduct.findFirst({
      where: { id: String(id) },
      include: { warehouseProduct: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    return this.normalizeProduct(product);
  }

  async findByCategory(category: string) {
    const products = await this.prisma.sellerProduct.findMany({
      where: {
        warehouseProduct: {
          category: {
            equals: category,
            mode: 'insensitive',
          },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.normalizeProduct(product));
  }

  async findBySeller(sellerId: number | string) {
    const products = await this.prisma.sellerProduct.findMany({
      where: {
        sellerId: String(sellerId),
      },
      include: { warehouseProduct: true },
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.normalizeProduct(product));
  }

  async create(productData: any) {
    const warehouseProduct = await this.prisma.warehouseProduct.create({
      data: {
        name: productData.name,
        description: productData.description ?? '',
        sku: productData.sku ?? `SKU-${Date.now()}`,
        barcode: productData.barcode ?? null,
        category: productData.category ?? 'General',
        brand: productData.brand ?? 'Generic',
        basePrice: Number(productData.price ?? 0),
        sellerMargin: Number(productData.sellerMargin ?? 0),
        stock: Number(productData.stock ?? 0),
        status: productData.status ?? 'PUBLISHED',
        images: JSON.stringify(productData.images ?? []),
      },
    });

    const created = await this.prisma.sellerProduct.create({
      data: {
        sellerId: String(productData.sellerId ?? productData.seller_id ?? ''),
        warehouseProductId: warehouseProduct.id,
        sellingPrice: Number(productData.price ?? warehouseProduct.basePrice),
      },
      include: { warehouseProduct: true },
    });

    return this.normalizeProduct(created);
  }

  async update(id: number | string, productData: any) {
    const existing = await this.prisma.sellerProduct.findFirst({
      where: { id: String(id) },
      include: { warehouseProduct: true },
    });

    if (!existing) {
      throw new NotFoundException('Product not found.');
    }

    if (existing.warehouseProduct) {
      await this.prisma.warehouseProduct.update({
        where: { id: existing.warehouseProduct.id },
        data: {
          ...(productData.name !== undefined ? { name: productData.name } : {}),
          ...(productData.description !== undefined ? { description: productData.description } : {}),
          ...(productData.category !== undefined ? { category: productData.category } : {}),
          ...(productData.brand !== undefined ? { brand: productData.brand } : {}),
          ...(productData.price !== undefined ? { basePrice: Number(productData.price) } : {}),
          ...(productData.stock !== undefined ? { stock: Number(productData.stock) } : {}),
          ...(productData.images !== undefined ? { images: JSON.stringify(productData.images) } : {}),
        },
      });
    }

    const updated = await this.prisma.sellerProduct.update({
      where: { id: String(id) },
      data: {
        ...(productData.sellingPrice !== undefined ? { sellingPrice: Number(productData.sellingPrice) } : {}),
        ...(productData.status !== undefined ? { status: productData.status } : {}),
      },
      include: { warehouseProduct: true },
    });

    return this.normalizeProduct(updated);
  }

  async remove(id: number | string) {
    const product = await this.prisma.sellerProduct.findFirst({
      where: { id: String(id) },
      include: { warehouseProduct: true },
    });

    if (!product) {
      throw new NotFoundException('Product not found.');
    }

    await this.prisma.sellerProduct.delete({ where: { id: String(id) } });
    return { id: String(id), deleted: true };
  }
}
