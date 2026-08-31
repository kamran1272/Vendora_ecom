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
      { expiresIn: '7d' },
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

    const user = this.usersService.findByEmail(email);
    if (!user || user.password !== password) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('This account is not allowed to access the admin panel.');
    }

    if (user.twoFactorEnabled && user.twoFactorCode !== twoFactorCode) {
      throw new UnauthorizedException('Invalid two-factor authentication code.');
    }

    return this.issueTokens(user);
  }

  async googleLogin(profile: any) {
    const email = profile?.email || profile?.emails?.[0]?.value;
    const name = profile?.name || profile?.displayName || 'Google User';

    if (!email) {
      throw new BadRequestException('Google profile email is required.');
    }

    let user = this.usersService.findByEmail(email);
    if (!user) {
      user = this.usersService.create({
        email,
        password: 'google-oauth-user',
        name,
        role: UserRole.CUSTOMER,
        emailVerified: true,
        twoFactorEnabled: false,
        shopStatus: 'customer',
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

    const user = this.usersService.findOne(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }

    return this.issueTokens(user);
  }

  async verifyEmail(userId: number) {
    const user = this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    user.emailVerified = true;
    return {
      message: 'Email verified successfully.',
      user: this.sanitizeUser(user),
    };
  }

  async forgotPassword(email: string) {
    const user = this.usersService.findByEmail(email);
    if (!user) {
      return {
        message: 'If an account exists for this email, a reset link has been sent.',
      };
    }

    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, purpose: 'password-reset' },
      { expiresIn: '1h' },
    );

    return {
      message: 'Password reset instructions sent.',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Reset token and new password are required.');
    }

    const payload = this.jwtService.verify(token);
    if (payload.purpose !== 'password-reset') {
      throw new UnauthorizedException('Invalid password reset token.');
    }

    const user = this.usersService.findOne(payload.sub);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    user.password = newPassword;
    return { message: 'Password reset successfully.' };
  }

  async getProfile(userId: number) {
    const user = this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return this.sanitizeUser(user);
  }

  async addAddress(userId: number, address: any) {
    const user: any = this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!Array.isArray(user.addresses)) {
      user.addresses = [];
    }

    const newAddress = { id: user.addresses.length + 1, ...address };
    user.addresses.push(newAddress);
    return user.addresses;
  }

  async getOrders(userId: number) {
    const user = this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    return user.orders ?? [];
  }

  async applySellerAccount(userId: number, shopName: string) {
    const user: any = this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    user.role = UserRole.SELLER;
    user.shopStatus = 'pending';
    user.shopName = shopName;
    return {
      message: 'Seller application submitted for admin approval.',
      user: this.sanitizeUser(user),
    };
  }

  validateToken(token: string) {
    return this.jwtService.verify(token);
  }
}
