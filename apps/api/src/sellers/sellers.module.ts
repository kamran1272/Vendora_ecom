import { Module } from '@nestjs/common';
import { SellersController } from './sellers.controller';
import { SellersService } from './sellers.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatModule } from '../chat.disabled/chat.module';

@Module({
  imports: [NotificationsModule, ChatModule],
  controllers: [SellersController],
  providers: [SellersService],
  exports: [SellersService],
})
export class SellersModule {}
