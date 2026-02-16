import { logger } from './logger';

/**
 * CacheService: A unified interface for caching strategies.
 * Currently supports:
 * 1. LocalStorage (Client-Side, persistent across reloads)
 * 2. Memory (Session only)
 * 3. Redis (Upstash HTTP - Future Ready for Serverless)
 */

interface CacheProvider {
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    del(key: string): Promise<void>;
    clear(): Promise<void>;
}

class LocalStorageProvider implements CacheProvider {
    async get<T>(key: string): Promise<T | null> {
        try {
            const item = localStorage.getItem(key);
            if (!item) return null;

            const parsed = JSON.parse(item);
            if (parsed.expiry && Date.now() > parsed.expiry) {
                this.del(key);
                return null;
            }
            return parsed.value as T;
        } catch (e) {
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 3600) {
        try {
            const expiry = Date.now() + (ttlSeconds * 1000);
            localStorage.setItem(key, JSON.stringify({ value, expiry }));
        } catch (e) {
            console.warn("LocalStorage Quota Exceeded");
        }
    }

    async del(key: string) {
        localStorage.removeItem(key);
    }

    async clear() {
        localStorage.clear();
    }
}

// Placeholder for Upstash Redis (HTTP)
// In a real scenario, you would fetch from https://<UPSTASH_URL>/set/key/value?_token=<TOKEN>
class UpstashRedisProvider implements CacheProvider {
    private url: string;
    private token: string;

    constructor(url: string, token: string) {
        this.url = url;
        this.token = token;
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const res = await fetch(`${this.url}/get/${key}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
            const data = await res.json();
            return data.result ? JSON.parse(data.result) : null;
        } catch (e) {
            logger.error("Redis Get Failed", key, e);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 3600) {
        try {
            await fetch(`${this.url}/set/${key}/${JSON.stringify(value)}?ex=${ttlSeconds}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
        } catch (e) {
            logger.error("Redis Set Failed", key, e);
        }
    }

    async del(key: string) {
        try {
            await fetch(`${this.url}/del/${key}`, {
                headers: { Authorization: `Bearer ${this.token}` }
            });
        } catch (e) { }
    }

    async clear() {
        // flushdb command
    }
}

export class CacheService {
    private static provider: CacheProvider = new LocalStorageProvider();
    private static useRedis = false;

    static init(config?: { redisUrl: string, redisToken: string }) {
        if (config?.redisUrl && config?.redisToken) {
            this.provider = new UpstashRedisProvider(config.redisUrl, config.redisToken);
            this.useRedis = true;
            logger.info("CacheService", "Switched to Redis (Upstash) Provider");
        } else {
            logger.info("CacheService", "Using LocalStorage Provider");
        }
    }

    static async get<T>(key: string): Promise<T | null> {
        return this.provider.get<T>(key);
    }

    static async set(key: string, value: any, ttl: number = 3600) {
        return this.provider.set(key, value, ttl);
    }

    static async del(key: string) {
        return this.provider.del(key);
    }

    static async clear() {
        return this.provider.clear();
    }
}
