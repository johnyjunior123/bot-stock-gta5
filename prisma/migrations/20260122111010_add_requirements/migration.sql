-- CreateEnum
CREATE TYPE "MaterialType" AS ENUM ('metal', 'copper', 'rubber', 'plastic', 'glass', 'pieceWeapon', 'pistolPiece');

-- CreateTable
CREATE TABLE "FarmRequirement" (
    "id" SERIAL NOT NULL,
    "material" "MaterialType" NOT NULL,
    "weeklyMin" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FarmRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FarmRequirement_material_startsAt_key" ON "FarmRequirement"("material", "startsAt");
