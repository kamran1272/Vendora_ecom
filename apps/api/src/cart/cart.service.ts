import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CartItemInput = {
  productId: number | string;
  warehouseProductId?: string | null;
  name?: string;
  price?: number;
  quantity?: number;
  sellerId?: number | string;
  variantId?: string | null;
  variantSku?: string | null;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private recalculate(items: Array<{ price: number; quantity: number; sellerId?: string | null }>, couponCode?: string | null) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const tax = subtotal * 0.08;
    const sellerCount = new Set(items.map((item) => item.sellerId || 'marketplace')).size;
    const shipping = subtotal === 0 ? 0 : sellerCount * 12;
    const discount = couponCode === 'SAVE10' ? subtotal * 0.1 : 0;

    return {
      subtotal: Number(subtotal.toFixed(2)),
      tax: Number(tax.toFixed(2)),
      shipping: Number(shipping.toFixed(2)),
      discount: Number(discount.toFixed(2)),
      total: Number((subtotal + tax + shipping - discount).toFixed(2)),
    };
  }

  private async getOrCreateCart(userId?: number | string, sessionId?: string) {
    const safeUserId = userId !== undefined ? String(userId) : undefined;

    let cart = safeUserId
      ? await this.prisma.cart.findUnique({
          where: { userId: safeUserId },
          include: { items: true },
        })
      : null;

    if (!cart && sessionId) {
      cart = await this.prisma.cart.findUnique({
        where: { sessionId },
        include: { items: true },
      });
    }

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId: safeUserId ?? null,
          sessionId: sessionId ?? null,
        },
        include: { items: true },
      });
    }

    return cart;
  }

  async getCart(userId: number | string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);
    const totals = this.recalculate(cart.items.map((item) => ({ ...item, price: Number(item.price) })), cart.couponCode);

    return {
      id: cart.id,
      userId: cart.userId,
      sessionId: cart.sessionId,
      items: cart.items.map((item) => ({
        id: item.id,
        cartId: item.cartId,
        productId: item.productId,
        warehouseProductId: item.warehouseProductId,
        sellerId: item.sellerId,
        name: item.name,
        price: Number(item.price),
        quantity: item.quantity,
      })),
      couponCode: cart.couponCode,
      ...totals,
    };
  }

  async quote(userId: number | string) {
    const cart = await this.getOrCreateCart(userId);
    const listings = await Promise.all(
      cart.items.map((item) => this.prisma.sellerProduct.findFirst({
        where: {
          id: item.productId,
          status: 'ACTIVE',
          shopId: { not: null },
          seller: { status: 'ACTIVE' },
          warehouseProduct: { status: 'PUBLISHED' },
        },
        include: {
          warehouseProduct: { select: { stock: true, name: true } },
          seller: { include: { user: { select: { name: true } } } },
          shop: { select: { name: true, returnPolicy: true, shippingPolicy: true } },
        },
      })),
    );

    if (listings.some((listing) => !listing)) {
      throw new BadRequestException('One or more cart items are no longer available.');
    }

    const stockError = listings.find((listing, index) => listing!.warehouseProduct.stock < cart.items[index].quantity);
    if (stockError) {
      throw new BadRequestException(`Not enough stock is available for ${stockError.warehouseProduct.name}.`);
    }

    const refreshedItems = cart.items.map((item, index) => {
      const listing = listings[index]!;
      return {
        ...item,
        name: listing.warehouseProduct.name,
        price: Number(listing.sellingPrice),
        sellerId: listing.sellerId,
        shop: listing.shop?.name || listing.seller.user.name,
      };
    });

    const totals = this.recalculate(refreshedItems, cart.couponCode);
    const sellerGroups = [...new Map(refreshedItems.map((item, index) => {
      const listing = listings[index]!;
      const sellerId = listing.sellerId;
      return [sellerId, {
        sellerId,
        sellerName: listing.shop?.name || listing.seller.user.name,
        shipping: 12,
        returnPolicy: listing.shop?.returnPolicy || null,
        shippingPolicy: listing.shop?.shippingPolicy || null,
      }];
    })).values()];

    return {
      ...totals,
      currency: 'USD',
      items: refreshedItems,
      sellerGroups,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    };
  }

  async addItem(userId: number | string, product: CartItemInput, quantity: number) {
    const normalizedQty = Number(quantity) || 1;
    if (normalizedQty <= 0) {
      throw new BadRequestException('Quantity must be greater than 0.');
    }

    const cart = await this.getOrCreateCart(userId);
    const productId = String(product.productId);
    const requestedWarehouseId = product.warehouseProductId ? String(product.warehouseProductId) : productId;
    const listing = await this.prisma.sellerProduct.findFirst({
      where: { OR: [{ id: productId }, { warehouseProductId: requestedWarehouseId }], status: 'ACTIVE', shopId: { not: null }, seller: { status: 'ACTIVE' }, warehouseProduct: { status: 'PUBLISHED' } },
      include: { warehouseProduct: true },
    });
    if (!listing || listing.warehouseProduct.stock <= 0) {
      throw new BadRequestException('This product is not currently available.');
    }
    const canonicalProductId = listing.warehouseProductId;
    const canonicalListingId = listing.id;
    const canonicalName = listing.warehouseProduct.name;
    const canonicalPrice = Number(listing.sellingPrice);
    const variant = product.variantId
      ? await this.prisma.productVariant.findFirst({ where: { id: String(product.variantId), warehouseProductId: canonicalProductId, status: 'ACTIVE' } })
      : null;
    if (product.variantId && !variant) throw new BadRequestException('The selected product variant is not available.');
    const variantId = variant?.id ?? (product.variantId ? String(product.variantId) : null);
    const variantSku = variant?.sku ?? product.variantSku ?? null;
    const existing = cart.items.find((item) => item.productId === canonicalListingId && (item.variantId ?? null) === variantId);

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + normalizedQty,
          price: canonicalPrice,
          name: canonicalName,
          sellerId: listing.sellerId,
          warehouseProductId: canonicalProductId,
          variantId,
          variantSku,
        },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId: canonicalListingId,
          warehouseProductId: canonicalProductId,
          sellerId: listing.sellerId,
          name: canonicalName,
          price: canonicalPrice,
          quantity: normalizedQty,
          variantId,
          variantSku,
        },
      });
    }

    return this.getCart(userId);
  }

  async updateQuantity(userId: number | string, productId: number | string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = cart.items.find((entry) => entry.productId === String(productId));

    if (!item) {
      throw new BadRequestException('Product not found in cart.');
    }

    const newQty = Number(quantity);
    if (newQty <= 0) {
      return this.removeItem(userId, productId);
    }

    await this.prisma.cartItem.update({
      where: { id: item.id },
      data: { quantity: newQty },
    });

    return this.getCart(userId);
  }

  async removeItem(userId: number | string, productId: number | string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId: String(productId) },
    });

    return this.getCart(userId);
  }

  async applyCoupon(userId: number | string, code: string) {
    const cart = await this.getOrCreateCart(userId);
    const normalized = (code || '').trim().toUpperCase();

    if (!normalized) {
      throw new BadRequestException('Coupon code is required.');
    }

    if (normalized !== 'SAVE10') {
      throw new BadRequestException('Coupon code is invalid or expired.');
    }

    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: normalized },
    });

    return this.getCart(userId);
  }

  async clear(userId: number | string) {
    const cart = await this.getOrCreateCart(userId);
    await this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    await this.prisma.cart.update({
      where: { id: cart.id },
      data: { couponCode: null },
    });

    return this.getCart(userId);
  }
}
