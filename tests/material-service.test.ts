import assert from "node:assert/strict";
import { test } from "node:test";
import { prisma } from "../src/database/index.js";
import { Prisma, type Farm, type FarmRequirement } from "../src/database/prisma/client.js";
import { FarmService } from "../src/cache/prisma.service.js";
import { validateMaterialName } from "../src/functions/materials.js";
import { getWeekStart } from "../src/functions/utils.js";

test("cadastro sem entrega preserva data e separa o mesmo usuário por servidor", async t => {
    const guilds = new Set<string>();
    const members = new Map<string, { id: string; guildId: string; createdAt: Date }>();
    const createdAt = new Date("2026-10-05T12:00:00Z");
    const originalTransaction = prisma.$transaction;
    t.after(() => { prisma.$transaction = originalTransaction; });
    (prisma as any).$transaction = async (callback: any) => callback({
        guild: { upsert: async ({ where, create, update }) => {
            assert.equal(where.id, create.id);
            assert.deepEqual(update, {});
            guilds.add(create.id);
            return create;
        } },
        member: { upsert: async ({ where, create, update }) => {
            assert.ok(guilds.has(create.guildId));
            assert.deepEqual(where.id_guildId, create);
            assert.deepEqual(update, {});
            const key = `${create.guildId}:${create.id}`;
            const member = members.get(key) ?? { ...create, createdAt };
            members.set(key, member);
            return member;
        } },
    });

    const first = await FarmService.ensureMember("user", "guild");
    assert.equal(first.createdAt, createdAt);
    assert.equal(await FarmService.ensureMember("user", "guild"), first);
    assert.equal(members.size, 1);
    await FarmService.ensureMember("user", "other-guild");
    assert.equal(members.size, 2);
    assert.equal(guilds.size, 2);
});

test("cadastro, meta, entrega, aprovação e consultas aceitam o novo material", async t => {
    // Exercise the service workflow without opening a database connection.
    const materials: { name: string; normalizedName: string }[] = [];
    const requirements: FarmRequirement[] = [];
    const farms: Farm[] = [];
    const now = new Date();
    let registeredAt = now;
    const approved = () => farms.filter(farm => farm.status === "APPROVED");
    const member = () => ({ id: "user", guildId: "guild", createdAt: registeredAt, farms: approved() });

    // Prisma delegates expose methods through proxies rather than method descriptors.
    const stub = (target: any, method: string, implementation: (...args: any[]) => any) => {
        const original = target[method];
        target[method] = implementation;
        t.after(() => { target[method] = original; });
    };

    stub(prisma.customMaterial, "create", async ({ data }) => {
        if (materials.some(material => material.normalizedName === data.normalizedName)) {
            throw new Prisma.PrismaClientKnownRequestError("duplicate", { code: "P2002", clientVersion: "6.19.2" });
        }
        materials.push(data);
        return data;
    });
    stub(prisma.customMaterial, "findMany", async () => materials);
    stub(prisma.customMaterial, "findUnique", async ({ where }) =>
        materials.find(material => material.normalizedName === where.normalizedName) ?? null);
    stub(prisma.farmRequirement, "upsert", async ({ create, update }) => {
        const existing = requirements.find(requirement => requirement.material === create.material
            && requirement.startsAt.getTime() === create.startsAt.getTime());
        if (existing) Object.assign(existing, update);
        else requirements.push({ id: requirements.length + 1, createdAt: now, ...create });
    });
    stub(prisma.farmRequirement, "findMany", async () => requirements);
    stub(prisma, "$transaction", async callback => callback({
        guild: { upsert: async () => ({}) },
        member: { upsert: async () => ({}) },
        farm: { create: async ({ data }) => {
            const farm = { id: farms.length + 1, createdAt: now, updatedAt: now, dirtyMoney: 0, ...data };
            farms.push(farm);
            return farm;
        } },
    }));
    stub(prisma.farm, "update", async ({ where, data }) => {
        const farm = farms.find(farm => farm.id === where.id)!;
        Object.assign(farm, data);
        return farm;
    });
    stub(prisma.farm, "findMany", async ({ where }) => {
        assert.equal(where.status, "APPROVED");
        return approved();
    });
    stub(prisma.member, "findUnique", async () => member());
    stub(prisma.member, "findMany", async () => [member()]);

    assert.equal(await FarmService.createMaterial(validateMaterialName("Explosivos")), true);
    assert.equal(await FarmService.createMaterial(validateMaterialName("  EXPLOSIVOS  ")), false);
    assert.deepEqual(await FarmService.customMaterialNames(), ["Explosivos"]);
    assert.equal(await FarmService.resolveMaterial("explosivos"), "Explosivos");
    assert.equal(await FarmService.resolveMaterial("Cobre"), "copper");
    assert.equal(await FarmService.resolveMaterial("Inexistente"), undefined);
    assert.deepEqual(await FarmService.currentRequirements(), []);

    await FarmService.alterWeeklyMeta({ material: "Explosivos", weeklyMin: 100 });
    assert.equal(requirements[0].startsAt.getTime(), getWeekStart().getTime());
    assert.equal((await FarmService.currentRequirements())[0].material, "Explosivos");
    assert.equal((await FarmService.getMemberPending("user", "guild"))?.pending.Explosivos, 100);

    const delivery = await FarmService.createFarm({
        memberId: "user", memberGuildId: "guild", quantities: { metal: 5, Explosivos: 40 },
    });
    assert.deepEqual(delivery.customMaterials, { Explosivos: 40 });
    assert.equal(delivery.metal, 5);
    assert.equal(delivery.status, "PENDING");
    assert.equal((await FarmService.userTotal("user")).total, 0);

    await FarmService.approveFarm(delivery.id);
    assert.equal((await FarmService.userTotal("user")).total, 45);
    assert.equal((await FarmService.userWeekly("user")).quantities.Explosivos, 40);
    assert.equal((await FarmService.ranking())[0].total, 45);
    assert.equal((await FarmService.getMemberPending("user", "guild"))?.pending.Explosivos, 60);
    assert.equal((await FarmService.memberPendent())[0]?.pending.Explosivos, 60);
    assert.equal((await FarmService.getMemberPendingDetailed("user", "guild"))?.byWeek[0].pending.Explosivos, 60);

    // A first approved delivery this week must not erase the previous week of membership.
    registeredAt = getWeekStart(now);
    registeredAt.setUTCDate(registeredAt.getUTCDate() - 7);
    requirements[0].startsAt = registeredAt;
    assert.equal((await FarmService.getMemberPending("user", "guild"))?.pending.Explosivos, 160);
    assert.equal((await FarmService.memberPendent())[0]?.pending.Explosivos, 160);
    const detailed = await FarmService.getMemberPendingDetailed("user", "guild");
    assert.equal(detailed?.weeksActive, 2);
    assert.equal(detailed?.totalPending, 160);

    await FarmService.alterWeeklyMeta({ material: "Explosivos", weeklyMin: 0 });
    assert.deepEqual(await FarmService.currentRequirements(), []);
    assert.equal((await FarmService.getMemberPending("user", "guild"))?.pending.Explosivos, 60);
});
