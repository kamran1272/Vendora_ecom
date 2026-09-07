import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateConversationDto {
  @IsIn(['CUSTOMER_SELLER', 'CUSTOMER_SUPPORT', 'SELLER_SUPPORT', 'ORDER_SUPPORT', 'CUSTOMER_ADMIN', 'SELLER_ADMIN'])
  type: string;

  @IsOptional()
  @IsString()
  sellerId?: string;

  @IsOptional()
  @IsString()
  shopId?: string;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  orderId?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsIn(['LOW', 'NORMAL', 'HIGH', 'URGENT'])
  priority?: string;

  @IsOptional()
  @IsString()
  customerId?: string;
}
