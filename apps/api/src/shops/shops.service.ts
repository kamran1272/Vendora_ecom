import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class ShopsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.shop.findMany({ orderBy: { name: 'asc' } });
  }

  findOne(id: string) {
    return this.prisma.shop.findUnique({ where: { id } });
  }

  findBySellerId(sellerId: string) {
    return this.prisma.shop.findUnique({ where: { sellerId } });
  }

  create(shopData: any) {
    return this.prisma.shop.create({ data: shopData });
  }

  update(id: string, shopData: any) {
    return this.prisma.shop.update({ where: { id }, data: shopData });
  }

  remove(id: string) {
    return this.prisma.shop.delete({ where: { id } });
  }
}
