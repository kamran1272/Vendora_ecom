import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ShopsService } from './shops.service';

@Controller('shops')
export class ShopsController {
  constructor(private shopsService: ShopsService) {}

  @Get()
  findAll() {
    return this.shopsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shopsService.findOne(Number(id));
  }

  @Post()
  create(@Body() shopData: any) {
    return this.shopsService.create(shopData);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() shopData: any) {
    return this.shopsService.update(Number(id), shopData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.shopsService.remove(Number(id));
  }
}
