ALTER TABLE "orders" ADD COLUMN "idempotencyKey" TEXT;
CREATE UNIQUE INDEX "orders_idempotencyKey_key" ON "orders"("idempotencyKey");

CREATE TABLE "coupons" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "discountType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
  "discountValue" DECIMAL NOT NULL,
  "minimumSubtotal" DECIMAL NOT NULL DEFAULT 0,
  "maximumDiscount" DECIMAL,
  "startsAt" DATETIME,
  "expiresAt" DATETIME,
  "usageLimit" INTEGER,
  "usageCount" INTEGER NOT NULL DEFAULT 0,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);
CREATE INDEX "coupons_active_startsAt_expiresAt_idx" ON "coupons"("active", "startsAt", "expiresAt");

CREATE TABLE "commerce_config" (
  "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'default',
  "taxRate" DECIMAL NOT NULL DEFAULT 0.08,
  "shippingPerSeller" DECIMAL NOT NULL DEFAULT 12,
  "freeShippingMinimum" DECIMAL NOT NULL DEFAULT 0,
  "updatedAt" DATETIME NOT NULL
);