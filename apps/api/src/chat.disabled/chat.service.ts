import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@/database/prisma.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { ChatEventsService } from './chat-events.service';
import { UserRole } from '@/users/users.service';
import { basename, resolve } from 'path';

const ConversationType = {
  CUSTOMER_SELLER: 'CUSTOMER_SELLER',
  CUSTOMER_ADMIN: 'CUSTOMER_ADMIN',
  SELLER_ADMIN: 'SELLER_ADMIN',
  CUSTOMER_SUPPORT: 'CUSTOMER_SUPPORT',
  SELLER_SUPPORT: 'SELLER_SUPPORT',
  ORDER_SUPPORT: 'ORDER_SUPPORT',
} as const;

const ConversationStatus = {
  OPEN: 'OPEN',
  PENDING: 'PENDING',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
} as const;

const ConversationPriority = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

const ChatParticipantRole = {
  CUSTOMER: 'CUSTOMER',
  SELLER: 'SELLER',
  ADMIN: 'ADMIN',
  SUPPORT_AGENT: 'SUPPORT_AGENT',
} as const;

const ChatMessageType = {
  TEXT: 'TEXT',
  IMAGE: 'IMAGE',
  FILE: 'FILE',
  SYSTEM: 'SYSTEM',
  ORDER: 'ORDER',
  PRODUCT: 'PRODUCT',
} as const;

type ConversationTypeValue = (typeof ConversationType)[keyof typeof ConversationType];
type ConversationStatusValue = (typeof ConversationStatus)[keyof typeof ConversationStatus];
type ConversationPriorityValue = (typeof ConversationPriority)[keyof typeof ConversationPriority];
type ChatMessageTypeValue = (typeof ChatMessageType)[keyof typeof ChatMessageType];

