import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class CouponsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return (this.prisma as any).coupon.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async getValidCoupon(code: string, subtotal = 0) {
    const coupon = await (this.prisma as any).coupon.findUnique({ where: { code: String(code || '').trim().toUpperCase() } });
    const now = new Date();
    if (!coupon || !coupon.active || (coupon.startsAt && coupon.startsAt > now) || (coupon.expiresAt && coupon.expiresAt < now) || (coupon.usageLimit !== null && coupon.usageCount >= coupon.usageLimit) || Number(subtotal) < Number(coupon.minimumSubtotal)) return null;
    const rawDiscount = coupon.discountType === 'FIXED' ? Number(coupon.discountValue) : Number(subtotal) * Number(coupon.discountValue) / 100;
    return { coupon, discount: Math.min(Number(subtotal), coupon.maximumDiscount ? Math.min(rawDiscount, Number(coupon.maximumDiscount)) : rawDiscount) };
  }

  async validateCoupon(code: string, subtotal = 0) {
    const result = await this.getValidCoupon(code, subtotal);
    return result ? { valid: true, code: result.coupon.code, discount: Number(result.discount), message: 'Coupon is valid.' } : { valid: false, code, discount: 0, message: 'Coupon is invalid or unavailable.' };
  }

  create(couponData: any) {
    const code = String(couponData?.code || '').trim().toUpperCase();
    const discountValue = Number(couponData?.discountValue);
    if (!code || !Number.isFinite(discountValue) || discountValue <= 0) throw new BadRequestException('Coupon code and positive discountValue are required.');
    return (this.prisma as any).coupon.create({ data: { code, description: couponData.description, discountType: couponData.discountType === 'FIXED' ? 'FIXED' : 'PERCENTAGE', discountValue, minimumSubtotal: Number(couponData.minimumSubtotal || 0), maximumDiscount: couponData.maximumDiscount == null ? null : Number(couponData.maximumDiscount), startsAt: couponData.startsAt ? new Date(couponData.startsAt) : null, expiresAt: couponData.expiresAt ? new Date(couponData.expiresAt) : null, usageLimit: couponData.usageLimit == null ? null : Number(couponData.usageLimit), active: couponData.active !== false } });
  }
}
