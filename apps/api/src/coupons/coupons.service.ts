import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class CouponsService {
  findAll() {
    return [];
  }

  validateCoupon(code: string) {
    return { valid: false, code, message: 'No persisted coupons are currently available.' };
  }

  create(couponData: any) {
    void couponData;
    throw new NotImplementedException('Coupon persistence is not available in the current database schema.');
  }
}
