CREATE TABLE IF NOT EXISTS "conversations" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"type" TEXT NOT NULL DEFAULT 'CUSTOMER_SELLER',
	"customerId" TEXT,
	"sellerId" TEXT,
	"shopId" TEXT,
	"productId" TEXT,
	"orderId" TEXT,
	"subject" TEXT,
	"status" TEXT NOT NULL DEFAULT 'OPEN',
	"priority" TEXT NOT NULL DEFAULT 'NORMAL',
	"category" TEXT NOT NULL DEFAULT 'OTHER',
	"adminNotes" TEXT,
	"typingUserId" TEXT,
	"typingAt" DATETIME,
	"lastMessageAt" DATETIME,
	"closedAt" DATETIME,
	"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "conversation_participants" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"conversationId" TEXT NOT NULL,
	"userId" TEXT NOT NULL,
	"role" TEXT NOT NULL DEFAULT 'CUSTOMER',
	"joinedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"lastReadAt" DATETIME,
	"lastSeenAt" DATETIME,
	CONSTRAINT "conversation_participants_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT "conversation_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" TEXT NOT NULL PRIMARY KEY,
	"conversationId" TEXT NOT NULL,
	"senderId" TEXT NOT NULL,
	"type" TEXT NOT NULL DEFAULT 'TEXT',
	"content" TEXT,
	"attachmentUrl" TEXT,
	"attachmentName" TEXT,
	"replyToId" TEXT,
	"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
	"editedAt" DATETIME,
	"deletedAt" DATETIME,
	CONSTRAINT "chat_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
	CONSTRAINT "chat_messages_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "users" ("id") ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "conversation_participants_conversationId_userId_key" ON "conversation_participants"("conversationId", "userId");
CREATE INDEX IF NOT EXISTS "conversation_participants_userId_idx" ON "conversation_participants"("userId");
CREATE INDEX IF NOT EXISTS "conversation_participants_conversationId_lastReadAt_idx" ON "conversation_participants"("conversationId", "lastReadAt");
CREATE INDEX IF NOT EXISTS "conversations_category_idx" ON "conversations"("category");
CREATE INDEX IF NOT EXISTS "chat_messages_conversationId_createdAt_idx" ON "chat_messages"("conversationId", "createdAt");
