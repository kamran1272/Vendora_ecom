import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { PrismaService } from '@/database/prisma.service'

@Injectable()
export class ProductQueriesService {
  constructor(private readonly prisma: PrismaService) {}

  private async sellerForUser(userId: string) {
    const seller = await this.prisma.seller.findUnique({ where: { userId }, select: { id: true } })
    if (!seller) throw new ForbiddenException('Seller account not found.')
    return seller
  }

  async create(userId: string, payload: { sellerId?: string; productId?: string; subject?: string; question?: string }) {
    const question = String(payload.question || '').trim()
    const subject = String(payload.subject || 'Product question').trim()
    if (!question) throw new BadRequestException('Question is required.')
    if (!payload.productId) throw new BadRequestException('Product is required.')
    const sellerProduct = await this.prisma.sellerProduct.findFirst({ where: { warehouseProductId: String(payload.productId), status: 'ACTIVE' }, select: { sellerId: true } })
    if (!sellerProduct) throw new BadRequestException('Product is not listed by a seller.')
    return this.prisma.productQuery.create({ data: { userId, sellerId: sellerProduct.sellerId, productId: String(payload.productId), subject, question } })
  }

  async listForSeller(userId: string) {
    const seller = await this.sellerForUser(userId)
    return this.prisma.productQuery.findMany({ where: { sellerId: seller.id }, include: { user: { select: { id: true, name: true, email: true } }, product: { select: { id: true, name: true, sku: true } } }, orderBy: { createdAt: 'desc' } })
  }

  async listForCustomer(userId: string) {
    return this.prisma.productQuery.findMany({ where: { userId }, include: { seller: { include: { user: { select: { id: true, name: true, email: true } }, shop: true } }, product: { select: { id: true, name: true, sku: true } } }, orderBy: { createdAt: 'desc' } })
  }

  async answer(userId: string, queryId: string, answer: string) {
    const seller = await this.sellerForUser(userId)
    const query = await this.prisma.productQuery.findFirst({ where: { id: queryId, sellerId: seller.id } })
    if (!query) throw new NotFoundException('Product query not found.')
    const normalizedAnswer = String(answer || '').trim()
    if (!normalizedAnswer) throw new BadRequestException('Answer is required.')
    return this.prisma.productQuery.update({ where: { id: query.id }, data: { answer: normalizedAnswer, status: 'ANSWERED' } })
  }
}
