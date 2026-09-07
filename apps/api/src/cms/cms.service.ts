import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class CmsService {
  getPages() {
    return [];
  }

  getPage(slug: string) {
    return { slug, message: 'No persisted CMS page is currently available.' };
  }

  createPage(pageData: any) {
    void pageData;
    throw new NotImplementedException('CMS page persistence is not available in the current database schema.');
  }

  updatePage(id: number, pageData: any) {
    void id;
    void pageData;
    throw new NotImplementedException('CMS page persistence is not available in the current database schema.');
  }
}
