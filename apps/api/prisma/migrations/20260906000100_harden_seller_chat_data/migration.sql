ALTER TABLE "chat_messages" ADD COLUMN "attachmentType" TEXT;

UPDATE "chat_messages"
SET "attachmentType" = "type"
WHERE "type" IN ('IMAGE', 'FILE') AND "attachmentType" IS NULL;

CREATE INDEX "conversations_sellerId_type_createdAt_idx"
ON "conversations"("sellerId", "type", "createdAt");

CREATE INDEX "chat_messages_conversationId_readAt_createdAt_idx"
ON "chat_messages"("conversationId", "readAt", "createdAt");

CREATE INDEX "chat_messages_conversationId_senderRole_createdAt_idx"
ON "chat_messages"("conversationId", "senderRole", "createdAt");