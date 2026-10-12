import assert from "node:assert/strict";
import { test } from "node:test";
import { ModalBuilder } from "discord.js";
import { clearFarmSession, startFarmSession } from "../src/cache/farm-cache.js";
import { createFarmModal } from "../src/functions/farm-modal.js";
import { currentFarmRequirements, readFarmQuantities } from "../src/functions/farm-form.js";
import { formatFarmList } from "../src/functions/farm-description.js";
import { BUILTIN_MATERIALS, materialChoices, normalizeMaterialName, sumFarmQuantities, validateMaterialName } from "../src/functions/materials.js";

test("cadastro limpa espaços e identifica nomes equivalentes e materiais existentes", () => {
    assert.deepEqual(validateMaterialName("  Explosivos   Pesados  "), {
        name: "Explosivos Pesados", normalizedName: "explosivos pesados",
    });
    assert.equal(normalizeMaterialName("  PÓLVORA  "), normalizeMaterialName("Polvora"));
    for (const name of ["METAL", "copper", " Plastico ", "Peça de Sub", "Areia"]) {
        assert.throws(() => validateMaterialName(name), /já existe/);
    }
    for (const name of ["", " ", "a".repeat(51), "<@123>", "**teste**", "__proto__", "images", "constructor", "toString", "DirtyMoney"]) {
        assert.throws(() => validateMaterialName(name));
    }
});

test("sugestões incluem novos materiais, aceitam busca sem acentos e respeitam limite do Discord", () => {
    const names = ["Explosivos", "Pólvora", ...Array.from({ length: 30 }, (_, i) => `Material ${i}`)];
    assert.deepEqual(materialChoices(names, "expl"), [{ name: "Explosivos", value: "Explosivos" }]);
    assert.deepEqual(materialChoices(names, "POLVORA"), [{ name: "Pólvora", value: "Pólvora" }]);
    assert.deepEqual(materialChoices(names, "cobre"), [{ name: "Cobre", value: "copper" }]);
    assert.equal(materialChoices(names, "").length, 25);
    assert.deepEqual(materialChoices(names, "inexistente"), []);
});

test("material personalizado aparece no modal e no comprovante, e meta zero o desativa", () => {
    const key = "guild:custom";
    const session = startFarmSession(key, [{ material: "Explosivos", weeklyMin: 100 }]);
    try {
        const modal = JSON.stringify(new ModalBuilder(createFarmModal(session)).toJSON());
        assert.match(modal, /"custom_id":"Explosivos"/);
        assert.match(modal, /meta: 100/);
        const quantities = readFarmQuantities(session.pages[0], () => "40");
        assert.deepEqual(quantities, { Explosivos: 40 });
        assert.ok(formatFarmList(quantities).some(line => line.includes("**Explosivos:** 40")));
        assert.deepEqual(currentFarmRequirements([
            { material: "Explosivos", weeklyMin: 100, startsAt: new Date("2026-10-05") },
            { material: "Explosivos", weeklyMin: 0, startsAt: new Date("2026-10-12") },
        ], new Date("2026-10-13")), []);
    } finally {
        clearFarmSession(key);
    }
});

test("totais preservam entregas antigas e somam materiais personalizados sem contar dinheiro", () => {
    const legacy = { metal: 10, copper: 0, rubber: 0, plastic: 0, glass: 0, sand: 0, pieceWeapon: 0, pistolPiece: 5, dirtyMoney: 999 };
    const summary = sumFarmQuantities([
        legacy,
        { ...legacy, customMaterials: { Explosivos: 40, "Pólvora": 20 } },
        { ...legacy, customMaterials: { Explosivos: 60 } },
    ]);
    assert.equal(summary.quantities.Explosivos, 100);
    assert.equal(summary.quantities["Pólvora"], 20);
    assert.equal(summary.quantities.metal, 30);
    assert.equal(summary.quantities.pistolPiece, 15);
    assert.equal(summary.total, 165);
    assert.equal(sumFarmQuantities([]).total, 0);
    assert.equal(Object.keys(sumFarmQuantities([]).quantities).length, BUILTIN_MATERIALS.length);
});

test("mais de 25 materiais continuam disponíveis em modais paginados", () => {
    const requirements = Array.from({ length: 31 }, (_, i) => ({ material: `Material ${i}`, weeklyMin: 10 }));
    const key = "guild:many-custom";
    const session = startFarmSession(key, requirements);
    try {
        assert.deepEqual(session.pages.flat(), requirements);
        for (let page = 0; page < session.pages.length; page++) {
            session.page = page;
            assert.ok(new ModalBuilder(createFarmModal(session)).toJSON().components.length <= 5);
        }
    } finally {
        clearFarmSession(key);
    }
});
