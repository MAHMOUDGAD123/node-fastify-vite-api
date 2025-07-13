import type { Cache } from "cache-manager";
import { PINO_CONFIG } from "./pino-config";
import fs from "fs";

export const getPinoConfig = (mode: "development" | "production") => {
  return PINO_CONFIG[mode];
};

/**
 * @param ms number of milliseconds
 */
export const waitFor = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const readLocalJsonFile = async (path: string) => {
  return JSON.parse(fs.readFileSync(path).toString());
};

// Caching
// =============================================================
export const getCachedValue = async (memCache: Cache, cacheKey: string) => {
  const cachedValue = await memCache.get(cacheKey);

  if (cachedValue) {
    return cachedValue;
  }
  return null;
};

export const saveToCache = async (
  memCache: Cache,
  cacheKey: string,
  dataToSave: unknown
) => {
  memCache.set(cacheKey, dataToSave);
};
// =============================================================
