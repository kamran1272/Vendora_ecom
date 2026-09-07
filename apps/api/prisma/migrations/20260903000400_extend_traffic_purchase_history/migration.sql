ALTER TABLE "seller_package_purchases" ADD COLUMN "amount" REAL NOT NULL DEFAULT 0;
ALTER TABLE "seller_package_purchases" ADD COLUMN "paymentMethod" TEXT NOT NULL DEFAULT 'MANUAL';