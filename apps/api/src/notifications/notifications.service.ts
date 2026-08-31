import { Injectable } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private notifications: any[] = [];

  send(notificationData: any) {
    const notification = { id: Math.random(), ...notificationData, createdAt: new Date() };
    this.notifications.push(notification);
    return notification;
  }

  getUserNotifications(userId: number) {
    return this.notifications.filter((n: any) => n.userId === userId);
  }

  markAsRead(notificationId: number) {
    const notification = this.notifications.find((n: any) => n.id === notificationId);
    if (notification) {
      notification.read = true;
    }
    return notification;
  }
}
