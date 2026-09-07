import { Module } from '@nestjs/common';
import { NotificationsModule } from '@/notifications/notifications.module';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatService } from './chat.service';
import { ChatEventsService } from './chat-events.service';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [NotificationsModule, JwtModule.register({ secret: process.env.JWT_SECRET || 'replace-with-a-long-random-secret' })],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, ChatEventsService],
  exports: [ChatService],
})
export class ChatModule {}
