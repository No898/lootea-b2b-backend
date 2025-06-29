-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "packageSize" INTEGER,
ADD COLUMN     "unit" "Unit" NOT NULL DEFAULT 'KS';
