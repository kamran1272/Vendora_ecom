import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  private products = [
    {
      id: 1,
      sellerId: 1,
      name: 'Premium Wireless Headphones',
      category: 'electronics',
      price: 119.99,
      stock: 34,
      rating: 4.5,
      image: 'https://via.placeholder.com/300',
    },
    {
      id: 2,
      sellerId: 1,
      name: 'Smart Weather Station',
      category: 'smart-home',
      price: 89.99,
      stock: 18,
      rating: 4.7,
      image: 'https://via.placeholder.com/300',
    },
    {
      id: 3,
      sellerId: 2,
      name: 'Portable Blender Pro',
      category: 'kitchen',
      price: 69.99,
      stock: 52,
      rating: 4.3,
      image: 'https://via.placeholder.com/300',
    },
  ];

  findAll() {
    return this.products;
  }

  findOne(id: number) {
    return this.products.find((p) => p.id === id);
  }

  findByCategory(category: string) {
    return this.products.filter((p) => p.category === category);
  }

  findBySeller(sellerId: number) {
    return this.products.filter((p) => p.sellerId === sellerId);
  }

  create(productData: any) {
    const newProduct = { id: this.products.length + 1, ...productData };
    this.products.push(newProduct);
    return newProduct;
  }

  update(id: number, productData: any) {
    const product = this.findOne(id);
    if (product) {
      Object.assign(product, productData);
    }
    return product;
  }

  remove(id: number) {
    const index = this.products.findIndex((p) => p.id === id);
    if (index > -1) {
      return this.products.splice(index, 1);
    }
  }
}
