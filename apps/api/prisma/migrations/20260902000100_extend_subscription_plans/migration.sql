ALTER TABLE "subscription_plans" ADD COLUMN "orderLimit" INTEGER NOT NULL DEFAULT -1;
ALTER TABLE "subscription_plans" ADD COLUMN "storageLimit" INTEGER NOT NULL DEFAULT -1;
ALTER TABLE "subscription_plans" ADD COLUMN "analytics" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscription_plans" ADD COLUMN "support" TEXT NOT NULL DEFAULT 'STANDARD';
ALTER TABLE "subscription_plans" ADD COLUMN "featuredProducts" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "subscription_plans" ADD COLUMN "customShop" BOOLEAN NOT NULL DEFAULT false;