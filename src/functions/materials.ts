import { formatMaterial } from "./utils.js";

export const BUILTIN_MATERIALS = [
    "metal", "copper", "rubber", "plastic", "glass", "sand", "pieceWeapon", "pistolPiece",
] as const;

export function normalizeMaterialName(name: string) {
    return name.normalize("NFD").replace(/\p{M}/gu, "").trim().replace(/\s+/g, " ").toLowerCase();
}

export function validateMaterialName(input: string) {
    const name = input.normalize("NFC").trim().replace(/\s+/g, " ");
    if (name.length < 1 || name.length > 50 || !/^[\p{L}\p{N}][\p{L}\p{N} -]*$/u.test(name)) {
        throw new Error("Use um nome de 1 a 50 caracteres, com letras, números, espaços ou hífens.");
    }
    const normalizedName = normalizeMaterialName(name);
    const reserved = ["images", "dirtyMoney", "prototype", ...Object.getOwnPropertyNames(Object.prototype)];
    if (reserved.some(value => normalizeMaterialName(value) === normalizedName)) {
        throw new Error("Esse nome é reservado. Escolha outro nome para o material.");
    }
    if (BUILTIN_MATERIALS.some(value => [value, formatMaterial(value)].some(
        alias => normalizeMaterialName(alias) === normalizedName,
    ))) {
        throw new Error("Esse material já existe. Configure a quantidade em /alterar-valor.");
    }
    return { name, normalizedName };
}

export function materialChoices(names: string[], query: string) {
    const search = normalizeMaterialName(query);
    return [...BUILTIN_MATERIALS, ...names]
        .filter(material => [material, formatMaterial(material)].some(
            value => normalizeMaterialName(value).includes(search),
        ))
        .slice(0, 25)
        .map(material => ({ name: formatMaterial(material), value: material }));
}

type StoredFarm = Record<typeof BUILTIN_MATERIALS[number], number> & { customMaterials?: unknown };

export function farmQuantities(farm: StoredFarm): Record<string, number> {
    const custom = farm.customMaterials;
    const entries = custom && typeof custom === "object" && !Array.isArray(custom)
        ? Object.entries(custom).filter((entry): entry is [string, number] =>
            typeof entry[1] === "number" && Number.isSafeInteger(entry[1]) && entry[1] >= 0)
        : [];
    return Object.fromEntries([...entries, ...BUILTIN_MATERIALS.map(key => [key, farm[key]])]);
}

export function sumFarmQuantities(farms: StoredFarm[]) {
    const totals: Record<string, number> = Object.fromEntries(BUILTIN_MATERIALS.map(key => [key, 0]));
    for (const farm of farms) {
        for (const [material, quantity] of Object.entries(farmQuantities(farm))) {
            totals[material] = (Object.hasOwn(totals, material) ? totals[material] : 0) + quantity;
        }
    }
    return { quantities: totals, total: Object.values(totals).reduce((sum, value) => sum + value, 0) };
}
