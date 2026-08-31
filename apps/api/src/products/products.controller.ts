import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { ProductsService } from './products.service';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  @Get()
  findAll(@Query('category') category?: string, @Query('sellerId') sellerId?: string) {
    if (category) {
      return this.productsService.findByCategory(category);
    }
    if (sellerId) {
      return this.productsService.findBySeller(Number(sellerId));
    }
    return this.productsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(Number(id));
  }

  @Post()
  create(@Body() productData: any) {
    return this.productsService.create(productData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() productData: any) {
    return this.productsService.update(Number(id), productData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(Number(id));
  }
}
