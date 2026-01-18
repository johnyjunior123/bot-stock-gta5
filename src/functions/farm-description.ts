import { Farm } from "../types/entrega-farm.js";

export function formatFarmList(farm: Partial<Farm>): string[] {
    return [
        `🪨 **Metal:** ${farm.metal ?? 0}`,
        `🛞 **Borracha:** ${farm.rubber ?? 0}`,
        `🧲 **Cobre:** ${farm.copper ?? 0}`,
        `🧴 **Plástico:** ${farm.plastic ?? 0}`,
        `🧪 **Vidro:** ${farm.glass ?? 0}`,
        `🔫 **Peça de Arma:** ${farm.pieceWeapon ?? 0}`,
        `🔫 **Peça de Pistola:** ${farm.pistolPiece ?? 0}`,
    ];
}