export type ChatUserContext = {
  userId: string;
  role: string;
};

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly chatEvents: ChatEventsService,
  ) {}

  private async getSellerIdForUser(userId: string): Promise<string | null> {
    const seller = await this.prisma.seller.findUnique({
      where: { userId },
      select: { id: true },
    });

    return seller?.id ?? null;
  }

  async getSellerSupportConversationForUser(userId: string) {
    const sellerId = await this.getSellerIdForUser(userId);
    if (!sellerId) throw new ForbiddenException('Seller profile not found.');

    const conversation = await this.notificationsService.getOrCreateSellerConversation(sellerId);
    await this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId: conversation.id, userId } },
      update: { role: ChatParticipantRole.SELLER },
      create: { conversationId: conversation.id, userId, role: ChatParticipantRole.SELLER },
    });

    return conversation;
  }

  async getMessageAttachmentPath(messageId: string, user: ChatUserContext) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId }, select: { conversationId: true, attachmentUrl: true } });
    if (!message?.attachmentUrl) throw new NotFoundException('Attachment not found.');
    const conversation = await this.validateConversationAccess(message.conversationId, user);
    if (!conversation.sellerId) throw new NotFoundException('Attachment not found.');
    let storedName = '';
    try {
      storedName = basename(decodeURIComponent(new URL(message.attachmentUrl).pathname));
    } catch {
      throw new NotFoundException('Attachment not found.');
    }
    const file = await this.prisma.uploadedFile.findFirst({ where: { sellerId: conversation.sellerId, storedName }, select: { storedName: true, mimeType: true } });
    if (!file) throw new NotFoundException('Attachment not found.');
    return { path: resolve(__dirname, '../uploads', file.storedName), mimeType: file.mimeType };
  }

  private async validateConversationAccess(
    conversationId: string,
    user: ChatUserContext,
  ) {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        id: true,
        customerId: true,
        sellerId: true,
        type: true,
      },
    });

    if (!conversation) {
      throw new NotFoundException('Conversation not found.');
    }

    if (user.role === UserRole.SELLER) {
      const sellerId = await this.getSellerIdForUser(user.userId);
      if (!sellerId || conversation.sellerId !== sellerId) {
        throw new ForbiddenException('You do not have access to this seller support conversation.');
      }
    }

    if (
      user.role === UserRole.ADMIN ||
      user.role === UserRole.SUPER_ADMIN ||
      user.role === UserRole.STAFF
    ) {
      return conversation;
    }

    const participant = await this.prisma.conversationParticipant.findUnique({
      where: { conversationId_userId: { conversationId, userId: user.userId } },
      select: { role: true },
    });
    if (participant && (user.role !== UserRole.SELLER || participant.role === ChatParticipantRole.SELLER)) return conversation;

    throw new ForbiddenException('You do not have access to this conversation.');
  }

  async getConversationsForUser(userId: string, role: string) {
    const sellerId = role === UserRole.SELLER ? await this.getSellerIdForUser(userId) : null;
    const sellerThreads = await this.prisma.conversation.findMany({
      where: { type: { in: [ConversationType.SELLER_SUPPORT, 'SELLER_APPLICATION'] }, sellerId: sellerId ? sellerId : { not: null } },
      distinct: ['sellerId'],
      select: { sellerId: true },
    });
    await Promise.all(sellerThreads.filter((thread): thread is { sellerId: string } => Boolean(thread.sellerId)).map((thread) => this.notificationsService.getOrCreateSellerConversation(thread.sellerId)));

    const allConversations = await this.prisma.conversation.findMany({
      where:
        role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.STAFF
          ? {}
          : role === UserRole.SELLER
            ? {
                sellerId: await this.getSellerIdForUser(userId),
              }
            : {
                customerId: userId,
              },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        seller: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        shop: {
          select: { id: true, name: true },
        },
        product: {
          select: { id: true, name: true },
        },
        order: {
          select: { id: true, status: true, total: true },
        },
        participants: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            sender: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { lastMessageAt: 'desc' },
    });

    const conversations = await Promise.all(
      allConversations.map(async (conversation) => {
        const participant = await this.prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: {
              conversationId: conversation.id,
              userId,
            },
          },
          select: { lastReadAt: true, lastSeenAt: true },
        });

        const lastReadAt = participant?.lastReadAt ?? new Date(0);
        const unreadRoles = role === UserRole.SELLER
          ? ['ADMIN', 'SYSTEM']
          : role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN || role === UserRole.STAFF
            ? ['SELLER', 'CUSTOMER', 'SYSTEM']
            : ['ADMIN', 'SELLER', 'SYSTEM'];
        const unreadCount = await this.prisma.chatMessage.count({
          where: { conversationId: conversation.id, createdAt: { gt: lastReadAt }, senderRole: { in: unreadRoles } },
        });

        return {
          ...conversation,
          unreadCount,
          online: Boolean(participant?.lastSeenAt && participant.lastSeenAt.getTime() > Date.now() - 90_000),
          typing: Boolean(conversation.typingAt && conversation.typingAt.getTime() > Date.now() - 8_000 && conversation.typingUserId !== userId),
        };
      }),
    );

    return conversations;
  }

  async createConversation(user: ChatUserContext, payload: any) {
    const type = payload.type as ConversationTypeValue;

    if (!type) {
      throw new BadRequestException('Conversation type is required.');
    }

    if (type === ConversationType.SELLER_SUPPORT) {
      if (user.role === UserRole.CUSTOMER) throw new ForbiddenException('Customers must use customer support or customer-seller conversations.');
      const sellerId = user.role === UserRole.SELLER
        ? await this.getSellerIdForUser(user.userId)
        : String(payload.sellerId || '');
      if (!sellerId) throw new BadRequestException('Seller is required for seller support conversations.');
      const seller = await this.prisma.seller.findUnique({ where: { id: sellerId }, select: { userId: true } });
      if (!seller) throw new BadRequestException('Seller not found.');
      const conversation = await this.notificationsService.getOrCreateSellerConversation(sellerId, payload);
      await this.prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: seller.userId } }, update: { role: ChatParticipantRole.SELLER }, create: { conversationId: conversation.id, userId: seller.userId, role: ChatParticipantRole.SELLER } });
      if (user.role !== UserRole.SELLER) {
        await this.prisma.conversationParticipant.upsert({ where: { conversationId_userId: { conversationId: conversation.id, userId: user.userId } }, update: { role: ChatParticipantRole.ADMIN }, create: { conversationId: conversation.id, userId: user.userId, role: ChatParticipantRole.ADMIN } });
      }
      return conversation;
    }

    const customerId =
      user.role === UserRole.CUSTOMER ? user.userId : payload.customerId ?? null;

    if (!customerId) {
      throw new BadRequestException('Customer is required for this conversation.');
    }

    const sellerId = payload.sellerId ?? null;
    const shopId = payload.shopId ?? null;
    const productId = payload.productId ?? null;
    const orderId = payload.orderId ?? null;

    if (type === ConversationType.CUSTOMER_SELLER && !sellerId) {
      throw new BadRequestException('Seller is required for customer-seller conversations.');
    }

    if (sellerId) {
      const seller = await this.prisma.seller.findUnique({
        where: { id: String(sellerId) },
        select: { id: true, userId: true },
      });

      if (!seller) {
        throw new BadRequestException('Seller not found.');
      }
    }

    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF].includes(user.role as any);
    if (!isAdmin) {
      if (user.role === UserRole.SELLER) throw new ForbiddenException('Sellers can only use their own seller conversations.');
      if (customerId !== user.userId) throw new ForbiddenException('Customers can only create their own conversations.');
    }

    if (orderId) {
      const order = await this.prisma.order.findFirst({
        where: {
          id: String(orderId),
          ...(user.role === UserRole.CUSTOMER ? { userId: user.userId } : {}),
          ...(user.role === UserRole.SELLER && sellerId ? { items: { some: { sellerId } } } : {}),
        },
        select: { id: true },
      });
      if (!order) throw new ForbiddenException('You do not have access to this order.');
    }

    const existingConversation = await this.prisma.conversation.findFirst({
      where: { type, customerId, sellerId },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'asc' }],
    });
    if (existingConversation) {
      await this.prisma.conversationParticipant.upsert({
        where: { conversationId_userId: { conversationId: existingConversation.id, userId: customerId } },
        update: { role: ChatParticipantRole.CUSTOMER },
        create: { conversationId: existingConversation.id, userId: customerId, role: ChatParticipantRole.CUSTOMER },
      });
      if (sellerId) {
        const seller = await this.prisma.seller.findUnique({ where: { id: String(sellerId) }, select: { userId: true } });
        if (seller) {
          await this.prisma.conversationParticipant.upsert({
            where: { conversationId_userId: { conversationId: existingConversation.id, userId: seller.userId } },
            update: { role: ChatParticipantRole.SELLER },
            create: { conversationId: existingConversation.id, userId: seller.userId, role: ChatParticipantRole.SELLER },
          });
        }
      }
      return this.prisma.conversation.findUnique({
        where: { id: existingConversation.id },
        include: { customer: { select: { id: true, name: true, email: true } }, seller: { include: { user: { select: { id: true, name: true, email: true } } } }, participants: true },
      });
    }

    const conversation = await this.prisma.conversation.create({
      data: {
        type,
        customerId,
        sellerId,
        shopId,
        productId,
        orderId,
        subject: payload.subject ?? null,
        status: (payload.status ?? ConversationStatus.OPEN) as ConversationStatusValue,
        priority: (payload.priority ?? ConversationPriority.NORMAL) as ConversationPriorityValue,
        category: String(payload.category ?? 'OTHER').toUpperCase(),
        adminNotes: payload.adminNotes ?? null,
      },
    });

    await this.prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId: conversation.id,
          userId: customerId,
        },
      },
      update: { role: ChatParticipantRole.CUSTOMER },
      create: {
        conversationId: conversation.id,
        userId: customerId,
        role: ChatParticipantRole.CUSTOMER,
      },
    });

    if (sellerId) {
      await this.prisma.conversationParticipant.upsert({
        where: {
          conversationId_userId: {
            conversationId: conversation.id,
            userId: (await this.prisma.seller.findUnique({ where: { id: sellerId }, select: { userId: true } }))?.userId ?? sellerId,
          },
        },
        update: { role: ChatParticipantRole.SELLER },
        create: {
          conversationId: conversation.id,
          userId: (await this.prisma.seller.findUnique({ where: { id: sellerId }, select: { userId: true } }))?.userId ?? sellerId,
          role: ChatParticipantRole.SELLER,
        },
      });
    }

    this.notificationsService.upsertTicketForConversation({
      conversationId: conversation.id,
      customerId,
      sellerId,
      type,
      subject: payload.subject ?? 'Support request',
      status: payload.status ?? ConversationStatus.OPEN,
      priority: payload.priority ?? ConversationPriority.NORMAL,
    });

    return this.prisma.conversation.findUnique({
      where: { id: conversation.id },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        seller: {
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        participants: true,
      },
    });
  }

  async getMessagesForConversation(conversationId: string, user: ChatUserContext, page = 1, limit = 50, search?: string) {
    await this.validateConversationAccess(conversationId, user);

    const skip = (Number(page) - 1) * Number(limit);

    const [messages, total, participants] = await Promise.all([
      this.prisma.chatMessage.findMany({
        where: { conversationId, ...(search?.trim() ? { content: { contains: search.trim() } } : {}) },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit),
        include: {
          sender: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.chatMessage.count({
        where: { conversationId, ...(search?.trim() ? { content: { contains: search.trim() } } : {}) },
      }),
      this.prisma.conversationParticipant.findMany({ where: { conversationId, userId: { not: user.userId } }, select: { lastReadAt: true } }),
    ]);

    const latestReadAt = participants.reduce<Date | null>((latest, participant) => {
      if (!participant.lastReadAt) return latest;
      return !latest || participant.lastReadAt > latest ? participant.lastReadAt : latest;
    }, null);

    return {
      data: messages.reverse().map((message) => ({ ...message, read: Boolean(message.readAt || (latestReadAt && latestReadAt >= message.createdAt)) })),
      page: Number(page),
      limit: Number(limit),
      total,
    };
  }

  async sendMessage(conversationId: string, user: ChatUserContext, payload: any) {
    await this.validateConversationAccess(conversationId, user);

    const content = payload.content?.trim();
    const messageType = (payload.type ?? ChatMessageType.TEXT) as ChatMessageTypeValue;

    if (!content && messageType === ChatMessageType.TEXT) {
      throw new BadRequestException('Message content is required.');
    }

    const message = await this.prisma.chatMessage.create({
      data: {
        conversationId,
        senderId: user.userId,
        senderRole: user.role === UserRole.SELLER ? 'SELLER' : user.role === UserRole.CUSTOMER ? 'CUSTOMER' : 'ADMIN',
        type: messageType,
        content: content ?? null,
        attachmentUrl: payload.attachmentUrl ?? null,
        attachmentName: payload.attachmentName ?? null,
        attachmentType: payload.attachmentType ?? (messageType === ChatMessageType.IMAGE || messageType === ChatMessageType.FILE ? messageType : null),
        replyToId: payload.replyToId ?? null,
      },
      include: {
        sender: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        status: ConversationStatus.OPEN,
      },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId },
      select: { userId: true },
    });

    for (const participant of participants) {
      if (participant.userId === user.userId) continue;
      this.notificationsService.send({
        userId: participant.userId,
        type: 'chat_message',
        title: 'New message',
        message: content ?? 'You received a new message.',
      });
    }

    this.chatEvents.emitMessage(conversationId, message);

    return message;
  }

  async deleteMessage(messageId: string, user: ChatUserContext) {
    const message = await this.prisma.chatMessage.findUnique({ where: { id: messageId } });
    if (!message) throw new NotFoundException('Message not found.');
    await this.validateConversationAccess(message.conversationId, user);
    if (message.senderId !== user.userId) throw new ForbiddenException('You can only delete your own messages.');
    return this.prisma.chatMessage.update({ where: { id: message.id }, data: { deletedAt: new Date(), content: null, attachmentUrl: null, attachmentName: null } });
  }

  async markConversationRead(conversationId: string, user: ChatUserContext) {
    await this.validateConversationAccess(conversationId, user);

    const participant = await this.prisma.conversationParticipant.upsert({
      where: {
        conversationId_userId: {
          conversationId,
          userId: user.userId,
        },
      },
      update: { lastReadAt: new Date() },
      create: {
        conversationId,
        userId: user.userId,
        role:
          user.role === UserRole.CUSTOMER
            ? ChatParticipantRole.CUSTOMER
            : user.role === UserRole.SELLER
              ? ChatParticipantRole.SELLER
              : ChatParticipantRole.ADMIN,
        lastReadAt: new Date(),
      },
    });

    const readRoles = user.role === UserRole.SELLER ? ['ADMIN', 'SYSTEM'] : user.role === UserRole.CUSTOMER ? ['ADMIN', 'SELLER', 'SYSTEM'] : ['SELLER', 'CUSTOMER', 'SYSTEM'];
    await this.prisma.chatMessage.updateMany({
      where: { conversationId, senderRole: { in: readRoles }, readAt: null },
      data: { readAt: new Date() },
    });

    return participant;
  }

  async markParticipantSeen(conversationId: string, user: ChatUserContext) {
    await this.validateConversationAccess(conversationId, user);
    return this.prisma.conversationParticipant.upsert({
      where: { conversationId_userId: { conversationId, userId: user.userId } },
      update: { lastSeenAt: new Date() },
      create: { conversationId, userId: user.userId, role: user.role === UserRole.CUSTOMER ? ChatParticipantRole.CUSTOMER : user.role === UserRole.SELLER ? ChatParticipantRole.SELLER : ChatParticipantRole.ADMIN, lastSeenAt: new Date() },
    });
  }

  async setTyping(conversationId: string, user: ChatUserContext, active: boolean) {
    await this.validateConversationAccess(conversationId, user);
    return this.prisma.conversation.update({ where: { id: conversationId }, data: { typingUserId: active ? user.userId : null, typingAt: active ? new Date() : null } });
  }

  async updateConversationStatus(conversationId: string, user: ChatUserContext, payload: any) {
    await this.validateConversationAccess(conversationId, user);

    const isAdmin = [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF].includes(user.role as any);
    if (!isAdmin) throw new ForbiddenException('Only administrators can update conversation status or metadata.');

    const status = payload.status ? payload.status as ConversationStatusValue : undefined;

    const conversation = await this.prisma.conversation.update({
      where: { id: conversationId },
      data: {
        ...(status ? { status } : {}),
        ...(payload.priority ? { priority: String(payload.priority).toUpperCase() } : {}),
        ...(payload.category ? { category: String(payload.category).toUpperCase() } : {}),
        ...(payload.adminNotes !== undefined ? { adminNotes: payload.adminNotes || null } : {}),
        ...(payload.assignedAdminId !== undefined ? { assignedAdminId: payload.assignedAdminId || null } : {}),
        ...(payload.aiEnabled !== undefined ? { aiEnabled: Boolean(payload.aiEnabled) } : {}),
        ...(payload.aiActive !== undefined ? { aiActive: Boolean(payload.aiActive) } : {}),
        ...(payload.humanTakeover !== undefined ? { humanTakeover: Boolean(payload.humanTakeover) } : {}),
        ...(payload.metadata !== undefined ? { metadata: payload.metadata ? JSON.stringify(payload.metadata) : null } : {}),
        ...(status ? { closedAt: status === ConversationStatus.CLOSED ? new Date() : null } : {}),
      },
    });

    return conversation;
  }

  private assertAdmin(user: ChatUserContext) {
    if (![UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.STAFF].includes(user.role as any)) {
      throw new ForbiddenException('Only administrators can manage support conversations.');
    }
  }

  async clearConversationMessages(conversationId: string, user: ChatUserContext) {
    await this.validateConversationAccess(conversationId, user);
    this.assertAdmin(user);
    const result = await this.prisma.chatMessage.deleteMany({ where: { conversationId } });
    await this.prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: null, updatedAt: new Date() } });
    return { success: true, deletedCount: result.count };
  }

  async deleteConversation(conversationId: string, user: ChatUserContext) {
    await this.validateConversationAccess(conversationId, user);
    this.assertAdmin(user);
    await this.prisma.conversation.delete({ where: { id: conversationId } });
    return { success: true, conversationId };
  }
}
