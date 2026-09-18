import assert from "node:assert/strict";
import { test } from "node:test";
import { ModalBuilder } from "discord.js";
import { clearFarmSession, getFarmSession, startFarmSession } from "../src/cache/farm-cache.js";
import { currentFarmRequirements, farmFormPages, readFarmQuantities, type FarmRequirement } from "../src/functions/farm-form.js";
import { createFarmModal } from "../src/functions/farm-modal.js";
import { formatMaterial } from "../src/functions/utils.js";

const requirements: FarmRequirement[] = [
    { material: "metal", weeklyMin: 1000 },
    { material: "copper", weeklyMin: 200 },
    { material: "rubber", weeklyMin: 300 },
    { material: "plastic", weeklyMin: 400 },
    { material: "glass", weeklyMin: 500 },
    { material: "pieceWeapon", weeklyMin: 10 },
    { material: "pistolPiece", weeklyMin: 20 },
];

test("metas vigentes usam o último valor, ignoram futuras e desativam valor zero", () => {
    const result = currentFarmRequirements([
        { material: "metal", weeklyMin: 1000, startsAt: new Date("2026-09-14") },
        { material: "copper", weeklyMin: 0, startsAt: new Date("2026-09-14") },
        { material: "metal", weeklyMin: 500, startsAt: new Date("2026-09-07") },
        { material: "copper", weeklyMin: 200, startsAt: new Date("2026-09-07") },
        { material: "glass", weeklyMin: 500, startsAt: new Date("2026-09-21") },
    ], new Date("2026-09-18"));
    assert.equal(result.length, 1);
    assert.equal(result[0].material, "metal");
    assert.equal(result[0].weeklyMin, 1000);
    assert.deepEqual(currentFarmRequirements([]), []);
});

test("apenas metal cadastrado gera campo obrigatório de metal e comprovante", () => {
    const key = "guild:single";
    const session = startFarmSession(key, requirements.slice(0, 1));
    try {
        const modal = createFarmModal(session);
        const components = new ModalBuilder(modal).toJSON().components;
        assert.equal(components.length, 2);
        const serialized = JSON.stringify(components);
        assert.match(serialized, /1000/);
        assert.match(serialized, /"custom_id":"metal"/);
        assert.match(serialized, /"custom_id":"images"/);
        assert.doesNotMatch(serialized, /copper|rubber|plastic|glass|pieceWeapon|pistolPiece/);
        assert.ok(components.every(component => "component" in component && component.component.required));
    } finally {
        clearFarmSession(key);
    }
});

test("de um a sete materiais, todos aparecem uma vez e nenhum modal excede cinco campos", () => {
    for (let count = 1; count <= requirements.length; count++) {
        const selected = requirements.slice(0, count);
        const key = `guild:count-${count}`;
        const session = startFarmSession(key, selected);
        try {
            assert.deepEqual(session.pages.flat(), selected);
            for (let page = 0; page < session.pages.length; page++) {
                session.page = page;
                const modal = createFarmModal(session);
                const components = new ModalBuilder(modal).toJSON().components;
                assert.ok(components.length >= 1 && components.length <= 5);
                const serialized = JSON.stringify(components);
                assert.equal(serialized.includes('"custom_id":"images"'), page === session.pages.length - 1);
            }
        } finally {
            clearFarmSession(key);
        }
    }
    assert.deepEqual(farmFormPages(requirements.slice(0, 5)).map(page => page.length), [5, 0]);
});

test("valida quantidades inteiras e lê apenas campos configurados", () => {
    assert.deepEqual(readFarmQuantities(requirements.slice(0, 1), material => {
        assert.equal(material, "metal");
        return " 1000 ";
    }), { metal: 1000 });
    assert.deepEqual(readFarmQuantities(requirements.slice(0, 1), () => "0"), { metal: 0 });
    for (const invalid of ["", " ", "-1", "1.5", "1,5", "abc", "NaN", "Infinity", "1e3", "2147483648"]) {
        assert.throws(() => readFarmQuantities(requirements.slice(0, 1), () => invalid), /quantidade inteira/);
    }
});

test("sessões isolam servidores e rejeitam formulários antigos, expirados e envio duplicado", () => {
    const key = "guild1:user";
    const otherKey = "guild2:user";
    const first = startFarmSession(key, requirements);
    const other = startFarmSession(otherKey, requirements);
    const current = startFarmSession(key, requirements);
    try {
        assert.equal(getFarmSession(key, first.id, "0"), undefined);
        assert.equal(getFarmSession(otherKey, other.id, "0"), other);
        assert.equal(getFarmSession(key, current.id, "1"), undefined);
        assert.equal(getFarmSession(key, current.id, "0"), current);
        current.submitting = true;
        assert.equal(getFarmSession(key, current.id, "0"), undefined);
        current.submitting = false;
        current.expiresAt = Date.now() - 1;
        assert.equal(getFarmSession(key, current.id, "0"), undefined);
    } finally {
        clearFarmSession(key);
        clearFarmSession(otherKey);
    }
});

test("chave histórica de pistola exibe Peça de Sub", () => {
    assert.equal(formatMaterial("pistolPiece"), "Peça de Sub");
});
