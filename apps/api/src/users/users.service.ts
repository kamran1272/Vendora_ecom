import { Injectable } from '@nestjs/common';
import { UserRole } from '@vendora/shared';
import { PrismaService } from '@/database/prisma.service';

export { UserRole } from '@vendora/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, status: true, emailVerified: true, createdAt: true, updatedAt: true },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  }

  create(userData: any) {
    return this.prisma.user.create({ data: { ...userData, role: userData.role ?? UserRole.CUSTOMER, emailVerified: userData.emailVerified ?? false } });
  }

  update(id: string, userData: any) {
    return this.prisma.user.update({ where: { id }, data: userData });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }
}
