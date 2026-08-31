import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(Number(userId));
  }

  @Post(':userId/items')
  addItem(@Param('userId') userId: string, @Body() data: any) {
    return this.cartService.addItem(Number(userId), data.productId, data.quantity);
  }

  @Delete(':userId/items/:productId')
  removeItem(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.cartService.removeItem(Number(userId), Number(productId));
  }

  @Delete(':userId')
  clear(@Param('userId') userId: string) {
    return this.cartService.clear(Number(userId));
  }
}
