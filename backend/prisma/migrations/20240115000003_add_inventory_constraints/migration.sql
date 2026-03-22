-- CreateIndex
CREATE INDEX IF NOT EXISTS "InventoryItem_stockQuantity_idx" ON "InventoryItem"("stockQuantity");

-- Add check constraints to prevent negative values
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_stockQuantity_check" CHECK ("stockQuantity" >= 0);
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_reservedQuantity_check" CHECK ("reservedQuantity" >= 0);
ALTER TABLE "InventoryItem" ADD CONSTRAINT "InventoryItem_reserved_not_exceed_stock_check" CHECK ("reservedQuantity" <= "stockQuantity");

-- Update any existing negative values to 0
UPDATE "InventoryItem" SET "stockQuantity" = 0 WHERE "stockQuantity" < 0;
UPDATE "InventoryItem" SET "reservedQuantity" = 0 WHERE "reservedQuantity" < 0;
UPDATE "InventoryItem" SET "reservedQuantity" = "stockQuantity" WHERE "reservedQuantity" > "stockQuantity";