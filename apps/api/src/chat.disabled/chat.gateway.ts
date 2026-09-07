import {
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '@/database/prisma.service';
import { ChatEventsService } from './chat-events.service';

@WebSocketGateway({
  namespace: '/ws/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly chatEvents: ChatEventsService,
  ) {
    this.chatEvents.subscribe((conversationId, message) => {
      this.server?.to(conversationId).emit('message:new', message);
    });
  }

  async handleConnection(client: Socket) {
    const authorization = client.handshake.headers.authorization;
    const token = client.handshake.auth?.token || (authorization?.startsWith('Bearer ') ? authorization.slice(7) : null);
    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(String(token));
      const user = await this.prisma.user.findFirst({ where: { id: String(payload.sub), deletedAt: null, isBlocked: false, status: 'ACTIVE' }, select: { id: true, role: true } });
      if (!user || (user.role === 'SELLER' && !await this.prisma.seller.findFirst({ where: { userId: user.id, status: 'ACTIVE' }, select: { id: true } }))) {
        client.disconnect(true);
        return;
      }
      client.data.user = user;
    } catch {
      client.disconnect(true);
      return;
    }

    client.emit('connected', { status: 'connected', socketId: client.id });
  }

  handleDisconnect(client: Socket) {
    console.log(`Chat socket disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinConversation')
  async joinConversation(client: Socket, @MessageBody() payload: { conversationId?: string }) {
    if (!payload?.conversationId) {
      return;
    }

    const user = client.data.user as { id: string; role: string } | undefined;
    if (!user) return;
    const conversation = await this.prisma.conversation.findFirst({ where: { id: payload.conversationId, ...(user.role === 'SELLER' ? { seller: { userId: user.id } } : user.role === 'CUSTOMER' ? { customerId: user.id } : {}) }, select: { id: true } });
    if (!conversation) return;

    client.join(payload.conversationId);
    client.emit('joinedConversation', { conversationId: payload.conversationId });
  }

  @SubscribeMessage('typing:start')
  typingStart(client: Socket, @MessageBody() payload: { conversationId?: string }) {
    if (!payload?.conversationId) {
      return;
    }
    if (!client.rooms.has(payload.conversationId)) return;

    client.to(payload.conversationId).emit('typing:start', {
      conversationId: payload.conversationId,
      userId: client.data.user?.id ?? client.id,
    });
  }

  @SubscribeMessage('typing:stop')
  typingStop(client: Socket, @MessageBody() payload: { conversationId?: string }) {
    if (!payload?.conversationId) {
      return;
    }
    if (!client.rooms.has(payload.conversationId)) return;

    client.to(payload.conversationId).emit('typing:stop', {
      conversationId: payload.conversationId,
      userId: client.data.user?.id ?? client.id,
    });
  }
}
