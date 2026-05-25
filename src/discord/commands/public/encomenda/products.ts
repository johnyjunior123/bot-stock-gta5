export type Partnership = "com" | "sem";
export type MoneyType = "limpo" | "sujo";

type UnitProduct = {
    id: string;
    name: string;
    kind: "ammo" | "weapon" | "coin";
    prices: Record<Partnership, Partial<Record<MoneyType, number>>>;
};

type ServiceProduct = {
    id: string;
    name: string;
    kind: "service";
    percentage: number;
};

export type Product = UnitProduct | ServiceProduct;

export const products = [
    {
        id: "municao_pistola",
        name: "Munição de pistola",
        kind: "ammo",
        prices: {
            sem: { limpo: 95, sujo: 120 },
            com: { limpo: 90, sujo: 117 },
        },
    },
    {
        id: "municao_sub",
        name: "Munição de sub",
        kind: "ammo",
        prices: {
            sem: { limpo: 140, sujo: 180 },
            com: { limpo: 120, sujo: 160 },
        },
    },
    {
        id: "municao_fuzil",
        name: "Munição de fuzil",
        kind: "ammo",
        prices: {
            sem: { limpo: 270, sujo: 350 },
            com: { limpo: 240, sujo: 270 },
        },
    },
    {
        id: "m1911",
        name: "M1911",
        kind: "weapon",
        prices: {
            sem: { limpo: 75000, sujo: 98000 },
            com: { limpo: 65000, sujo: 85000 },
        },
    },
    {
        id: "five_seven",
        name: "Five-seven",
        kind: "weapon",
        prices: {
            sem: { limpo: 90000, sujo: 117000 },
            com: { limpo: 90000, sujo: 117000 },
        },
    },
    {
        id: "skorpion_v61",
        name: "Skorpion V61",
        kind: "weapon",
        prices: {
            sem: { limpo: 150000, sujo: 195000 },
            com: { limpo: 140000, sujo: 182000 },
        },
    },
    {
        id: "moeda_k_alho",
        name: "Moeda K-alho",
        kind: "coin",
        prices: {
            sem: { limpo: 130000 },
            com: { limpo: 130000 },
        },
    },
    {
        id: "lavagem",
        name: "Lavagem",
        kind: "service",
        percentage: 21,
    },
] as const satisfies Product[];

export const productChoices = products.map(product => ({
    name: product.name,
    value: product.id,
}));

export function findProduct(id: string) {
    return products.find(product => product.id === id);
}

export function resolveMoneyType(product: Product, moneyType: MoneyType): MoneyType {
    if (product.kind === "service") return "limpo";

    return product.prices.com[moneyType] || product.prices.sem[moneyType]
        ? moneyType
        : "limpo";
}

export function calculatePrice(product: Product, partnership: Partnership, moneyType: MoneyType, quantity: number) {
    if (product.kind === "service") {
        const total = Math.round(quantity * (product.percentage / 100));
        return {
            unit: `${product.percentage}%`,
            total: `${formatMoney(total)} (${product.percentage}%)`,
        };
    }

    const resolvedMoneyType = resolveMoneyType(product, moneyType);
    const unitPrice = product.prices[partnership][resolvedMoneyType] ?? product.prices[partnership].limpo;
    const total = (unitPrice ?? 0) * quantity;

    return {
        unit: formatMoney(unitPrice ?? 0),
        total: formatMoney(total),
    };
}

export function formatMoney(value: number) {
    if (value >= 1000 && value % 1000 === 0) {
        return `${value / 1000}k`;
    }

    return value.toLocaleString("pt-BR");
}

export function formatQuantity(product: Product, quantity: number) {
    if (product.kind === "ammo") {
        return `${quantity}k`;
    }

    return formatMoney(quantity);
}

export function formatPartnership(partnership: Partnership) {
    return partnership === "com" ? "Sim" : "Não";
}

export function formatPartnershipSale(partnership: Partnership) {
    return partnership === "com" ? "Com parceria" : "Sem parceria";
}

export function formatMoneyType(moneyType: MoneyType) {
    return moneyType === "limpo" ? "Limpo" : "Sujo";
}
