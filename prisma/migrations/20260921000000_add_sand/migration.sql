-- AlterEnum
ALTER TYPE "MaterialType" ADD VALUE 'sand';

-- AlterTable
ALTER TABLE "farms" ADD COLUMN "sand" INTEGER NOT NULL DEFAULT 0;
