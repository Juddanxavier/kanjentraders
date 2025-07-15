-- AlterTable
ALTER TABLE "lead" ADD COLUMN     "country" TEXT NOT NULL DEFAULT 'India';

-- CreateIndex
CREATE INDEX "lead_country_idx" ON "lead"("country");
