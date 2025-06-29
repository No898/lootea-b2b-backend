/*
  Warnings:

  - You are about to drop the column `productId` on the `Image` table. All the data in the column will be lost.
  - You are about to drop the column `basePrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `discountPrice` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `inStock` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `packageSize` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `sku` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `stockQuantity` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Product` table. All the data in the column will be lost.
  - You are about to drop the column `priceModifier` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `ProductVariant` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `custom_prices` table. All the data in the column will be lost.
  - You are about to drop the column `productId` on the `order_items` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[productId,sku]` on the table `ProductVariant` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[userId,productVariantId]` on the table `custom_prices` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `productVariantId` to the `Image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `ProductVariant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productVariantId` to the `custom_prices` table without a default value. This is not possible if the table is not empty.
  - Added the required column `productVariantId` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Image" DROP CONSTRAINT "Image_productId_fkey";

-- DropForeignKey
ALTER TABLE "custom_prices" DROP CONSTRAINT "custom_prices_productId_fkey";

-- DropForeignKey
ALTER TABLE "order_items" DROP CONSTRAINT "order_items_productId_fkey";

-- DropIndex
DROP INDEX "Image_productId_idx";

-- DropIndex
DROP INDEX "Product_sku_key";

-- DropIndex
DROP INDEX "ProductVariant_productId_name_value_key";

-- DropIndex
DROP INDEX "custom_prices_userId_productId_key";

-- AlterTable
ALTER TABLE "Image" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Product" DROP COLUMN "basePrice",
DROP COLUMN "discountPrice",
DROP COLUMN "inStock",
DROP COLUMN "packageSize",
DROP COLUMN "sku",
DROP COLUMN "stockQuantity",
DROP COLUMN "unit";

-- AlterTable
ALTER TABLE "ProductVariant" DROP COLUMN "priceModifier",
DROP COLUMN "value",
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "discountPrice" DOUBLE PRECISION,
ADD COLUMN     "flavor" TEXT,
ADD COLUMN     "inStock" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "price" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL,
ADD COLUMN     "volumeL" DOUBLE PRECISION,
ADD COLUMN     "weightKg" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "custom_prices" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "order_items" DROP COLUMN "productId",
ADD COLUMN     "productVariantId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Image_productVariantId_idx" ON "Image"("productVariantId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_slug_key" ON "ProductVariant"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ProductVariant_productId_sku_key" ON "ProductVariant"("productId", "sku");

-- CreateIndex
CREATE UNIQUE INDEX "custom_prices_userId_productVariantId_key" ON "custom_prices"("userId", "productVariantId");

-- AddForeignKey
ALTER TABLE "custom_prices" ADD CONSTRAINT "custom_prices_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Image" ADD CONSTRAINT "Image_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
