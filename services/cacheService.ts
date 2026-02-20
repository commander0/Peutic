import { logger } from './logger';
import { supabase } from './supabaseClient';

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

// Provider using Supabase Edge Function to proxy to Redis (TCP)
class SupabaseRedisProvider implements CacheProvider {

    async get<T>(key: string): Promise<T | null> {
        try {
            const { data, error } = await supabase.functions.invoke('redis-proxy', {
                body: { action: 'get', key }
            });
            if (error || !data) return null;
            return typeof data === 'string' ? JSON.parse(data) : data;
        } catch (e) {
            console.warn("Redis Proxy Get Failed", key, e);
            return null;
        }
    }

    async set(key: string, value: any, ttlSeconds: number = 3600) {
        try {
            await supabase.functions.invoke('redis-proxy', {
                body: { action: 'set', key, value, ttl: ttlSeconds }
            });
        } catch (e) {
            console.warn("Redis Proxy Set Failed", key, e);
        }
    }

    async del(key: string) {
        try {
            await supabase.functions.invoke('redis-proxy', {
                body: { action: 'del', key }
            });
        } catch (e) { }
    }

    async clear() {
        // Not implemented for safety
    }
}

export class CacheService {
    private static provider: CacheProvider = new LocalStorageProvider();


    static init(config?: { redisUrl: string, redisToken: string }) {
        // Even if config is passed, we use the Proxy provider which uses Supabase Auth + Env vars on server
        // We check if the Env vars exist in Client just as a signal to enable it
        if (config?.redisUrl) {
            this.provider = new SupabaseRedisProvider();

            logger.info("CacheService", "Switched to Redis (Edge Proxy) Provider");
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
