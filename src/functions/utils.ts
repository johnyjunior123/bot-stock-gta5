export function getWeekStart(date = new Date()) {
    const d = new Date(Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
    ));

    const day = d.getUTCDay(); // 0 = domingo
    const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1);

    d.setUTCDate(diff);
    d.setUTCHours(0, 0, 0, 0);
    return d;
}

export function getWeeksBetween(start: Date, end: Date) {
    const weeks: Date[] = [];
    let current = getWeekStart(start);

    const last = getWeekStart(end);

    while (current <= last) {
        weeks.push(new Date(current));
        current.setUTCDate(current.getUTCDate() + 7);
    }

    return weeks;
}

export function formatMaterial(material: string) {
    const map: Record<string, string> = {
        metal: "Metal",
        copper: "Cobre",
        rubber: "Borracha",
        plastic: "Plástico",
        glass: "Vidro",
        pieceWeapon: "Peça de Arma",
        pistolPiece: "Corpo de Arma",
    };

    return map[material] ?? material;
}