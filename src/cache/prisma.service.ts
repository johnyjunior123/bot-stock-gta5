import { prisma } from "#database";
import { Prisma } from "../database/prisma/client.js";
import { formatMaterial, getWeeksBetween, getWeekStart } from "../functions/utils.js";
import { currentFarmRequirements } from "../functions/farm-form.js";
import { BUILTIN_MATERIALS, farmQuantities, normalizeMaterialName, sumFarmQuantities } from "../functions/materials.js";

export const FarmService = {
    async ensureMember(memberId: string, guildId: string) {
        return prisma.$transaction(tx => upsertFarmMember(tx, memberId, guildId));
    },

    async createMaterial(data: { name: string; normalizedName: string }) {
        try {
            await prisma.customMaterial.create({ data });
            return true;
        } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") return false;
            throw error;
        }
    },

    async customMaterialNames() {
        const materials = await prisma.customMaterial.findMany({ orderBy: { name: "asc" } });
        return materials.map(material => material.name);
    },

    async resolveMaterial(input: string) {
        const normalizedName = normalizeMaterialName(input);
        const builtin = BUILTIN_MATERIALS.find(material => [material, formatMaterial(material)].some(
            name => normalizeMaterialName(name) === normalizedName,
        ));
        if (builtin) return builtin;
        const custom = await prisma.customMaterial.findUnique({ where: { normalizedName } });
        return custom?.name;
    },

    async currentRequirements() {
        const now = new Date();
        const requirements = await prisma.farmRequirement.findMany({
            where: { startsAt: { lte: now } },
            orderBy: [{ startsAt: "desc" }, { material: "asc" }],
        });
        return currentFarmRequirements(requirements, now);
    },

    async createFarm(data: {
        memberId: string;
        memberGuildId: string;
        quantities: Partial<Record<string, number>>;
    }) {
        const quantities = data.quantities;
        const customMaterials = Object.fromEntries(Object.entries(quantities).filter(
            (entry): entry is [string, number] => entry[1] !== undefined && !BUILTIN_MATERIALS.some(key => key === entry[0]),
        ));
        return prisma.$transaction(async (tx) => {
            await upsertFarmMember(tx, data.memberId, data.memberGuildId);

            return tx.farm.create({
                data: {
                    metal: quantities.metal ?? 0,
                    copper: quantities.copper ?? 0,
                    rubber: quantities.rubber ?? 0,
                    plastic: quantities.plastic ?? 0,
                    glass: quantities.glass ?? 0,
                    sand: quantities.sand ?? 0,
                    pieceWeapon: quantities.pieceWeapon ?? 0,
                    pistolPiece: quantities.pistolPiece ?? 0,
                    customMaterials,
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
        const farms = await prisma.farm.findMany({ where: { status: "APPROVED" } });
        const members = new Map<string, typeof farms>();
        for (const farm of farms) {
            const deliveries = members.get(farm.memberId) ?? [];
            deliveries.push(farm);
            members.set(farm.memberId, deliveries);
        }
        return [...members].map(([memberId, deliveries]) => ({
            memberId, ...sumFarmQuantities(deliveries),
        })).sort((a, b) => b.total - a.total);
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

        const MATERIALS = [...new Set([...BUILTIN_MATERIALS, ...allRequirements.map(r => r.material)])];

        return Promise.all(
            members.map(async (member) => {
                const firstDate = member.createdAt;

                const weeks = getWeeksBetween(firstDate, now);

                const required = Object.fromEntries(
                    MATERIALS.map(m => [m, 0])
                ) as Record<string, number>;

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
                        const quantities = farmQuantities(farm);
                        for (const material of MATERIALS) {
                            acc[material] += quantities[material] ?? 0;
                        }
                        return acc;
                    },
                    Object.fromEntries(MATERIALS.map(m => [m, 0])) as Record<string, number>
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
        const firstDate = member.createdAt;

        const weeks = getWeeksBetween(firstDate, now);

        const requirements = await prisma.farmRequirement.findMany({
            where: { startsAt: { lte: now } },
            orderBy: { startsAt: "asc" },
        });

        const MATERIALS = [...new Set([...BUILTIN_MATERIALS, ...requirements.map(r => r.material)])];

        const required = Object.fromEntries(
            MATERIALS.map(m => [m, 0])
        ) as Record<string, number>;

        for (const week of weeks) {
            for (const material of MATERIALS) {
                const metas = requirements.filter(r => r.material === material);
                const lastMeta = metas.filter(m => m.startsAt <= week).at(-1);
                if (lastMeta) required[material] += lastMeta.weeklyMin;
            }
        }

        const delivered = member.farms.reduce(
            (acc, farm) => {
                const quantities = farmQuantities(farm);
                for (const material of MATERIALS) {
                    acc[material] += quantities[material] ?? 0;
                }
                return acc;
            },
            Object.fromEntries(MATERIALS.map(m => [m, 0])) as Record<string, number>
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

        return { farms, ...sumFarmQuantities(farms) };
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

        return { farms, ...sumFarmQuantities(farms) };
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
        const firstDate = member.createdAt;

        const weeks = getWeeksBetween(firstDate, now);

        const requirements = await prisma.farmRequirement.findMany({
            where: { startsAt: { lte: now } },
            orderBy: { startsAt: "asc" },
        });
        const MATERIALS = [...new Set([...BUILTIN_MATERIALS, ...requirements.map(r => r.material)])];
        const deliveredTotal: Record<string, number> = Object.fromEntries(
            MATERIALS.map(m => [m, 0])
        ) as any;
        for (const farm of member.farms) {
            const quantities = farmQuantities(farm);
            for (const material of MATERIALS) {
                deliveredTotal[material] += quantities[material] ?? 0;
            }
        }

        const byWeek = [];
        const remainingDelivered = { ...deliveredTotal };
        for (const week of weeks) {
            const required: Record<string, number> = Object.fromEntries(
                MATERIALS.map(m => {
                    const meta = requirements
                        .filter(r => r.material === m && r.startsAt <= week)
                        .at(-1);
                    return [m, meta?.weeklyMin ?? 0];
                })
            ) as any;

            const delivered: Record<string, number> = Object.fromEntries(
                MATERIALS.map(m => {
                    const used = Math.min(remainingDelivered[m], required[m]);
                    remainingDelivered[m] -= used;
                    return [m, used];
                })
            ) as any;

            const pending: Record<string, number> = Object.fromEntries(
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
    material: string;
    weeklyMin: number;
}

async function upsertFarmMember(tx: Prisma.TransactionClient, memberId: string, guildId: string) {
    await tx.guild.upsert({
        where: { id: guildId },
        create: { id: guildId },
        update: {},
    });
    return tx.member.upsert({
        where: { id_guildId: { id: memberId, guildId } },
        create: { id: memberId, guildId },
        update: {},
    });
}
