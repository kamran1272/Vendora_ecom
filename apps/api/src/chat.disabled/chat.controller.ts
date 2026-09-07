import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';

@UseGuards(JwtAuthGuard)
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversations')
  getConversations(@Req() req: any) {
    return this.chatService.getConversationsForUser(req.user.userId, req.user.role);
  }

  @Post('conversations')
  createConversation(@Req() req: any, @Body() body: CreateConversationDto) {
    return this.chatService.createConversation(req.user, body);
  }

  @Get('conversations/:conversationId/messages')
  getMessages(
    @Req() req: any,
    @Param('conversationId') conversationId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.chatService.getMessagesForConversation(
      conversationId,
      req.user,
      page ? Number(page) : 1,
      limit ? Number(limit) : 50,
      search,
    );
  }

  @Post('conversations/:conversationId/messages')
  sendMessage(@Req() req: any, @Param('conversationId') conversationId: string, @Body() body: any) {
    return this.chatService.sendMessage(conversationId, req.user, body);
  }

  @Delete('messages/:messageId')
  deleteMessage(@Req() req: any, @Param('messageId') messageId: string) {
    return this.chatService.deleteMessage(messageId, req.user);
  }

  @Get('messages/:messageId/attachment')
  async getMessageAttachment(@Req() req: any, @Param('messageId') messageId: string, @Res() response: any) {
    const attachment = await this.chatService.getMessageAttachmentPath(messageId, req.user);
    return response.type(attachment.mimeType).sendFile(attachment.path);
  }

  @Post('conversations/:conversationId/read')
  markAsRead(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.markConversationRead(conversationId, req.user);
  }

  @Post('conversations/:conversationId/seen')
  markAsSeen(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.markParticipantSeen(conversationId, req.user);
  }

  @Post('conversations/:conversationId/typing')
  setTyping(@Req() req: any, @Param('conversationId') conversationId: string, @Body() body: { active?: boolean }) {
    return this.chatService.setTyping(conversationId, req.user, body?.active !== false);
  }

  @Post('conversations/:conversationId/close')
  closeConversation(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.updateConversationStatus(conversationId, req.user, { status: 'CLOSED' });
  }

  @Post('conversations/:conversationId/reopen')
  reopenConversation(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.updateConversationStatus(conversationId, req.user, { status: 'OPEN' });
  }

  @Patch('conversations/:conversationId')
  updateConversation(@Req() req: any, @Param('conversationId') conversationId: string, @Body() body: any) {
    return this.chatService.updateConversationStatus(conversationId, req.user, body);
  }

  @Delete('conversations/:conversationId/messages')
  clearConversationMessages(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.clearConversationMessages(conversationId, req.user);
  }

  @Delete('conversations/:conversationId')
  deleteConversation(@Req() req: any, @Param('conversationId') conversationId: string) {
    return this.chatService.deleteConversation(conversationId, req.user);
  }
}
