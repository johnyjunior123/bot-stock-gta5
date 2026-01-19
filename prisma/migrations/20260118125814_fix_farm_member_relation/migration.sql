-- CreateEnum
CREATE TYPE "public"."FarmStatus" AS ENUM ('PENDING', 'APPROVED', 'REFUSED');

-- CreateTable
CREATE TABLE "public"."farms" (
    "id" SERIAL NOT NULL,
    "metal" INTEGER NOT NULL DEFAULT 0,
    "rubber" INTEGER NOT NULL DEFAULT 0,
    "copper" INTEGER NOT NULL DEFAULT 0,
    "plastic" INTEGER NOT NULL DEFAULT 0,
    "glass" INTEGER NOT NULL DEFAULT 0,
    "pieceWeapon" INTEGER NOT NULL DEFAULT 0,
    "pistolPiece" INTEGER NOT NULL DEFAULT 0,
    "dirtyMoney" INTEGER NOT NULL DEFAULT 0,
    "status" "public"."FarmStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT NOT NULL,
    "memberGuildId" TEXT NOT NULL,

    CONSTRAINT "farms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guilds" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "guilds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."guild_channels" (
    "name" TEXT NOT NULL,
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,

    CONSTRAINT "guild_channels_pkey" PRIMARY KEY ("name")
);

-- CreateTable
CREATE TABLE "public"."members" (
    "id" TEXT NOT NULL,
    "guildId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id","guildId")
);

-- CreateIndex
CREATE UNIQUE INDEX "guilds_id_key" ON "public"."guilds"("id");

-- AddForeignKey
ALTER TABLE "public"."farms" ADD CONSTRAINT "farms_memberId_memberGuildId_fkey" FOREIGN KEY ("memberId", "memberGuildId") REFERENCES "public"."members"("id", "guildId") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."guild_channels" ADD CONSTRAINT "guild_channels_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."members" ADD CONSTRAINT "members_guildId_fkey" FOREIGN KEY ("guildId") REFERENCES "public"."guilds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
