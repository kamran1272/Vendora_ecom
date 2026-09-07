import { Controller, Post, Get, Body, Param, Put, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { UserRole } from '@/users/users.service';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Post()
  send(@Body() notificationData: any) {
    return this.notificationsService.send(notificationData);
  }

  @Get('user/:userId')
  getUserNotifications(@Req() req: any, @Param('userId') userId: string) {
    return this.notificationsService.getUserNotifications(req.user.userId === userId ? userId : req.user.userId);
  }

  @Put(':notificationId/read')
  markAsRead(@Req() req: any, @Param('notificationId') notificationId: string) {
    return this.notificationsService.markAsRead(notificationId, req.user.userId);
  }

  @Get('mine')
  mine(@Req() req: any, @Query('unreadOnly') unreadOnly?: string) { return this.notificationsService.getUserNotifications(req.user.userId, unreadOnly === 'true'); }

  @Get('unread-count')
  unreadCount(@Req() req: any) { return this.notificationsService.getUnreadCount(req.user.userId); }

  @Post('read-all')
  readAll(@Req() req: any) { return this.notificationsService.markAllAsRead(req.user.userId); }

  @Get('support-tickets')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getSupportTickets() {
    return this.notificationsService.listSupportTickets();
  }

  @Post('support-tickets')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createSupportTicket(@Body() ticketData: any) {
    return this.notificationsService.createSupportTicket(ticketData);
  }

  @Get('support-tickets/:ticketId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getSupportTicket(@Param('ticketId') ticketId: string) {
    return this.notificationsService.getSupportTicket(ticketId);
  }

  @Patch('support-tickets/:ticketId/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateSupportTicketStatus(@Param('ticketId') ticketId: string, @Body() body: any) {
    return this.notificationsService.updateSupportTicketStatus(ticketId, body.status);
  }
}
