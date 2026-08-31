import { Injectable } from '@nestjs/common';

@Injectable()
export class CmsService {
  private pages = [
    { id: 1, slug: 'about', title: 'About Us', content: 'About content...' },
    { id: 2, slug: 'privacy', title: 'Privacy Policy', content: 'Privacy content...' },
  ];

  getPages() {
    return this.pages;
  }

  getPage(slug: string) {
    return this.pages.find((p) => p.slug === slug);
  }

  createPage(pageData: any) {
    const newPage = { id: this.pages.length + 1, ...pageData };
    this.pages.push(newPage);
    return newPage;
  }

  updatePage(id: number, pageData: any) {
    const page = this.pages.find((p) => p.id === id);
    if (page) {
      Object.assign(page, pageData);
    }
    return page;
  }
}
