import { Controller, Get, Post, Body, Param, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(productId);
  }

  @Get('customer/current')
  @UseGuards(JwtAuthGuard)
  findByCustomer(@Req() req: any) {
    return this.reviewsService.findByCustomer(req.user.userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Req() req: any, @Body() reviewData: any) {
    return this.reviewsService.create(req.user.userId, reviewData);
  }

  @Get('product/:productId/average')
  async getAverageRating(@Param('productId') productId: string) {
    return { productId, averageRating: await this.reviewsService.getAverageRating(productId) };
  }
}
