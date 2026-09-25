import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  findByProduct(productId: string) {
    return this.prisma.review.findMany({ where: { productId: String(productId), status: 'APPROVED' }, include: { customer: true, replies: true }, orderBy: { createdAt: 'desc' } });
  }

  findByCustomer(customerId: string) {
    return this.prisma.review.findMany({ where: { customerId: String(customerId) }, include: { replies: true }, orderBy: { createdAt: 'desc' } });
  }

  async create(customerId: string, reviewData: any) {
    const rating = Number(reviewData?.rating ?? 0);
    const text = String(reviewData?.text ?? reviewData?.comment ?? '').trim();
    if (rating < 1 || rating > 5 || !text) throw new BadRequestException('Rating and review text are required.');

    const requestedProductId = reviewData?.warehouseProductId || reviewData?.productId;
    const sellerProduct = requestedProductId
      ? await this.prisma.sellerProduct.findFirst({
          where: { OR: [{ id: String(requestedProductId) }, { warehouseProductId: String(requestedProductId) }] },
          select: { id: true, sellerId: true, warehouseProductId: true },
        })
      : null;

    if (!sellerProduct) throw new BadRequestException('A valid seller product is required.');

    const productId = String(sellerProduct.id);
    const warehouseProductId = sellerProduct.warehouseProductId ? String(sellerProduct.warehouseProductId) : null;

    const purchasedOrder = await this.prisma.order.findFirst({
      where: {
        userId: String(customerId),
        status: 'DELIVERED',
        items: {
          some: {
            OR: [
              { productId },
              ...(warehouseProductId ? [{ warehouseProductId }] : []),
            ],
          },
        },
      },
      select: { id: true },
    });

    if (!purchasedOrder) throw new BadRequestException('You can review this product after it has been delivered to you.');

    const existing = await this.prisma.review.findFirst({
      where: {
        customerId: String(customerId),
        OR: [{ productId }, ...(warehouseProductId ? [{ warehouseProductId }] : [])],
      },
    });

    const data = {
      productId,
      warehouseProductId,
      sellerId: sellerProduct.sellerId,
      rating,
      title: reviewData.title ? String(reviewData.title) : null,
      text,
      images: JSON.stringify(Array.isArray(reviewData.images) ? reviewData.images : []),
      status: 'PENDING',
    };

    if (existing) return this.prisma.review.update({ where: { id: existing.id }, data });
    return this.prisma.review.create({ data: { customerId: String(customerId), ...data } });
  }

  async getAverageRating(productId: string) {
    const result = await this.prisma.review.aggregate({ where: { productId: String(productId), status: 'APPROVED' }, _avg: { rating: true } });
    return result._avg.rating ?? 0;
  }
}
