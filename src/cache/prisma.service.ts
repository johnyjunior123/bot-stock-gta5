import { prisma } from "#database";
import { Farm, MaterialType } from "../database/prisma/client.js";
import { getWeeksBetween } from "../functions/utils.js";

const MATERIALS: MaterialType[] = [
    "metal",
    "copper",
    "rubber",
    "plastic",
    "glass",
    "pieceWeapon",
    "pistolPiece",
];

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
        const members = await prisma.member.findMany({
            include: {
                farms: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        const now = new Date();

        // pega TODAS as metas até hoje
        const allRequirements = await prisma.farmRequirement.findMany({
            where: { startsAt: { lte: now } },
            orderBy: { startsAt: "asc" },
        });

        return Promise.all(
            members.map(async (member) => {
                const firstDate =
                    member.farms.length > 0
                        ? member.farms[0].createdAt
                        : member.createdAt ?? now;

                const weeks = getWeeksBetween(firstDate, now);

                const required = Object.fromEntries(
                    MATERIALS.map(m => [m, 0])
                ) as Record<MaterialType, number>;

                // calcula meta correta por semana
                for (const week of weeks) {
                    for (const material of MATERIALS) {
                        const metas = allRequirements.filter(r => r.material === material);
                        const lastMeta = metas.filter(m => m.startsAt <= week).at(-1);
                        if (lastMeta) required[material] += lastMeta.weeklyMin;
                    }
                }

                const delivered = member.farms.reduce(
                    (acc, farm) => {
                        for (const material of MATERIALS) {
                            acc[material] += farm[material];
                        }
                        return acc;
                    },
                    Object.fromEntries(MATERIALS.map(m => [m, 0])) as Record<MaterialType, number>
                );

                const pending = Object.fromEntries(
                    MATERIALS.map(m => [m, Math.max(0, required[m] - delivered[m])])
                );

                const hasPending = Object.values(pending).some(v => v > 0);
                if (!hasPending) return null;

                return {
                    memberId: member.id,
                    guildId: member.guildId,
                    weeksActive: weeks.length,
                    pending,
                };
            })
        ).then(r => r.filter(Boolean));
    },

    async getMemberPending(memberId: string, guildId: string) {
        const member = await prisma.member.findUnique({
            where: { id_guildId: { id: memberId, guildId } },
            include: {
                farms: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "asc" },
                },
            },
        });

        if (!member) return null;

        const now = new Date();
        const firstDate = member.farms.length > 0
            ? member.farms[0].createdAt
            : member.createdAt ?? now;

        const weeks = getWeeksBetween(firstDate, now);

        const requirements = await prisma.farmRequirement.findMany({
            where: { startsAt: { lte: now } },
            orderBy: { startsAt: "asc" },
        });

        const required = Object.fromEntries(
            MATERIALS.map(m => [m, 0])
        ) as Record<MaterialType, number>;

        for (const week of weeks) {
            for (const material of MATERIALS) {
                const metas = requirements.filter(r => r.material === material);
                const lastMeta = metas.filter(m => m.startsAt <= week).at(-1);
                if (lastMeta) required[material] += lastMeta.weeklyMin;
            }
        }

        const delivered = member.farms.reduce(
            (acc, farm) => {
                for (const material of MATERIALS) {
                    acc[material] += farm[material];
                }
                return acc;
            },
            Object.fromEntries(MATERIALS.map(m => [m, 0])) as Record<MaterialType, number>
        );

        const pending = Object.fromEntries(
            MATERIALS.map(m => [m, Math.max(0, required[m] - delivered[m])])
        );

        return {
            member,
            pending,
            hasPending: Object.values(pending).some(v => v > 0),
            weeksActive: weeks.length,
        };
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
    },


    async alterWeeklyMeta({ material, weeklyMin }: AlterWeeklyMetaDTO) {
        const startsAt = getWeekStart();

        await prisma.farmRequirement.upsert({
            where: {
                material_startsAt: {
                    material,
                    startsAt,
                },
            },
            update: {
                weeklyMin,
            },
            create: {
                material,
                weeklyMin,
                startsAt,
            },
        });
    },

    async getMemberPendingDetailed(memberId: string, guildId: string) {
        const member = await prisma.member.findUnique({
            where: { id_guildId: { id: memberId, guildId } },
            include: {
                farms: {
                    where: { status: "APPROVED" },
                    orderBy: { createdAt: "asc" },
                },
            },
        });
        if (!member) return null;

        const now = new Date();
        const firstDate =
            member.farms.length > 0
                ? member.farms[0].createdAt
                : member.createdAt ?? now;

        const weeks = getWeeksBetween(firstDate, now);

        const requirements = await prisma.farmRequirement.findMany({
            where: { startsAt: { lte: now } },
            orderBy: { startsAt: "asc" },
        });
        const deliveredTotal: Record<MaterialType, number> = Object.fromEntries(
            MATERIALS.map(m => [m, 0])
        ) as any;
        for (const farm of member.farms) {
            for (const material of MATERIALS) {
                deliveredTotal[material] += farm[material];
            }
        }

        const byWeek = [];
        const remainingDelivered = { ...deliveredTotal };
        for (const week of weeks) {
            const required: Record<MaterialType, number> = Object.fromEntries(
                MATERIALS.map(m => {
                    const meta = requirements
                        .filter(r => r.material === m && r.startsAt <= week)
                        .at(-1);
                    return [m, meta?.weeklyMin ?? 0];
                })
            ) as any;

            const delivered: Record<MaterialType, number> = Object.fromEntries(
                MATERIALS.map(m => {
                    const used = Math.min(remainingDelivered[m], required[m]);
                    remainingDelivered[m] -= used;
                    return [m, used];
                })
            ) as any;

            const pending: Record<MaterialType, number> = Object.fromEntries(
                MATERIALS.map(m => [m, required[m] - delivered[m]])
            ) as any;

            byWeek.push({
                weekStart: week.toISOString().split("T")[0],
                required,
                delivered,
                pending,
            });
        }

        const hasPending = byWeek.some(w =>
            Object.values(w.pending).some(v => v > 0)
        );

        return {
            member,
            weeksActive: weeks.length,
            hasPending,
            totalPending: byWeek.reduce(
                (acc, w) => acc + Object.values(w.pending).reduce((a, b) => a + b, 0),
                0
            ),
            byWeek,
        };
    }
};

interface AlterWeeklyMetaDTO {
    material: MaterialType;
    weeklyMin: number;
}

function getWeekStart(date = new Date()) {
    const d = new Date(date);
    const day = d.getDay(); // 0 = domingo
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
}