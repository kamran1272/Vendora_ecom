import { Controller, Post, Get, Body, Param, Put } from '@nestjs/common';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  send(@Body() notificationData: any) {
    return this.notificationsService.send(notificationData);
  }

  @Get('user/:userId')
  getUserNotifications(@Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(Number(userId));
  }

  @Put(':notificationId/read')
  markAsRead(@Param('notificationId') notificationId: string) {
    return this.notificationsService.markAsRead(Number(notificationId));
  }
}
