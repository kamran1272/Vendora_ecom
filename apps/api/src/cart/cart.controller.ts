import { Controller, Get, Post, Delete, Body, Param } from '@nestjs/common';
import { CartService } from './cart.service';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

    @Get(':userId')
  getCart(@Param('userId') userId: string) {
    return this.cartService.getCart(userId);
  }

  @Post(':userId/items')
  addItem(@Param('userId') userId: string, @Body() data: any) {
    return this.cartService.addItem(userId, {
      productId: data.productId,
      warehouseProductId: data.warehouseProductId,
      name: data.name,
      price: data.price,
      sellerId: data.sellerId,
    }, data.quantity ?? 1);
  }

  @Delete(':userId/items/:productId')
  removeItem(@Param('userId') userId: string, @Param('productId') productId: string) {
    return this.cartService.removeItem(userId, productId);
  }

  @Delete(':userId')
  clear(@Param('userId') userId: string) {
    return this.cartService.clear(userId);
  }
}
