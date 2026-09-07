import { Injectable } from '@nestjs/common'

type ChatMessageListener = (conversationId: string, message: unknown) => void

@Injectable()
export class ChatEventsService {
  private readonly listeners = new Set<ChatMessageListener>()

  subscribe(listener: ChatMessageListener) {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  emitMessage(conversationId: string, message: unknown) {
    this.listeners.forEach((listener) => listener(conversationId, message))
  }
}