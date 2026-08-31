import { Injectable } from '@nestjs/common';

@Injectable()
export class CouponsService {
  private coupons = [
    { id: 1, code: 'SAVE10', discount: 10, expiresAt: new Date() },
    { id: 2, code: 'SUMMER20', discount: 20, expiresAt: new Date() },
  ];

  findAll() {
    return this.coupons;
  }

  validateCoupon(code: string) {
    const coupon = this.coupons.find((c) => c.code === code);
    return coupon ? { valid: true, discount: coupon.discount } : { valid: false };
  }

  create(couponData: any) {
    const newCoupon = { id: this.coupons.length + 1, ...couponData };
    this.coupons.push(newCoupon);
    return newCoupon;
  }
}
