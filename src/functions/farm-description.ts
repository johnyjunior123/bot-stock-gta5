import type { Farm } from "../types/entrega-farm.js";
import { BUILTIN_MATERIALS } from "./materials.js";
import { formatMaterial } from "./utils.js";

export function formatFarmList(farm: Partial<Farm>): string[] {
    return [
        `🪨 **Metal:** ${farm.metal ?? 0}`,
        `🛞 **Borracha:** ${farm.rubber ?? 0}`,
        `🧲 **Cobre:** ${farm.copper ?? 0}`,
        `🧴 **Plástico:** ${farm.plastic ?? 0}`,
        `🧪 **Vidro:** ${farm.glass ?? 0}`,
        `🏖️ **Areia:** ${farm.sand ?? 0}`,
        `🔫 **Peça de Arma:** ${farm.pieceWeapon ?? 0}`,
        `🔫 **Peça de Sub:** ${farm.pistolPiece ?? 0}`,
        ...Object.entries(farm)
            .filter(([material]) => !BUILTIN_MATERIALS.some(key => key === material) && material !== "dirtyMoney")
            .map(([material, quantity]) => `📦 **${formatMaterial(material)}:** ${quantity ?? 0}`),
    ];
}
