import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';
import { OAuth2Client } from 'google-auth-library';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';
import { AUTH_TOKEN_TTL, UserRole } from '@vendora/shared';
import { PrismaService } from '@/database/prisma.service';
import { UsersService } from '@/users/users.service';
import { MailService } from './mail.service';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  private sanitizeUser(user: any) {
    const { password, twoFactorCode, ...safeUser } = user;
    return safeUser;
  }

  private normalizeEmail(email: string) {
    if (!email || typeof email !== 'string') {
      throw new BadRequestException('Email is required.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new BadRequestException('Email is required.');
    }

    return normalizedEmail;
  }

  private hashLinkToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private createLinkToken() {
    const rawToken = randomBytes(32).toString('hex');
    return { rawToken, tokenHash: this.hashLinkToken(rawToken) };
  }

  private getWebBaseUrl() {
    return (process.env.WEB_APP_URL || process.env.CUSTOMER_APP_URL || 'http://localhost:4173').replace(/\/$/, '');
  }

  private validatePassword(password: string, fieldName = 'Password') {
    if (!password || typeof password !== 'string' || password.length < 8) {
      throw new BadRequestException(`${fieldName} must be at least 8 characters long.`);
    }
  }

  private async getActiveUserForAuth(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('This account has been deleted.');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('This account has been blocked.');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedException('This account is inactive.');
    }

    return user;
  }

  private async issueTokens(user: any, database: any = this.prisma) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isEmailVerified: Boolean(user.emailVerified),
      isTwoFactorEnabled: Boolean(user.twoFactorEnabled),
    };

    const accessToken = this.jwtService.sign(payload, { expiresIn: AUTH_TOKEN_TTL.ACCESS });
    const refreshToken = randomBytes(48).toString('hex');
    await database.refreshSession.create({
      data: {
        userId: String(user.id),
        tokenHash: this.hashLinkToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      accessToken,
      refreshToken,
      token_type: 'Bearer',
      expires_in: 15 * 60,
      user: this.sanitizeUser(user),
    };
  }

  private async requireSecondFactor(user: any, code?: string) {
    if (!user.twoFactorEnabled) return;
    if (!code) throw new UnauthorizedException('Two-factor authentication code is required.');

    const normalizedCode = String(code).trim();
    let valid = Boolean((user as any).twoFactorSecret && (await verify({ token: normalizedCode, secret: (user as any).twoFactorSecret })).valid);
    let backupCodes = (user as any).twoFactorBackupCodes ? JSON.parse((user as any).twoFactorBackupCodes) as string[] : [];

    if (!valid) {
      for (let index = 0; index < backupCodes.length; index += 1) {
        if (await compare(normalizedCode, backupCodes[index])) {
          valid = true;
          backupCodes = backupCodes.filter((_, backupIndex) => backupIndex !== index);
          await this.prisma.user.update({
            where: { id: user.id },
            data: { twoFactorBackupCodes: JSON.stringify(backupCodes) },
          });
          break;
        }
      }
    }

    if (!valid) throw new UnauthorizedException('Invalid two-factor authentication code.');
  }

  async register(credentials: any) {
    const { name, email, password } = credentials ?? {};

    if (!name || !email || !password) {
      throw new BadRequestException('Name, email and password are required.');
    }

    const normalizedEmail = this.normalizeEmail(email);
    this.validatePassword(password);

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
        role: UserRole.CUSTOMER,
      },
      select: { id: true },
    });

    const { rawToken, tokenHash } = this.createLinkToken();
    await (this.prisma as any).emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });
    await this.mailService.sendAccountLink(
      normalizedEmail,
      'Verify your Vendora email',
      'Verify your Vendora account',
      `${this.getWebBaseUrl()}/verify-email/${rawToken}`,
      'Verify your email',
    );

    return {
      message: 'Account created. Check your email to verify your account.',
      userId: user.id,
    };
  }

  async login(credentials: any) {
    const { email, password } = credentials ?? {};

    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.getActiveUserForAuth(normalizedEmail);

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password.');
    }

    await this.requireSecondFactor(user, credentials?.twoFactorCode);
    return this.issueTokens(user);
  }

  async adminLogin(credentials: any) {
    const { email, password, twoFactorCode } = credentials ?? {};

    if (!email || !password) {
      throw new BadRequestException('Email and password are required.');
    }

    const normalizedEmail = this.normalizeEmail(email);
    const user = await this.getActiveUserForAuth(normalizedEmail);

    const isPasswordValid = await compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid admin credentials.');
    }

    if (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('This account is not allowed to access the admin panel.');
    }

    await this.requireSecondFactor(user, twoFactorCode);
    return this.issueTokens(user);
  }

  async googleLogin(credentials: { idToken?: string }) {
    const idToken = credentials?.idToken?.trim();
    const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
    if (!idToken || !clientId) {
      throw new UnauthorizedException('A valid Google identity token is required.');
    }

    let payload;
    try {
      const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken, audience: clientId });
      payload = ticket.getPayload();
    } catch (_error) {
      throw new UnauthorizedException('Invalid Google identity token.');
    }

    const email = payload?.email;
    const name = payload?.name || 'Google User';

    if (!email || payload?.email_verified !== true) {
      throw new UnauthorizedException('Google account email is not verified.');
    }

    const normalizedEmail = email.trim().toLowerCase();
    let user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: await hash(randomBytes(32).toString('hex'), 10),
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

    const session = await (this.prisma as any).refreshSession.findUnique({
      where: { tokenHash: this.hashLinkToken(refreshToken) },
      include: { user: true },
    });
    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }

    const user = await this.getActiveUserForAuth(session.user.email);
    return this.prisma.$transaction(async (transaction) => {
      const replacement = await this.issueTokens(user, transaction);
      const replacementSession = await (transaction as any).refreshSession.findUnique({
        where: { tokenHash: this.hashLinkToken(replacement.refreshToken) },
        select: { id: true },
      });
      await (transaction as any).refreshSession.update({
        where: { id: session.id },
        data: { revokedAt: new Date(), replacedById: replacementSession?.id },
      });
      return replacement;
    });
  }

  async logout(userId?: string, refreshToken?: string) {
    if (userId) {
      await this.prisma.user
        .findUnique({ where: { id: String(userId) } })
        .catch(() => null);
    }

    if (refreshToken) {
      await (this.prisma as any).refreshSession.updateMany({
        where: { tokenHash: this.hashLinkToken(refreshToken), ...(userId ? { userId: String(userId) } : {}), revokedAt: null },
        data: { revokedAt: new Date() },
      });
    }

    return {
      message: 'Logged out successfully.',
      success: true,
    };
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: String(userId) } }) as any;
    if (!user) throw new UnauthorizedException('User not found.');

    const secret = generateSecret();
    const issuer = process.env.TWO_FACTOR_ISSUER?.trim() || 'Vendora';
    const otpauthUrl = generateURI({ issuer, label: user.email, secret });
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorSecret: secret, twoFactorEnabled: false } as any });
    return { secret, otpauthUrl, qrCodeDataUrl: await QRCode.toDataURL(otpauthUrl) };
  }

  async enableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: String(userId) } });
    if (!user?.twoFactorSecret) throw new BadRequestException('Start two-factor setup first.');
    if (!(await verify({ token: String(code || '').trim(), secret: user.twoFactorSecret })).valid) {
      throw new UnauthorizedException('Invalid authenticator code.');
    }

    const backupCodes = await Promise.all(Array.from({ length: 10 }, () => hash(randomBytes(8).toString('hex'), 10)));
    await this.prisma.user.update({
      where: { id: user.id },
      data: { twoFactorEnabled: true, twoFactorBackupCodes: JSON.stringify(backupCodes) } as any,
    });
    return { message: 'Two-factor authentication enabled.', backupCodes };
  }

  async disableTwoFactor(userId: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { id: String(userId) } });
    if (!user) throw new UnauthorizedException('User not found.');
    await this.requireSecondFactor({ ...user, twoFactorEnabled: true }, code);
    await this.prisma.user.update({ where: { id: user.id }, data: { twoFactorEnabled: false, twoFactorSecret: null, twoFactorBackupCodes: null } as any });
    return { message: 'Two-factor authentication disabled.' };
  }

  async verifyEmail(token: string) {
    const verificationToken = await (this.prisma as any).emailVerificationToken.findUnique({
      where: { tokenHash: this.hashLinkToken(token) },
      include: { user: true },
    });
    if (!verificationToken || verificationToken.usedAt || verificationToken.expiresAt <= new Date()) {
      throw new BadRequestException('This email verification link is invalid or expired.');
    }

    const updated = await this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id: verificationToken.userId },
        data: { emailVerified: true },
      });
      await (transaction as any).emailVerificationToken.update({
        where: { id: verificationToken.id },
        data: { usedAt: new Date() },
      });
      return user;
    });

    return {
      message: 'Email verified successfully.',
      user: this.sanitizeUser(updated),
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = this.normalizeEmail(email);
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

    const { rawToken, tokenHash } = this.createLinkToken();
    await (this.prisma as any).passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } });
    await (this.prisma as any).passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });
    await this.mailService.sendAccountLink(
      user.email,
      'Reset your Vendora password',
      'Reset your Vendora password',
      `${this.getWebBaseUrl()}/reset-password/${rawToken}`,
      'Reset your password',
    );

    return {
      message: 'Password reset instructions have been sent to your email.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    if (!token || !newPassword) {
      throw new BadRequestException('Reset token and new password are required.');
    }

    this.validatePassword(newPassword, 'New password');

    const resetRecord = await (this.prisma as any).passwordResetToken.findUnique({
      where: { tokenHash: this.hashLinkToken(token) },
    });
    if (!resetRecord || resetRecord.usedAt || resetRecord.expiresAt <= new Date()) {
      throw new UnauthorizedException('Invalid password reset token.');
    }

    const hashedPassword = await hash(newPassword, 10);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      }),
      (this.prisma as any).passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
    ]);

    return { message: 'Password reset successfully.' };
  }

  async getProfile(userId: number | string) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (user.deletedAt) {
      throw new UnauthorizedException('This account has been deleted.');
    }

    if (user.isBlocked) {
      throw new UnauthorizedException('This account has been blocked.');
    }

    if (user.status && user.status !== 'ACTIVE') {
      throw new UnauthorizedException('This account is inactive.');
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

    return this.prisma.order.findMany({
      where: { userId: String(userId) },
      include: { items: true, payment: true, shipment: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async applySellerAccount(userId: number | string, shopName: string, phone: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: String(userId) },
    });
    if (!user) {
      throw new BadRequestException('User not found.');
    }

    if (!shopName?.trim() || !phone?.trim()) {
      throw new BadRequestException('Shop name and phone are required.');
    }

    const existing = await this.prisma.sellerApplication.findFirst({
      where: { userId: user.id, status: 'PENDING' },
    });
    if (existing) {
      return { message: 'Seller application already exists.', application: existing };
    }

    const application = await this.prisma.sellerApplication.create({
      data: {
        userId: user.id,
        applicantName: user.name,
        email: user.email,
        phone: phone.trim(),
        shopName: shopName.trim(),
      },
    });
    return {
      message: 'Seller application submitted for admin approval.',
      application,
    };
  }

  validateToken(token: string) {
    return this.jwtService.verify(token);
  }
}
