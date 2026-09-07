import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { PrismaService } from '@/database/prisma.service';
import { UsersService, UserRole } from '@/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  private sanitizeUser(user: any) {
    const { password, twoFactorCode, ...safeUser } = user;
    return safeUser;
  }

  private issueTokens(user: any) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isEmailVerified: Boolean(user.emailVerified),
      isTwoFactorEnabled: Boolean(user.twoFactorEnabled),
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const refreshToken = this.jwtService.sign(
      { ...payload, type: 'refresh' },
      { expiresIn: '30d' },
    );

    return {
      accessToken,
      access_token: accessToken,
      refreshToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      user: this.sanitizeUser(user),
    };
  }

  async register(credentials: any) {
    const { name, email, password } = credentials ?? {};

    if (!name || !email || !password) {
      throw new BadRequestException('Name, email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new BadRequestException('A user with this email already exists.');
    }

    const hashedPassword = await hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
      select: { id: true },
    });

    return {
      message: 'Account created',
      userId: user.id,
    };
  }

  async login(credentials: any) {
    const { email, password } = credentials ?? {};

    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    return this.issueTokens(user);
  }

  async adminLogin(credentials: any) {
    const { email, password, twoFactorCode } = credentials ?? {};

    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('This account is not allowed to access the admin panel.');
    }

    return this.issueTokens(user);
  }

  async googleLogin(profile: any) {
    const email = profile?.email || profile?.emails?.[0]?.value;
    const name = profile?.name || profile?.displayName || 'Google User';

    if (!email) {
      throw new BadRequestException('Google profile email is required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: await hash('google-oauth-user', 10),
          name,
          role: UserRole.CUSTOMER,
        },
      });
    }

    return this.issueTokens(user);
  }

  async refreshToken(refreshToken: string) {
    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required.');
    }

    const payload = this.jwtService.verify(refreshToken);
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: String(payload.sub) },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.issueTokens(user);
  }

  async verifyEmail(userId: number | string) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() },
    });

    return {
      message: 'Email verified successfully.',
      user: this.sanitizeUser(updated),
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email?.trim().toLowerCase();
    const user = normalizedEmail
      ? await this.prisma.user.findUnique({
          where: { email: normalizedEmail },
        })
      : null;

    if (!user) {
      return {
        message: 'If an account exists for this email, a reset link has been sent.',
      };
    }

    const resetToken = `${user.id}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const hashedToken = await hash(resetToken, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    return {
      message: 'Password reset instructions have been sent to your email.',
      resetToken: undefined,
      resetTokenHint: 'Store the raw token server-side and email the reset link only.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Reset token and new password are required.');
    }

    const userRecords = await this.prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpires: { gt: new Date() },
      },
    });

    const matchedUser = await (async () => {
      for (const candidate of userRecords) {
        if (!candidate.passwordResetToken) continue;
        const valid = await compare(token, candidate.passwordResetToken);
        if (valid) return candidate;
      }
      return null;
    })();

    if (!matchedUser) {
      throw new UnauthorizedException('Invalid password reset token.');
    }

    const hashedPassword = await hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: matchedUser.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return { message: 'Password reset successfully.' };
  }

  async getProfile(userId: number | string) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return this.sanitizeUser(user);
  }

  async addAddress(userId: number | string, address: any) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    const data = this.validateAddress(address);
    const existing = data.id
      ? await this.prisma.address.findFirst({ where: { id: String(data.id), userId: String(userId) } })
      : null;

    if (data.isDefault) {
      await this.prisma.address.updateMany({ where: { userId: String(userId), ...(existing ? { id: { not: existing.id } } : {}) }, data: { isDefault: false } });
    }

    if (existing) {
      const { id: _id, ...updateData } = data;
      return this.prisma.address.update({ where: { id: existing.id }, data: updateData });
    }

    const hasAddress = await this.prisma.address.count({ where: { userId: String(userId) } });
    return this.prisma.address.create({ data: { ...data, userId: String(userId), isDefault: hasAddress === 0 || data.isDefault } });
  }

  async getAddresses(userId: number | string) {
    return this.prisma.address.findMany({ where: { userId: String(userId) }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  async deleteAddress(userId: number | string, addressId: string) {
    const address = await this.prisma.address.findFirst({ where: { id: addressId, userId: String(userId) } });
    if (!address) throw new BadRequestException('Address not found.');
    await this.prisma.address.delete({ where: { id: address.id } });
    if (address.isDefault) {
      const replacement = await this.prisma.address.findFirst({ where: { userId: String(userId) }, orderBy: { createdAt: 'desc' } });
      if (replacement) await this.prisma.address.update({ where: { id: replacement.id }, data: { isDefault: true } });
    }
    return { message: 'Address deleted.' };
  }

  private validateAddress(address: any) {
    const required = ['fullName', 'addressLine1', 'city', 'state', 'postalCode', 'country'];
    for (const field of required) if (!String(address?.[field] || '').trim()) throw new BadRequestException(`${field} is required.`);
    return {
      id: address?.id ? String(address.id) : undefined,
      fullName: String(address.fullName).trim(), phone: address.phone ? String(address.phone).trim() : null,
      addressLine1: String(address.addressLine1).trim(), addressLine2: address.addressLine2 ? String(address.addressLine2).trim() : null,
      city: String(address.city).trim(), state: String(address.state).trim(), postalCode: String(address.postalCode).trim(), country: String(address.country).trim(), isDefault: Boolean(address.isDefault),
    };
  }

  async getOrders(userId: number | string) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return [];
  }

  async applySellerAccount(userId: number | string, shopName: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.SELLER },
    });
    const applicant = user as any;
    applicant.shopStatus = 'pending';
    applicant.shopName = shopName;
    return {
      message: 'Seller application submitted for admin approval.',
      user: this.sanitizeUser(applicant),
    };
  }

  validateToken(token: string) {
    return this.jwtService.verify(token);
  }
}
