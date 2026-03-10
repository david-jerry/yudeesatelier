import { config } from '@/config';
import Redis from 'ioredis';
import { CLogger } from './logger';

/*
 * CacheManager Best Practices (project-wide)
 *
 * 1. Prefer TAG-BASED invalidation over patterns
 * → Always pass tags[] when calling .set() or .wrap()
 * → Example: ["users", "user:123", "active_users", "dashboard"]
 * → Then invalidateByTag("users") or invalidateByTag("user:123")
 *
 * 2. Use patterns ONLY as fallback or for rare cleanup
 * → invalidatePattern("temp:*") is ok for ephemeral data
 * → Avoid broad patterns like "*": use SCAN-based method above
 *
 * 3. Always set TTLs
 * → Never cache without expiration unless it's intentional (rare)
 *
 * 4. Entity-level tags
 * → For single entities: tag with "entitytype:id" e.g. "product:abc123"
 *
 * 5. List / collection tags
 * → Tag paginated/search results with "products_list", "search:queryhash", etc.
 *
 * 6. Monitor Redis memory & slow logs
 * → If SCAN takes >100-200ms consistently → your keyspace is huge → refine patterns/tags
 */
export class CacheManager {
    private static instance: CacheManager;
    private client: Redis;
    private prefix: string;

    private constructor(prefix: string = "cache") {
        this.prefix = prefix;
        this.client = new Redis(config.REDIS_URL, {
            commandTimeout: 10 * 1000,
            retryStrategy(times) {
                return Math.min(times * 50, 2000);
            },
            maxRetriesPerRequest: 20
        });

        this.client.on("error", (err) => CLogger.error("[REDIS] Redis connection error: " + err));
        this.client.on("connect", () => CLogger.info("[REDIS] Successfully connected to Redis"));
    }

    public static getInstance(prefix: string = "cache"): CacheManager {
        if (!CacheManager.instance) {
            CacheManager.instance = new CacheManager(prefix);
        }
        return CacheManager.instance;
    }

    public getRedis(): Redis {
        return this.client;
    }

    /**
     * Internal helper to format keys with the manager's prefix
     */
    private formatKey(key: string): string {
        // Prevent double prefixing if the key somehow already has it
        if (key.startsWith(`${this.prefix}:`)) return key;
        return `${this.prefix}:${key}`;
    }

    /**
     * Internal helper to standardize tag keys (forces singular 'tag')
     */
    private formatTagKey(tag: string): string {
        return `${this.prefix}:tag:${tag}`;
    }

    /**
     * Retrieve and deserialize JSON data
     */
    public async get<T>(key: string): Promise<T | null> {
        try {
            const data = await this.client.get(this.formatKey(key));
            if (!data) return null;
            return JSON.parse(data) as T;
        } catch (error) {
            CLogger.error(`[REDIS] Error getting cache key ${key}: `, { error });
            return null;
        }
    }

    /**
     * Set data with optional TTL and Tags
     */
    public async set<T>(
        key: string,
        value: T,
        ttl: number = 10800, // Default 3 hours
        tags: string[] = []
    ): Promise<void> {
        try {
            const fullKey = this.formatKey(key);
            const stringValue = JSON.stringify(value);

            // Set the value
            await this.client.set(fullKey, stringValue, 'EX', ttl);

            // If tags are provided, add this key to the tag sets
            if (tags.length > 0) {
                const multi = this.client.multi();
                for (const tag of tags) {
                    const tagKey = this.formatTagKey(tag);
                    multi.sadd(tagKey, fullKey);
                    // Give the tag set a slightly longer TTL so it cleans up properly
                    multi.expire(tagKey, ttl + 60);
                }
                await multi.exec();
            }
        } catch (error) {
            CLogger.error(`[REDIS] Error setting cache key ${key}: `, { error });
        }
    }

    /**
     * Invalidate specific key
     */
    public async invalidate(key: string): Promise<void> {
        await this.client.del(this.formatKey(key));
        CLogger.info(`[REDIS] Invalidated cache key: ${key}`);
    }

