import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from '@/users/users.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async register(@Body() credentials: any) {
    return this.authService.register(credentials);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async login(@Body() credentials: any) {
    return this.authService.login(credentials);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any, @Body() body?: { refreshToken?: string }) {
    return this.authService.logout(req.user?.userId, body?.refreshToken);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('admin/login')
  async adminLogin(@Body() credentials: any) {
    return this.authService.adminLogin(credentials);
  }

  @Post('google')
  async googleLogin(@Body() googleProfile: any) {
    return this.authService.googleLogin(googleProfile);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body() body: { refreshToken: string }) {
    return this.authService.refreshToken(body.refreshToken);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { userId: number }) {
    return this.authService.verifyEmail(body.userId);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.authService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('addresses')
  async addAddress(@Req() req: any, @Body() address: any) {
    return this.authService.addAddress(req.user.userId, address);
  }

  @UseGuards(JwtAuthGuard)
  @Get('addresses')
  async getAddresses(@Req() req: any) {
    return this.authService.getAddresses(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('addresses/:id')
  async deleteAddress(@Req() req: any, @Param('id') id: string) {
    return this.authService.deleteAddress(req.user.userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('orders')
  async getOrders(@Req() req: any) {
    return this.authService.getOrders(req.user.userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SELLER)
  @Post('seller/apply')
  async applySellerAccount(@Req() req: any, @Body() body: { shopName: string }) {
    return this.authService.applySellerAccount(req.user.userId, body.shopName);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin/overview')
  async adminOverview() {
    return {
      message: 'Admin access confirmed.',
      roles: [UserRole.ADMIN, UserRole.SUPER_ADMIN],
    };
  }
}
