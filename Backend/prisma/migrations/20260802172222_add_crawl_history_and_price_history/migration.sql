-- CreateEnum
CREATE TYPE "CrawlStatus" AS ENUM ('RUNNING', 'SUCCESS', 'PARTIAL', 'FAILED');

-- AlterTable
ALTER TABLE "Store" ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "CrawlRun" (
    "id" SERIAL NOT NULL,
    "sourceSite" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "status" "CrawlStatus" NOT NULL DEFAULT 'RUNNING',
    "productsFound" INTEGER NOT NULL DEFAULT 0,
    "matched" INTEGER NOT NULL DEFAULT 0,
    "pricesChanged" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,

    CONSTRAINT "CrawlRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CrawlCategory" (
    "id" SERIAL NOT NULL,
    "crawlRunId" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "httpStatus" INTEGER,
    "productsFound" INTEGER NOT NULL DEFAULT 0,
    "durationMs" INTEGER,
    "errorMessage" TEXT,

    CONSTRAINT "CrawlCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" SERIAL NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "storeId" INTEGER NOT NULL,
    "productName" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "unitQty" DOUBLE PRECISION NOT NULL,
    "pricePerUnit" DOUBLE PRECISION NOT NULL,
    "crawlRunId" INTEGER,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrawlRun_sourceSite_startedAt_idx" ON "CrawlRun"("sourceSite", "startedAt");

-- CreateIndex
CREATE INDEX "CrawlRun_startedAt_idx" ON "CrawlRun"("startedAt");

-- CreateIndex
CREATE INDEX "CrawlCategory_crawlRunId_idx" ON "CrawlCategory"("crawlRunId");

-- CreateIndex
CREATE INDEX "PriceHistory_ingredientId_storeId_recordedAt_idx" ON "PriceHistory"("ingredientId", "storeId", "recordedAt");

-- CreateIndex
CREATE INDEX "PriceHistory_recordedAt_idx" ON "PriceHistory"("recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Store_code_key" ON "Store"("code");

-- AddForeignKey
ALTER TABLE "CrawlCategory" ADD CONSTRAINT "CrawlCategory_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "Ingredient"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_crawlRunId_fkey" FOREIGN KEY ("crawlRunId") REFERENCES "CrawlRun"("id") ON DELETE SET NULL ON UPDATE CASCADE;


-- Backfill: gán code ổn định cho 3 nguồn crawl đang có.
-- Trước đây crawler tra store bằng findFirst trên sourceSite (không unique).
UPDATE "Store" SET "code" = "sourceSite"
WHERE "type" = 'ONLINE' AND "sourceSite" IS NOT NULL AND "code" IS NULL;
