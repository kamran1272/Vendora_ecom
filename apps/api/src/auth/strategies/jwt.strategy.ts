import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'replace-with-a-long-random-secret',
    });
  }

  async validate(payload: any) {
    const user = await this.prisma.user.findFirst({
      where: { id: String(payload.sub), deletedAt: null, isBlocked: false, status: 'ACTIVE' },
      select: { id: true, email: true, name: true, role: true, emailVerified: true },
    });
    if (!user) throw new UnauthorizedException('User account is inactive or unavailable.');

    if (user.role === 'SELLER') {
      const seller = await this.prisma.seller.findUnique({ where: { userId: user.id }, select: { status: true } });
      if (!seller || seller.status !== 'ACTIVE') throw new UnauthorizedException('Seller account is not active.');
    }

    return {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isEmailVerified: Boolean(user.emailVerified),
      isTwoFactorEnabled: payload.isTwoFactorEnabled,
    };
  }
}
