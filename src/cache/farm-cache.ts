import { Farm } from "../types/entrega-farm.js";

type FarmCacheData = {
    step1: Partial<Farm>;
    expiresAt: number;
    timeout: NodeJS.Timeout;
};

export const farmCache = new Map<string, FarmCacheData>();