CREATE TABLE "product_variants" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "warehouseProductId" TEXT NOT NULL,
  "sku" TEXT NOT NULL,
  "name" TEXT,
  "attributes" TEXT NOT NULL DEFAULT '{}',
  "price" DECIMAL,
  "stock" INTEGER NOT NULL DEFAULT 0,
  "image" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "product_variants_warehouseProductId_fkey"
    FOREIGN KEY ("warehouseProductId") REFERENCES "warehouse_products" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "product_variants_sku_key" ON "product_variants"("sku");
CREATE INDEX "product_variants_warehouseProductId_status_idx" ON "product_variants"("warehouseProductId", "status");
