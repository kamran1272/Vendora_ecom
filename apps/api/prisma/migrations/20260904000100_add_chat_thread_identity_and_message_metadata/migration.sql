-- Additive chat metadata. Existing rows remain valid via defaults/nullability.
ALTER TABLE "conversations" ADD COLUMN "threadKey" TEXT;
ALTER TABLE "conversations" ADD COLUMN "assignedAdminId" TEXT;
ALTER TABLE "chat_messages" ADD COLUMN "senderRole" TEXT NOT NULL DEFAULT 'SYSTEM';
ALTER TABLE "chat_messages" ADD COLUMN "readAt" DATETIME;
ALTER TABLE "chat_messages" ADD COLUMN "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "chat_messages"
SET "senderRole" = CASE
    WHEN EXISTS (SELECT 1 FROM "sellers" s WHERE s."userId" = "chat_messages"."senderId") THEN 'SELLER'
    WHEN EXISTS (SELECT 1 FROM "users" u WHERE u."id" = "chat_messages"."senderId" AND u."role" IN ('ADMIN', 'SUPER_ADMIN', 'STAFF')) THEN 'ADMIN'
    ELSE 'CUSTOMER'
END;

CREATE UNIQUE INDEX "conversations_threadKey_key" ON "conversations"("threadKey");
CREATE INDEX "conversations_assignedAdminId_idx" ON "conversations"("assignedAdminId");

PRAGMA foreign_keys=OFF;
CREATE TABLE "new_conversations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL DEFAULT 'CUSTOMER_SELLER',
    "customerId" TEXT,
    "sellerId" TEXT,
    "shopId" TEXT,
    "productId" TEXT,
    "orderId" TEXT,
    "threadKey" TEXT,
    "assignedAdminId" TEXT,
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
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "conversations_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "conversations_assignedAdminId_fkey" FOREIGN KEY ("assignedAdminId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "conversations_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "conversations_shopId_fkey" FOREIGN KEY ("shopId") REFERENCES "shops" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "conversations_productId_fkey" FOREIGN KEY ("productId") REFERENCES "warehouse_products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "conversations_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_conversations" SELECT "id", "type", "customerId", "sellerId", "shopId", "productId", "orderId", "threadKey", "assignedAdminId", "subject", "status", "priority", "category", "adminNotes", "typingUserId", "typingAt", "lastMessageAt", "closedAt", "createdAt", "updatedAt" FROM "conversations";
DROP TABLE "conversations";
ALTER TABLE "new_conversations" RENAME TO "conversations";
CREATE UNIQUE INDEX "conversations_threadKey_key" ON "conversations"("threadKey");
CREATE INDEX "conversations_customerId_idx" ON "conversations"("customerId");
CREATE INDEX "conversations_sellerId_idx" ON "conversations"("sellerId");
CREATE INDEX "conversations_shopId_idx" ON "conversations"("shopId");
CREATE INDEX "conversations_status_idx" ON "conversations"("status");
CREATE INDEX "conversations_lastMessageAt_idx" ON "conversations"("lastMessageAt");
CREATE INDEX "conversations_assignedAdminId_idx" ON "conversations"("assignedAdminId");
PRAGMA foreign_keys=ON;

INSERT OR IGNORE INTO "conversation_participants" ("id", "conversationId", "userId", "role")
SELECT lower(hex(randomblob(16))), c."id", c."customerId", 'CUSTOMER'
FROM "conversations" c
WHERE c."customerId" IS NOT NULL;

INSERT OR IGNORE INTO "conversation_participants" ("id", "conversationId", "userId", "role")
SELECT lower(hex(randomblob(16))), c."id", s."userId", 'SELLER'
FROM "conversations" c
JOIN "sellers" s ON s."id" = c."sellerId"
WHERE c."sellerId" IS NOT NULL;
