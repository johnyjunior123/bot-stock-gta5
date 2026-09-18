import { randomUUID } from "node:crypto";
import type { Farm } from "../types/entrega-farm.js";
import { farmFormPages, type FarmRequirement } from "../functions/farm-form.js";

export type FarmCacheData = {
    id: string;
    pages: FarmRequirement[][];
    page: number;
    quantities: Partial<Farm>;
    submitting: boolean;
    expiresAt: number;
    timeout: NodeJS.Timeout;
};

export const farmCache = new Map<string, FarmCacheData>();

export function clearFarmSession(key: string) {
    const session = farmCache.get(key);
    if (session) clearTimeout(session.timeout);
    farmCache.delete(key);
}

export function startFarmSession(key: string, requirements: FarmRequirement[]) {
    clearFarmSession(key);
    const timeout = setTimeout(() => clearFarmSession(key), 20 * 60 * 1000);
    timeout.unref();
    const session: FarmCacheData = {
        id: randomUUID(),
        pages: farmFormPages(requirements),
        page: 0,
        quantities: {},
        submitting: false,
        expiresAt: Date.now() + 20 * 60 * 1000,
        timeout,
    };
    farmCache.set(key, session);
    return session;
}

export function getFarmSession(key: string, id: string, page: string) {
    const session = farmCache.get(key);
    if (!session || session.id !== id || session.page !== Number(page) || session.submitting) return;
    if (session.expiresAt <= Date.now()) {
        clearFarmSession(key);
        return;
    }
    return session;
}
