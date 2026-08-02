-- CreateEnum
CREATE TYPE "MatchSource" AS ENUM ('NONE', 'AUTO_KEYWORD', 'MANUAL');

-- DropForeignKey
ALTER TABLE "IngredientPrice" DROP CONSTRAINT "IngredientPrice_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "IngredientPrice" DROP CONSTRAINT "IngredientPrice_storeId_fkey";

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_crawlRunId_fkey";

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_ingredientId_fkey";

-- DropForeignKey
ALTER TABLE "PriceHistory" DROP CONSTRAINT "PriceHistory_storeId_fkey";

-- AlterTable
ALTER TABLE "CrawlCategory" ADD COLUMN     "storeCategoryId" INTEGER;

-- DropTable
DROP TABLE "IngredientPrice";

-- DropTable
DROP TABLE "PriceHistory";

-- CreateTable
CREATE TABLE "StoreCategory" (
    "id" SERIAL NOT NULL,
    "storeId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastOkAt" TIMESTAMP(3),
    "lastStatus" INTEGER,
    "note" TEXT,

    CONSTRAINT "StoreCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "storeId" INTEGER NOT NULL,
    "storeCategoryId" INTEGER,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT,
    "imageUrl" TEXT,
    "currentPrice" DECIMAL(12,2),
    "isInStock" BOOLEAN NOT NULL DEFAULT true,
    "rawUnit" TEXT,
    "baseWeightGrams" INTEGER,
    "pricePerGram" DECIMAL(12,4),
    "metadata" JSONB,
    "ingredientId" INTEGER,
    "matchSource" "MatchSource" NOT NULL DEFAULT 'NONE',
    "matchedKeyword" TEXT,
    "firstSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductPriceHistory" (
    "id" SERIAL NOT NULL,
    "productId" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "isInStock" BOOLEAN NOT NULL,
    "crawlRunId" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductPriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StoreCategory_storeId_isActive_idx" ON "StoreCategory"("storeId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "StoreCategory_storeId_path_key" ON "StoreCategory"("storeId", "path");

-- CreateIndex
CREATE INDEX "Product_ingredientId_isInStock_idx" ON "Product"("ingredientId", "isInStock");

-- CreateIndex
CREATE INDEX "Product_storeId_isInStock_idx" ON "Product"("storeId", "isInStock");

-- CreateIndex
CREATE INDEX "Product_storeCategoryId_idx" ON "Product"("storeCategoryId");

-- CreateIndex
CREATE UNIQUE INDEX "Product_storeId_sku_key" ON "Product"("storeId", "sku");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_productId_recordedAt_idx" ON "ProductPriceHistory"("productId", "recordedAt");

-- CreateIndex
CREATE INDEX "ProductPriceHistory_recordedAt_idx" ON "ProductPriceHistory"("recordedAt");

-- AddForeignKey
ALTER TABLE "StoreCategory" ADD CONSTRAINT "StoreCategory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_storeCategoryId_fkey" FOREIGN KEY ("storeCategoryId") REFERENCES "StoreCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductPriceHistory" ADD CONSTRAINT "ProductPriceHistory_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrawlCategory" ADD CONSTRAINT "CrawlCategory_storeCategoryId_fkey" FOREIGN KEY ("storeCategoryId") REFERENCES "StoreCategory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

