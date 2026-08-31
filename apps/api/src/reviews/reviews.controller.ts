import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ReviewsService } from './reviews.service';

@Controller('reviews')
export class ReviewsController {
  constructor(private reviewsService: ReviewsService) {}

  @Get('product/:productId')
  findByProduct(@Param('productId') productId: string) {
    return this.reviewsService.findByProduct(Number(productId));
  }

  @Post()
  create(@Body() reviewData: any) {
    return this.reviewsService.create(reviewData);
  }

  @Get('product/:productId/average')
  getAverageRating(@Param('productId') productId: string) {
    return {
      productId: Number(productId),
      averageRating: this.reviewsService.getAverageRating(Number(productId)),
    };
  }
}
