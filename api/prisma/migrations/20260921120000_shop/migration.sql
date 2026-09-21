-- CreateEnum
CREATE TYPE "ShopCategory" AS ENUM ('STATIONERY', 'SWAG', 'PRIVILEGE', 'GIFT');

-- CreateEnum
CREATE TYPE "ShopOrderStatus" AS ENUM ('PENDING', 'DELIVERED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ShopItem" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" "ShopCategory" NOT NULL DEFAULT 'GIFT',
    "price" INTEGER NOT NULL,
    "stock" INTEGER,
    "perStudentLimit" INTEGER,
    "imageFileId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sort" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShopOrder" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "itemId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "status" "ShopOrderStatus" NOT NULL DEFAULT 'PENDING',
    "requestedById" TEXT NOT NULL,
    "note" TEXT,
    "cancelReason" TEXT,
    "handledById" TEXT,
    "handledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShopOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ShopItem_imageFileId_key" ON "ShopItem"("imageFileId");

-- CreateIndex
CREATE INDEX "ShopItem_isActive_sort_idx" ON "ShopItem"("isActive", "sort");

-- CreateIndex
CREATE UNIQUE INDEX "ShopOrder_number_key" ON "ShopOrder"("number");

-- CreateIndex
CREATE INDEX "ShopOrder_status_createdAt_idx" ON "ShopOrder"("status", "createdAt");

-- CreateIndex
CREATE INDEX "ShopOrder_studentId_createdAt_idx" ON "ShopOrder"("studentId", "createdAt");

-- CreateIndex
CREATE INDEX "ShopOrder_itemId_idx" ON "ShopOrder"("itemId");

-- AddForeignKey
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_imageFileId_fkey" FOREIGN KEY ("imageFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ShopItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_requestedById_fkey" FOREIGN KEY ("requestedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShopOrder" ADD CONSTRAINT "ShopOrder_handledById_fkey" FOREIGN KEY ("handledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Narx musbat, zaxira va cheklov manfiy boʻlmasin
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_price_check" CHECK ("price" > 0);
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_stock_check" CHECK ("stock" IS NULL OR "stock" >= 0);
ALTER TABLE "ShopItem" ADD CONSTRAINT "ShopItem_limit_check" CHECK ("perStudentLimit" IS NULL OR "perStudentLimit" > 0);
