import { prisma } from "#database";
import { Farm, Prisma } from "../database/prisma/client.js";
import { weeksBetween } from "../functions/weeks-between.js";

type MemberWithFarms = Prisma.MemberGetPayload<{
    include: {
        farms: true;
    };
}>;

const WEEKLY_MINIMUM = {
    metal: 750,
    copper: 750,
    rubber: 875,
    plastic: 875,
    glass: 875,
    pieceWeapon: 15,
    pistolPiece: 5,
};

export const FarmService = {
    async createFarm(data: {
        memberId: string;
        memberGuildId: string;
        metal?: number;
        copper?: number;
        rubber?: number;
        plastic?: number;
        glass?: number;
        pieceWeapon?: number;
        pistolPiece?: number;
        dirtyMoney?: number;
    }) {
        return prisma.$transaction(async (tx) => {
            await tx.guild.upsert({
                where: { id: data.memberGuildId },
                create: { id: data.memberGuildId },
                update: {},
            });

            await tx.member.upsert({
                where: {
                    id_guildId: {
                        id: data.memberId,
                        guildId: data.memberGuildId,
                    },
                },
                create: {
                    id: data.memberId,
                    guildId: data.memberGuildId,
                },
                update: {},
            });

            return tx.farm.create({
                data: {
                    metal: data.metal ?? 0,
                    copper: data.copper ?? 0,
                    rubber: data.rubber ?? 0,
                    plastic: data.plastic ?? 0,
                    glass: data.glass ?? 0,
                    pieceWeapon: data.pieceWeapon ?? 0,
                    pistolPiece: data.pistolPiece ?? 0,
                    dirtyMoney: data.dirtyMoney ?? 0,
                    status: "PENDING",
                    memberId: data.memberId,
                    memberGuildId: data.memberGuildId,
                },
            });
        });
    },

    async approveFarm(id: number) {
        return prisma.farm.update({
            where: { id },
            data: { status: "APPROVED" },
        });
    },

    async refuseFarm(id: number) {
        return prisma.farm.update({
            where: { id },
            data: { status: "REFUSED" },
        });
    },

    async ranking() {
        const farms: Farm[] = await prisma.farm.findMany({
            where: { status: "APPROVED" },
        });
        const map = new Map<string, {
            memberId: string;
            metal: number;
            copper: number;
            rubber: number;
            plastic: number;
            glass: number;
            pieceWeapon: number;
            pistolPiece: number;
            total: number;
        }>();

        for (const farm of farms) {
            const existing = map.get(farm.memberId);

            const metal = farm.metal;
            const copper = farm.copper;
            const rubber = farm.rubber;
            const plastic = farm.plastic;
            const glass = farm.glass;
            const pieceWeapon = farm.pieceWeapon;
            const pistolPiece = farm.pistolPiece;

            if (!existing) {
                map.set(farm.memberId, {
                    memberId: farm.memberId,
                    metal,
                    copper,
                    rubber,
                    plastic,
                    glass,
                    pieceWeapon,
                    pistolPiece,
                    total: metal + copper + rubber + plastic + glass + pieceWeapon + pistolPiece,
                });
            } else {
                existing.metal += metal;
                existing.copper += copper;
                existing.rubber += rubber;
                existing.plastic += plastic;
                existing.glass += glass;
                existing.pieceWeapon += pieceWeapon;
                existing.pistolPiece += pistolPiece;

                existing.total =
                    existing.metal +
                    existing.copper +
                    existing.rubber +
                    existing.plastic +
                    existing.glass +
                    existing.pieceWeapon +
                    existing.pistolPiece;
            }
        }
        const ranking = Array.from(map.values());
        return ranking.sort((a, b) => b.total - a.total);
    },

    async memberPendent() {
        const members: MemberWithFarms[] = await prisma.member.findMany({
            include: {
                farms: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        const now = new Date();

        return members
            .map((member) => {
                // 🔹 Nunca entregou → não entra na lista
                if (member.farms.length === 0) return null;

                const firstFarmDate = member.farms[0].createdAt;
                const weeksActive = weeksBetween(firstFarmDate, now);

                // 🔹 Total exigido desde o 1º farm
                const required = {
                    metal: WEEKLY_MINIMUM.metal * weeksActive,
                    copper: WEEKLY_MINIMUM.copper * weeksActive,
                    rubber: WEEKLY_MINIMUM.rubber * weeksActive,
                    plastic: WEEKLY_MINIMUM.plastic * weeksActive,
                    glass: WEEKLY_MINIMUM.glass * weeksActive,
                    pieceWeapon: WEEKLY_MINIMUM.pieceWeapon * weeksActive,
                    pistolPiece: WEEKLY_MINIMUM.pistolPiece * weeksActive,
                };

                // 🔹 Total entregue acumulado
                const delivered = member.farms.reduce(
                    (acc, farm) => {
                        acc.metal += farm.metal;
                        acc.copper += farm.copper;
                        acc.rubber += farm.rubber;
                        acc.plastic += farm.plastic;
                        acc.glass += farm.glass;
                        acc.pieceWeapon += farm.pieceWeapon;
                        acc.pistolPiece += farm.pistolPiece;
                        return acc;
                    },
                    {
                        metal: 0,
                        copper: 0,
                        rubber: 0,
                        plastic: 0,
                        glass: 0,
                        pieceWeapon: 0,
                        pistolPiece: 0,
                    }
                );

                const pending = {
                    metal: Math.max(0, required.metal - delivered.metal),
                    copper: Math.max(0, required.copper - delivered.copper),
                    rubber: Math.max(0, required.rubber - delivered.rubber),
                    plastic: Math.max(0, required.plastic - delivered.plastic),
                    glass: Math.max(0, required.glass - delivered.glass),
                    pieceWeapon: Math.max(
                        0,
                        required.pieceWeapon - delivered.pieceWeapon
                    ),
                    pistolPiece: Math.max(
                        0,
                        required.pistolPiece - delivered.pistolPiece
                    ),
                };

                const hasPending = Object.values(pending).some((v) => v > 0);
                if (!hasPending) return null;

                return {
                    memberId: member.id,
                    guildId: member.guildId,
                    weeksActive,
                    pending,
                };
            })
            .filter(Boolean);
    },

    async findFarmById(id: number) {
        return prisma.farm.findUnique({
            where: { id },
            include: {
                member: true,
            },
        });
    },

    async userTotal(memberId: string) {
        const farms = await prisma.farm.findMany({
            where: {
                memberId,
                status: "APPROVED",
            },
        });

        const totalMetal = farms.reduce((acc, f) => acc + f.metal, 0);
        const totalCopper = farms.reduce((acc, f) => acc + f.copper, 0);
        const totalRubber = farms.reduce((acc, f) => acc + f.rubber, 0);
        const totalPlastic = farms.reduce((acc, f) => acc + f.plastic, 0);
        const totalGlass = farms.reduce((acc, f) => acc + f.glass, 0);
        const totalPieceWeapon = farms.reduce((acc, f) => acc + f.pieceWeapon, 0);
        const totalPistolPiece = farms.reduce((acc, f) => acc + f.pistolPiece, 0);

        const total = totalMetal + totalCopper + totalRubber + totalPlastic + totalGlass + totalPieceWeapon + totalPistolPiece;

        return {
            farms,
            metal: totalMetal,
            copper: totalCopper,
            rubber: totalRubber,
            plastic: totalPlastic,
            glass: totalGlass,
            pieceWeapon: totalPieceWeapon,
            pistolPiece: totalPistolPiece,
            total,
        };
    },

    async userWeekly(memberId: string) {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);

        const farms = await prisma.farm.findMany({
            where: {
                memberId,
                status: "APPROVED",
                createdAt: {
                    gte: weekAgo,
                },
            },
        });

        const totalMetal = farms.reduce((acc, f) => acc + f.metal, 0);
        const totalCopper = farms.reduce((acc, f) => acc + f.copper, 0);
        const totalRubber = farms.reduce((acc, f) => acc + f.rubber, 0);
        const totalPlastic = farms.reduce((acc, f) => acc + f.plastic, 0);
        const totalGlass = farms.reduce((acc, f) => acc + f.glass, 0);
        const totalPieceWeapon = farms.reduce((acc, f) => acc + f.pieceWeapon, 0);
        const totalPistolPiece = farms.reduce((acc, f) => acc + f.pistolPiece, 0);

        const total = totalMetal + totalCopper + totalRubber + totalPlastic + totalGlass + totalPieceWeapon + totalPistolPiece;

        return {
            farms,
            metal: totalMetal,
            copper: totalCopper,
            rubber: totalRubber,
            plastic: totalPlastic,
            glass: totalGlass,
            pieceWeapon: totalPieceWeapon,
            pistolPiece: totalPistolPiece,
            total,
        };
    }
};
