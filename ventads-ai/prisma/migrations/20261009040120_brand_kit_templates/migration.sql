-- AlterTable
ALTER TABLE "Brand" ADD COLUMN     "footerNote" TEXT,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Creative" ADD COLUMN     "renderMeta" JSONB,
ADD COLUMN     "templateId" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "adTitle" TEXT,
ADD COLUMN     "includes" TEXT,
ADD COLUMN     "promotions" JSONB;
