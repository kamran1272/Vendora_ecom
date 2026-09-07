import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';

@Injectable()
export class SellerRoleGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const user = context.switchToHttp().getRequest().user;
    if (user?.role !== 'SELLER') {
      throw new ForbiddenException('Seller role is required for this resource.');
    }
    return true;
  }
}
