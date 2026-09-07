import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async send(notificationData: any) {
    if (!notificationData?.userId) return null;
    return this.prisma.notification.create({ data: { userId: String(notificationData.userId), type: String(notificationData.type || 'SYSTEM'), title: String(notificationData.title || 'Notification'), message: String(notificationData.message || ''), entityId: notificationData.entityId ? String(notificationData.entityId) : null, entityType: notificationData.entityType ? String(notificationData.entityType) : null } });
  }

  async notifyAdmins(notificationData: any) {
    const admins = await this.prisma.user.findMany({ where: { role: { in: ['ADMIN', 'SUPER_ADMIN', 'STAFF'] }, deletedAt: null }, select: { id: true } });
    await Promise.all(admins.map((admin) => this.send({ ...notificationData, userId: admin.id })));
  }

  getUserNotifications(userId: number | string, unreadOnly = false) {
    return this.prisma.notification.findMany({ where: { userId: String(userId), ...(unreadOnly ? { readAt: null } : {}) }, orderBy: { createdAt: 'desc' }, take: 100 });
  }

  markAsRead(notificationId: number | string, userId: number | string) {
    return this.prisma.notification.updateMany({ where: { id: String(notificationId), userId: String(userId) }, data: { readAt: new Date() } });
  }

  markAllAsRead(userId: number | string) {
    return this.prisma.notification.updateMany({ where: { userId: String(userId), readAt: null }, data: { readAt: new Date() } });
  }

  getUnreadCount(userId: number | string) {
    return this.prisma.notification.count({ where: { userId: String(userId), readAt: null } }).then((count) => ({ count }));
  }

  upsertTicketForConversation(ticketData: any) {
    void this.notifyAdmins({ type: 'SUPPORT_TICKET', title: 'New support ticket', message: `${ticketData.subject || 'Support request'} is now in the queue.`, entityId: ticketData.conversationId, entityType: 'CONVERSATION' });
    return ticketData;
  }

  async getOrCreateSellerConversation(sellerId: string, details: { subject?: string; priority?: string; category?: string } = {}) {
    const threadKey = `SELLER_SUPPORT:${sellerId}`;
    return this.prisma.$transaction(async (tx) => {
      const conversations = await tx.conversation.findMany({
        where: { sellerId, type: { in: ['SELLER_SUPPORT', 'SELLER_APPLICATION'] } },
        orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
        include: { participants: true },
      });

      let primary = conversations[0];
      if (!primary) {
        try {
          primary = await tx.conversation.create({
            data: {
              sellerId,
              type: 'SELLER_SUPPORT',
              threadKey,
              subject: details.subject || 'Seller support',
              status: 'OPEN',
              priority: String(details.priority || 'NORMAL').toUpperCase(),
              category: String(details.category || 'SELLER').toUpperCase(),
            },
            include: { participants: true },
          });
        } catch (error: any) {
          if (error?.code !== 'P2002') throw error;
          const existing = await tx.conversation.findUnique({ where: { threadKey }, include: { participants: true } });
          if (!existing) throw error;
          primary = existing;
        }
      }

      if (!primary) throw new Error('Unable to create seller support conversation.');

      if (primary.threadKey !== threadKey || primary.type !== 'SELLER_SUPPORT') {
        await tx.conversation.update({ where: { id: primary.id }, data: { threadKey, type: 'SELLER_SUPPORT' } });
      }

      for (const duplicate of conversations.slice(1)) {
        await tx.chatMessage.updateMany({ where: { conversationId: duplicate.id }, data: { conversationId: primary.id } });
        for (const participant of duplicate.participants) {
          await tx.conversationParticipant.upsert({
            where: { conversationId_userId: { conversationId: primary.id, userId: participant.userId } },
            update: { lastReadAt: participant.lastReadAt, lastSeenAt: participant.lastSeenAt },
            create: { conversationId: primary.id, userId: participant.userId, role: participant.role, lastReadAt: participant.lastReadAt, lastSeenAt: participant.lastSeenAt },
          });
        }
        await tx.conversationParticipant.deleteMany({ where: { conversationId: duplicate.id } });
        await tx.conversation.delete({ where: { id: duplicate.id } });
      }

      const latestMessage = await tx.chatMessage.findFirst({ where: { conversationId: primary.id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true } });
      return tx.conversation.update({
        where: { id: primary.id },
        data: { ...(details.subject ? { status: 'OPEN', subject: details.subject } : {}), lastMessageAt: latestMessage?.createdAt ?? undefined },
        include: { participants: true },
      });
    });
  }

  createSupportTicket(ticketData: any) { return this.upsertTicketForConversation(ticketData); }
  listSupportTickets() { return this.prisma.conversation.findMany({ orderBy: { updatedAt: 'desc' }, take: 100 }); }
  getSupportTicket(ticketId: string | number) { return this.prisma.conversation.findUnique({ where: { id: String(ticketId) } }); }
  updateSupportTicketStatus(ticketId: string | number, status: string) { return this.prisma.conversation.update({ where: { id: String(ticketId) }, data: { status } }); }
}