    /**
     * Invalidate all keys associated with a tag
     * Note: This has been updated to automatically clean up old plural 'tags:' keys too.
     */
    public async invalidateByTag(tag: string): Promise<void> {
        const tagKey = this.formatTagKey(tag);
        const legacyTagKey = `${this.prefix}:tags:${tag}`; // Catch any old formatted keys

        // Fetch members of both the new and old tag formatting
        const keys = await this.client.smembers(tagKey);
        const legacyKeys = await this.client.smembers(legacyTagKey);

        // Combine all keys and the tag sets themselves into one array
        const keysToDelete = [...keys, ...legacyKeys, tagKey, legacyTagKey];

        // Deduplicate in case a key is in both sets
        const uniqueKeysToDelete = [...new Set(keysToDelete)];

        if (uniqueKeysToDelete.length > 0) {
            // Because the items in the set were stored as full keys (e.g. "cache:products:..."), 
            // we do NOT format them again. We just pass them straight to .del()
            await this.client.del(...uniqueKeysToDelete);
            CLogger.info(`[REDIS] Invalidated ${keys.length + legacyKeys.length} items for tag: ${tag}`);
        }
    }

    /**
     * Invalidate keys matching a pattern (e.g. "product:*")
     */
    public async invalidatePattern(pattern: string): Promise<void> {
        const fullPattern = this.formatKey(pattern); // formatKey ensures no double prefix
        const keys = await this.client.keys(fullPattern);

        if (keys.length > 0) {
            await this.client.del(...keys);
            CLogger.info(`[REDIS] Invalidated ${keys.length} keys matching pattern: ${pattern}`);
        }
    }

    /**
     * Flush all cache keys associated with this application prefix
     */
    public async flushAll(): Promise<void> {
        const pattern = `${this.prefix}:*`;
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
            await this.client.del(...keys);
            CLogger.info(`[REDIS] Flushed all keys with prefix: ${this.prefix}`);
        }
    }

    /**
     * Wrapper for fetching data with a "Stale-While-Revalidate" approach
     */
    public async wrap<T>(
        key: string,
        fetchFn: () => Promise<T>,
        ttl: number = 10800,
        tags: string[] = []
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached) return cached;

        const freshData = await fetchFn();
        await this.set(key, freshData, ttl, tags);
        return freshData;
    }

    /**
     * Acquire a distributed lock
     */
    public async acquireLock(resource: string, ttl: number = 5000): Promise<string | null> {
        const lockKey = `${this.prefix}:lock:${resource}`;
        const token = Math.random().toString(36).substring(2);

        const acquired = await this.client.set(lockKey, token, 'PX', ttl, 'NX');

        if (acquired === 'OK') {
            CLogger.info(`[REDIS] Lock acquired: ${resource}`);
            return token;
        }
        return null;
    }

    /**
     * Release a lock safely using a Lua script
     */
    public async releaseLock(resource: string, token: string): Promise<void> {
        const lockKey = `${this.prefix}:lock:${resource}`;
        const script = `
            if redis.call("get", KEYS[1]) == ARGV[1] then
                return redis.call("del", KEYS[1])
            else
                return 0
            end
        `;
        await this.client.eval(script, 1, lockKey, token);
        CLogger.info(`[REDIS] Lock released: ${resource}`);
    }

    /**
     * Wrapper for critical sections to prevent race conditions
     */
    public async withLock<T>(
        resource: string,
        action: () => Promise<T>,
        ttl: number = 10000,
        retries: number = 5
    ): Promise<T> {
        let token: string | null = null;
        let attempt = 0;

        while (!token && attempt < retries) {
            token = await this.acquireLock(resource, ttl);
            if (!token) {
                attempt++;
                await new Promise(res => setTimeout(res, 100 * attempt));
            }
        }

        if (!token) {
            throw new Error(`Could not acquire lock for resource: ${resource} after ${retries} attempts`);
        }

        try {
            return await action();
        } finally {
            await this.releaseLock(resource, token);
        }
    }
}

export const cacheManager = CacheManager.getInstance();