import { Controller, Get, Post, Delete, Body, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private cartService: CartService) {}

  @Get(':userId')
  getCart(@Req() req: any) {
    return this.cartService.getCart(req.user.userId);
  }

  @Post(':userId/items')
  addItem(@Req() req: any, @Body() data: any) {
    return this.cartService.addItem(req.user.userId, {
      productId: data.productId,
      warehouseProductId: data.warehouseProductId,
      name: data.name,
      price: data.price,
      sellerId: data.sellerId,
    }, data.quantity ?? 1);
  }

  @Patch(':userId/items/:productId')
  updateQuantity(
    @Req() req: any,
    @Param('productId') productId: string,
    @Body() data: { quantity?: number },
  ) {
    return this.cartService.updateQuantity(req.user.userId, productId, data.quantity ?? 1);
  }

  @Delete(':userId/items/:productId')
  removeItem(@Req() req: any, @Param('productId') productId: string) {
    return this.cartService.removeItem(req.user.userId, productId);
  }

  @Delete(':userId')
  clear(@Req() req: any) {
    return this.cartService.clear(req.user.userId);
  }
}
