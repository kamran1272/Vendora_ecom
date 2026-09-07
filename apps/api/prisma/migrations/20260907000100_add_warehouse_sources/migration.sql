ALTER TABLE "warehouse_products" ADD COLUMN "sourceId" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "warehouse_products" ADD COLUMN "externalProductId" TEXT;
ALTER TABLE "warehouse_products" ADD COLUMN "externalSku" TEXT;
ALTER TABLE "warehouse_products" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "warehouse_products" ADD COLUMN "importedAt" DATETIME;
ALTER TABLE "warehouse_products" ADD COLUMN "lastImportError" TEXT;

CREATE UNIQUE INDEX "warehouse_products_sourceId_externalProductId_key"
ON "warehouse_products"("sourceId", "externalProductId");