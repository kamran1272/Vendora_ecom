ALTER TABLE "orders" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';

CREATE TABLE "seller_wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "balance" REAL NOT NULL DEFAULT 0,
    "totalEarnings" REAL NOT NULL DEFAULT 0,
    "totalWithdrawn" REAL NOT NULL DEFAULT 0,
    "pendingBalance" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_wallets_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "seller_wallets_sellerId_key" ON "seller_wallets"("sellerId");

CREATE TABLE "wallet_transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "description" TEXT,
    "referenceId" TEXT,
    "referenceOrderId" TEXT,
    "balanceBefore" REAL,
    "balanceAfter" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" DATETIME,
    CONSTRAINT "wallet_transactions_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "seller_wallets" ("sellerId") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "wallet_transactions_sellerId_createdAt_idx" ON "wallet_transactions"("sellerId", "createdAt");
CREATE INDEX "wallet_transactions_sellerId_status_idx" ON "wallet_transactions"("sellerId", "status");
CREATE INDEX "wallet_transactions_referenceOrderId_idx" ON "wallet_transactions"("referenceOrderId");
