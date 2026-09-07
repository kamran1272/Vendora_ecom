CREATE TABLE "seller_subscription_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "action" TEXT NOT NULL DEFAULT 'PURCHASE',
    "purchasedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    CONSTRAINT "seller_subscription_purchases_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "seller_subscription_purchases_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "seller_subscription_purchases_sellerId_purchasedAt_idx" ON "seller_subscription_purchases"("sellerId", "purchasedAt");
CREATE INDEX "seller_subscription_purchases_sellerId_status_idx" ON "seller_subscription_purchases"("sellerId", "status");
CREATE INDEX "seller_subscription_purchases_planId_purchasedAt_idx" ON "seller_subscription_purchases"("planId", "purchasedAt");