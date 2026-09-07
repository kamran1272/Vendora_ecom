PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_warehouse_products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT '',
    "description" TEXT,
    "shortDescription" TEXT,
    "sku" TEXT NOT NULL,
    "barcode" TEXT,
    "sourceId" TEXT NOT NULL DEFAULT 'manual',
    "externalProductId" TEXT NOT NULL DEFAULT '',
    "externalSku" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "importedAt" DATETIME,
    "lastImportError" TEXT,
    "images" TEXT NOT NULL DEFAULT '[]',
    "thumbnail" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "brand" TEXT,
    "basePrice" REAL NOT NULL,
    "salePrice" REAL,
    "sellerMargin" REAL NOT NULL DEFAULT 0,
    "stock" INTEGER NOT NULL DEFAULT 0,
    "minimumOrder" INTEGER NOT NULL DEFAULT 1,
    "maximumOrder" INTEGER NOT NULL DEFAULT 0,
    "weight" REAL,
    "dimensions" TEXT,
    "shippingInformation" TEXT,
    "attributes" TEXT NOT NULL DEFAULT '[]',
    "variants" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_warehouse_products" ("attributes", "barcode", "basePrice", "brand", "category", "createdAt", "currency", "description", "dimensions", "externalProductId", "externalSku", "id", "images", "importedAt", "lastImportError", "maximumOrder", "minimumOrder", "name", "salePrice", "sellerMargin", "shippingInformation", "shortDescription", "sku", "slug", "sourceId", "status", "stock", "subcategory", "thumbnail", "updatedAt", "variants", "weight") SELECT "attributes", "barcode", "basePrice", "brand", "category", "createdAt", "currency", "description", "dimensions", CASE WHEN "externalProductId" IS NULL OR "externalProductId" = '' THEN 'manual:' || "sku" ELSE "externalProductId" END, "externalSku", "id", "images", "importedAt", "lastImportError", "maximumOrder", "minimumOrder", "name", "salePrice", "sellerMargin", "shippingInformation", "shortDescription", "sku", "slug", "sourceId", "status", "stock", "subcategory", "thumbnail", "updatedAt", "variants", "weight" FROM "warehouse_products";
DROP TABLE "warehouse_products";
ALTER TABLE "new_warehouse_products" RENAME TO "warehouse_products";
CREATE UNIQUE INDEX "warehouse_products_sku_key" ON "warehouse_products"("sku");
CREATE INDEX "warehouse_products_status_createdAt_idx" ON "warehouse_products"("status", "createdAt");
CREATE INDEX "warehouse_products_category_idx" ON "warehouse_products"("category");
CREATE INDEX "warehouse_products_brand_idx" ON "warehouse_products"("brand");
CREATE UNIQUE INDEX "warehouse_products_sourceId_externalProductId_key" ON "warehouse_products"("sourceId", "externalProductId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
