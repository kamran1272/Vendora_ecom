-- Add the shop ownership lookup index for seller products.
CREATE INDEX "seller_products_shopId_idx" ON "seller_products"("shopId");
