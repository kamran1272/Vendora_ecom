import { Injectable } from '@nestjs/common';

@Injectable()
export class ShopsService {
  private shops = [
    {
      id: 1,
      sellerId: 1,
      name: 'Aurora Studio',
      description: 'Premium electronics and gadgets',
      logo: 'https://via.placeholder.com/100',
      banner: 'https://via.placeholder.com/1200x400',
      verified: true,
    },
    {
      id: 2,
      sellerId: 2,
      name: 'Luna Labs',
      description: 'Innovative tech products',
      logo: 'https://via.placeholder.com/100',
      banner: 'https://via.placeholder.com/1200x400',
      verified: true,
    },
  ];

  findAll() {
    return this.shops;
  }

  findOne(id: number) {
    return this.shops.find((s) => s.id === id);
  }

  findBySellerId(sellerId: number) {
    return this.shops.find((s) => s.sellerId === sellerId);
  }

  create(shopData: any) {
    const newShop = { id: this.shops.length + 1, ...shopData };
    this.shops.push(newShop);
    return newShop;
  }

  update(id: number, shopData: any) {
    const shop = this.findOne(id);
    if (shop) {
      Object.assign(shop, shopData);
    }
    return shop;
  }

  remove(id: number) {
    const index = this.shops.findIndex((s) => s.id === id);
    if (index > -1) {
      return this.shops.splice(index, 1);
    }
  }
}
