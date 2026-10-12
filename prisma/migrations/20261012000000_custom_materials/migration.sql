-- Preserve existing material keys and historical requirements.
ALTER TABLE "FarmRequirement" ALTER COLUMN "material" TYPE TEXT USING "material"::text;
DROP TYPE "MaterialType";

ALTER TABLE "farms" ADD COLUMN "customMaterials" JSONB NOT NULL DEFAULT '{}';

CREATE TABLE "CustomMaterial" (
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CustomMaterial_pkey" PRIMARY KEY ("name")
);
CREATE UNIQUE INDEX "CustomMaterial_normalizedName_key" ON "CustomMaterial"("normalizedName");
