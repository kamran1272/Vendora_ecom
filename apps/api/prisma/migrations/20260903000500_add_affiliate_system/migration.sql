CREATE TABLE "affiliate_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL UNIQUE,
    "code" TEXT NOT NULL UNIQUE,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "affiliate_profiles_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "affiliate_referrals" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliateId" TEXT NOT NULL,
    "customerName" TEXT,
    "customerEmail" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REGISTERED',
    "registeredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "convertedAt" DATETIME,
    CONSTRAINT "affiliate_referrals_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE "affiliate_commissions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "affiliateId" TEXT NOT NULL,
    "referralId" TEXT,
    "orderId" TEXT,
    "amount" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" DATETIME,
    CONSTRAINT "affiliate_commissions_affiliateId_fkey" FOREIGN KEY ("affiliateId") REFERENCES "affiliate_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "affiliate_commissions_referralId_fkey" FOREIGN KEY ("referralId") REFERENCES "affiliate_referrals" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "affiliate_referrals_affiliateId_registeredAt_idx" ON "affiliate_referrals"("affiliateId", "registeredAt");
CREATE INDEX "affiliate_referrals_affiliateId_status_idx" ON "affiliate_referrals"("affiliateId", "status");
CREATE INDEX "affiliate_commissions_affiliateId_createdAt_idx" ON "affiliate_commissions"("affiliateId", "createdAt");
CREATE INDEX "affiliate_commissions_affiliateId_status_idx" ON "affiliate_commissions"("affiliateId", "status");