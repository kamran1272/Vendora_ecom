import { Body, Controller, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard'
import { RolesGuard } from '@/auth/guards/roles.guard'
import { Roles } from '@/auth/decorators/roles.decorator'
import { UserRole } from '@/users/users.service'
import { ProductQueriesService } from './product-queries.service'

@Controller('product-queries')
@UseGuards(JwtAuthGuard)
export class ProductQueriesController {
  constructor(private readonly service: ProductQueriesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  create(@Req() req: any, @Body() body: { sellerId?: string; productId?: string; subject?: string; question?: string }) {
    return this.service.create(req.user.userId, body)
  }

  @Get('mine')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CUSTOMER)
  mine(@Req() req: any) { return this.service.listForCustomer(req.user.userId) }

  @Get('seller')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  seller(@Req() req: any) { return this.service.listForSeller(req.user.userId) }

  @Patch(':id/answer')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SELLER)
  answer(@Req() req: any, @Param('id') id: string, @Body() body: { answer?: string }) { return this.service.answer(req.user.userId, id, body.answer || '') }
}
