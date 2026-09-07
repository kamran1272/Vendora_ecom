CREATE TABLE "seller_packages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "slug" TEXT NOT NULL UNIQUE,
    "price" REAL NOT NULL DEFAULT 0,
    "trafficLimit" INTEGER NOT NULL DEFAULT -1,
    "duration" INTEGER NOT NULL DEFAULT 30,
    "description" TEXT,
    "features" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "seller_package_purchases" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sellerId" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "startsAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "seller_package_purchases_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "sellers" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "seller_package_purchases_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "seller_packages" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "seller_packages_status_price_idx" ON "seller_packages"("status", "price");
CREATE INDEX "seller_package_purchases_sellerId_status_idx" ON "seller_package_purchases"("sellerId", "status");
CREATE INDEX "seller_package_purchases_packageId_status_idx" ON "seller_package_purchases"("packageId", "status");