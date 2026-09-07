import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

type CartItemInput = {
  productId: number | string;
  warehouseProductId?: string | null;
  name?: string;
  price?: number;
  quantity?: number;
  sellerId?: number | string;
};

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  private recalculate(items: Array<{ price: number; quantity: number }>, couponCode?: string | null) {
    const subtotal = items.reduce((sum, item) => sum + Number(item.price) * Number(item.quantity), 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal === 0 ? 0 : 12;
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
    const totals = this.recalculate(cart.items, cart.couponCode);

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
    const existing = cart.items.find((item) => item.productId === canonicalListingId || (item.warehouseProductId === canonicalProductId && item.sellerId === listing.sellerId));

    if (existing) {
      await this.prisma.cartItem.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + normalizedQty,
          price: canonicalPrice,
          name: canonicalName,
          sellerId: listing.sellerId,
          warehouseProductId: canonicalProductId,
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
