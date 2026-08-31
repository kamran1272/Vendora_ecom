import { BadRequestException, Injectable } from '@nestjs/common';

type CartItem = {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  sellerId?: number;
};

type CartState = {
  userId: number;
  items: CartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  couponCode?: string;
};

@Injectable()
export class CartService {
  private carts = new Map<number, CartState>();

  private buildEmptyCart(userId: number): CartState {
    return {
      userId,
      items: [],
      subtotal: 0,
      tax: 0,
      shipping: 0,
      discount: 0,
      total: 0,
    };
  }

  private recalculate(cart: CartState) {
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal === 0 ? 0 : 12;
    const discount = cart.couponCode === 'SAVE10' ? subtotal * 0.1 : 0;

    cart.subtotal = subtotal;
    cart.tax = tax;
    cart.shipping = shipping;
    cart.discount = discount;
    cart.total = subtotal + tax + shipping - discount;
    return cart;
  }

  getCart(userId: number) {
    const cart = this.carts.get(userId) || this.buildEmptyCart(userId);
    this.carts.set(userId, cart);
    return this.recalculate({ ...cart, items: [...cart.items] });
  }

  addItem(userId: number, product: { productId: number; name?: string; price?: number; sellerId?: number }, quantity: number) {
    const normalizedQty = Number(quantity) || 1;
    if (normalizedQty <= 0) {
      throw new BadRequestException('Quantity must be greater than 0.');
    }

    const cart = this.getCart(userId);
    const existing = cart.items.find((item) => item.productId === product.productId);

    if (existing) {
      existing.quantity += normalizedQty;
    } else {
      cart.items.push({
        productId: Number(product.productId),
        name: product.name || `Product ${product.productId}`,
        price: Number(product.price ?? 99.99),
        quantity: normalizedQty,
        sellerId: product.sellerId,
      });
    }

    const updated = this.recalculate(cart);
    this.carts.set(userId, updated);
    return updated;
  }

  updateQuantity(userId: number, productId: number, quantity: number) {
    const cart = this.getCart(userId);
    const item = cart.items.find((entry) => entry.productId === productId);

    if (!item) {
      throw new BadRequestException('Product not found in cart.');
    }

    const newQty = Number(quantity);
    if (newQty <= 0) {
      return this.removeItem(userId, productId);
    }

    item.quantity = newQty;
    const updated = this.recalculate(cart);
    this.carts.set(userId, updated);
    return updated;
  }

  removeItem(userId: number, productId: number) {
    const cart = this.getCart(userId);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    const updated = this.recalculate(cart);
    this.carts.set(userId, updated);
    return updated;
  }

  applyCoupon(userId: number, code: string) {
    const cart = this.getCart(userId);
    const normalized = (code || '').trim().toUpperCase();

    if (!normalized) {
      throw new BadRequestException('Coupon code is required.');
    }

    if (normalized !== 'SAVE10') {
      throw new BadRequestException('Coupon code is invalid or expired.');
    }

    cart.couponCode = normalized;
    const updated = this.recalculate(cart);
    this.carts.set(userId, updated);
    return updated;
  }

  clear(userId: number) {
    const empty = this.buildEmptyCart(userId);
    this.carts.set(userId, empty);
    return empty;
  }
}
