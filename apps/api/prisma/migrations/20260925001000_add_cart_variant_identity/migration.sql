ALTER TABLE "cart_items" ADD COLUMN "variantId" TEXT;
ALTER TABLE "cart_items" ADD COLUMN "variantSku" TEXT;
ALTER TABLE "order_items" ADD COLUMN "variantId" TEXT;
ALTER TABLE "order_items" ADD COLUMN "variantSku" TEXT;

CREATE INDEX "cart_items_variantId_idx" ON "cart_items"("variantId");
CREATE INDEX "order_items_variantId_idx" ON "order_items"("variantId");
CREATE UNIQUE INDEX "cart_items_cartId_sellerId_warehouseProductId_variantId_key"
  ON "cart_items"("cartId", "sellerId", "warehouseProductId", "variantId");

CREATE INDEX "cart_items_variantId_fk_idx" ON "cart_items"("variantId");
CREATE INDEX "order_items_variantId_fk_idx" ON "order_items"("variantId");
