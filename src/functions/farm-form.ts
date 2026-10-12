import { formatMaterial } from "./utils.js";

export type FarmRequirement = { material: string; weeklyMin: number };

export function currentFarmRequirements<T extends FarmRequirement & { startsAt: Date }>(
    requirements: T[], now = new Date(),
): T[] {
    const latest = new Map<string, T>();
    for (const requirement of requirements) {
        if (requirement.startsAt > now) continue;
        const previous = latest.get(requirement.material);
        if (!previous || requirement.startsAt > previous.startsAt) {
            latest.set(requirement.material, requirement);
        }
    }
    return [...latest.values()].filter(requirement => requirement.weeklyMin > 0);
}

export function farmFormPages(requirements: FarmRequirement[]): FarmRequirement[][] {
    const pages: FarmRequirement[][] = [];
    // O último modal reserva um dos cinco componentes para o comprovante.
    let remaining = [...requirements];
    while (remaining.length > 4) {
        pages.push(remaining.slice(0, 5));
        remaining = remaining.slice(5);
    }
    pages.push(remaining);
    return pages;
}

export function readFarmQuantities(
    requirements: FarmRequirement[], getValue: (material: string) => string,
): Partial<Record<string, number>> {
    const quantities: Partial<Record<string, number>> = {};
    for (const { material } of requirements) {
        const value = getValue(material).trim();
        const quantity = Number(value);
        if (!/^\d+$/.test(value) || !Number.isSafeInteger(quantity) || quantity > 2147483647) {
            throw new Error(`Informe uma quantidade inteira de 0 a 2147483647 para ${formatMaterial(material)}.`);
        }
        quantities[material] = quantity;
    }
    return quantities;
}
