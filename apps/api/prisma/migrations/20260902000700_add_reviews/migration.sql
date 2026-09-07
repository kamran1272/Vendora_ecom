CREATE TABLE "reviews" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customerId" TEXT NOT NULL,
    "productId" TEXT,
    "warehouseProductId" TEXT,
    "sellerId" TEXT,
    "rating" INTEGER NOT NULL,
    "title" TEXT,
    "text" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "reviews_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reviews_warehouseProductId_fkey" FOREIGN KEY ("warehouseProductId") REFERENCES "warehouse_products" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "reviews_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "review_reports" ("id" TEXT NOT NULL PRIMARY KEY, "reviewId" TEXT NOT NULL, "reporterId" TEXT, "reason" TEXT NOT NULL, "status" TEXT NOT NULL DEFAULT 'OPEN', "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "review_reports_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "review_reports_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE);
CREATE TABLE "review_replies" ("id" TEXT NOT NULL PRIMARY KEY, "reviewId" TEXT NOT NULL, "authorId" TEXT NOT NULL, "text" TEXT NOT NULL, "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "review_replies_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE, CONSTRAINT "review_replies_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE);
CREATE INDEX "reviews_status_createdAt_idx" ON "reviews"("status", "createdAt");
CREATE INDEX "reviews_productId_idx" ON "reviews"("productId");
CREATE INDEX "reviews_sellerId_idx" ON "reviews"("sellerId");
CREATE INDEX "review_reports_reviewId_status_idx" ON "review_reports"("reviewId", "status");
CREATE INDEX "review_replies_reviewId_createdAt_idx" ON "review_replies"("reviewId", "createdAt");