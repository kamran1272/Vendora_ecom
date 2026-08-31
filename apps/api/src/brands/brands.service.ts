import { Injectable } from '@nestjs/common';

@Injectable()
export class BrandsService {
  private brands = [
    { id: 1, name: 'Aurora', logo: 'https://via.placeholder.com/100' },
    { id: 2, name: 'Luna', logo: 'https://via.placeholder.com/100' },
    { id: 3, name: 'Tech Pro', logo: 'https://via.placeholder.com/100' },
  ];

  findAll() {
    return this.brands;
  }

  findOne(id: number) {
    return this.brands.find((b) => b.id === id);
  }
}
