import { Injectable } from '@nestjs/common';

@Injectable()
export class ReviewsService {
  private reviews = [
    { id: 1, productId: 1, rating: 5, comment: 'Great product!', userId: 1 },
    { id: 2, productId: 1, rating: 4, comment: 'Good quality', userId: 2 },
  ];

  findByProduct(productId: number) {
    return this.reviews.filter((r) => r.productId === productId);
  }

  create(reviewData: any) {
    const newReview = { id: this.reviews.length + 1, ...reviewData };
    this.reviews.push(newReview);
    return newReview;
  }

  getAverageRating(productId: number) {
    const productReviews = this.findByProduct(productId);
    if (productReviews.length === 0) return 0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return sum / productReviews.length;
  }
}
