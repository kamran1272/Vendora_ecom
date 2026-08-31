import { Injectable } from '@nestjs/common';

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  SELLER = 'SELLER',
  CUSTOMER = 'CUSTOMER',
  STAFF = 'STAFF',
}

@Injectable()
export class UsersService {
  private users = [
    {
      id: 1,
      email: 'superadmin@vendora.com',
      name: 'Super Admin',
      password: 'admin123',
      role: UserRole.SUPER_ADMIN,
      emailVerified: true,
      twoFactorEnabled: true,
      twoFactorCode: '123456',
      shopStatus: 'approved',
    },
    {
      id: 2,
      email: 'admin@vendora.com',
      name: 'Platform Admin',
      password: 'admin123',
      role: UserRole.ADMIN,
      emailVerified: true,
      twoFactorEnabled: true,
      twoFactorCode: '654321',
      shopStatus: 'n/a',
    },
    {
      id: 3,
      email: 'seller@vendora.com',
      name: 'Jane Seller',
      password: 'seller123',
      role: UserRole.SELLER,
      emailVerified: true,
      twoFactorEnabled: false,
      shopStatus: 'approved',
    },
    {
      id: 4,
      email: 'customer@vendora.com',
      name: 'John Customer',
      password: 'customer123',
      role: UserRole.CUSTOMER,
      emailVerified: true,
      twoFactorEnabled: false,
      addresses: [],
      orders: [],
      shopStatus: 'customer',
    },
  ];

  findAll() {
    return this.users;
  }

  findOne(id: number) {
    return this.users.find((u) => u.id === id);
  }

  findByEmail(email: string) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  create(userData: any) {
    const newUser = {
      id: this.users.length + 1,
      role: UserRole.CUSTOMER,
      emailVerified: false,
      twoFactorEnabled: false,
      shopStatus: 'customer',
      addresses: [],
      orders: [],
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  update(id: number, userData: any) {
    const user = this.findOne(id);
    if (user) {
      Object.assign(user, userData);
    }
    return user;
  }

  remove(id: number) {
    const index = this.users.findIndex((u) => u.id === id);
    if (index > -1) {
      return this.users.splice(index, 1);
    }
  }
}
