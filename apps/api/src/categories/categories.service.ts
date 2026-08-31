import { Injectable } from '@nestjs/common';

@Injectable()
export class CategoriesService {
  private categories = [
    { id: 1, name: 'Electronics', slug: 'electronics', icon: '📱' },
    { id: 2, name: 'Smart Home', slug: 'smart-home', icon: '🏠' },
    { id: 3, name: 'Kitchen', slug: 'kitchen', icon: '🍳' },
  ];

  findAll() {
    return this.categories;
  }

  findOne(id: number) {
    return this.categories.find((c) => c.id === id);
  }
}
