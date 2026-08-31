import { Controller, Get, Post, Put, Body, Param } from '@nestjs/common';
import { CmsService } from './cms.service';

@Controller('cms')
export class CmsController {
  constructor(private cmsService: CmsService) {}

  @Get('pages')
  getPages() {
    return this.cmsService.getPages();
  }

  @Get('pages/:slug')
  getPage(@Param('slug') slug: string) {
    return this.cmsService.getPage(slug);
  }

  @Post('pages')
  createPage(@Body() pageData: any) {
    return this.cmsService.createPage(pageData);
  }

  @Put('pages/:id')
  updatePage(@Param('id') id: string, @Body() pageData: any) {
    return this.cmsService.updatePage(Number(id), pageData);
  }
}
