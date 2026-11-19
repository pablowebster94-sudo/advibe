-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'DRAFT',
ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "strategy" TEXT;

-- CreateTable
CREATE TABLE "CampaignBrief" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "offerSummary" TEXT NOT NULL DEFAULT '',
    "priceDisplay" TEXT,
    "benefits" TEXT NOT NULL DEFAULT '[]',
    "restrictions" TEXT,
    "destinationId" TEXT NOT NULL DEFAULT 'WHATSAPP',
    "whatsappNumber" TEXT,
    "landingUrl" TEXT,
    "phoneNumber" TEXT,
    "countries" TEXT NOT NULL DEFAULT '[]',
    "cities" TEXT NOT NULL DEFAULT '[]',
    "radiusKm" INTEGER,
    "language" TEXT,
    "audienceNotes" TEXT,
    "dailyBudgetUsd" DECIMAL(10,2),
    "lifetimeBudgetUsd" DECIMAL(10,2),
    "durationDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CampaignBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignBrief_campaignId_key" ON "CampaignBrief"("campaignId");

-- AddForeignKey
ALTER TABLE "CampaignBrief" ADD CONSTRAINT "CampaignBrief_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
