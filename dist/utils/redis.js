import Redis from 'ioredis';
let redis = null;
export const getRedisClient = () => {
    if (!redis) {
        const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
        redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
            lazyConnect: true,
            enableOfflineQueue: false,
            connectTimeout: 10000,
            commandTimeout: 5000,
        });
        redis.on('error', error => {
            console.error('Redis connection error:', error);
        });
        redis.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });
        redis.on('disconnect', () => {
            console.warn('⚠️  Redis disconnected');
        });
    }
    return redis;
};
export const testRedisConnection = async () => {
    try {
        const client = getRedisClient();
        await client.ping();
        return true;
    }
    catch (error) {
        console.error('Redis connection test failed:', error);
        return false;
    }
};
export class RedisCache {
    redis;
    constructor() {
        this.redis = getRedisClient();
    }
    async set(key, value, ttlSeconds = 3600) {
        try {
            const serialized = JSON.stringify(value);
            await this.redis.set(key, serialized, 'EX', ttlSeconds);
        }
        catch (error) {
            console.error(`Redis SET error for key ${key}:`, error);
        }
    }
    async get(key) {
        try {
            const value = await this.redis.get(key);
            if (!value)
                return null;
            return JSON.parse(value);
        }
        catch (error) {
            console.error(`Redis GET error for key ${key}:`, error);
            return null;
        }
    }
    async del(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            console.error(`Redis DEL error for key ${key}:`, error);
        }
    }
    async invalidatePattern(pattern) {
        try {
            const keys = await this.redis.keys(pattern);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
        }
        catch (error) {
            console.error(`Redis pattern invalidation error for ${pattern}:`, error);
        }
    }
    async sadd(key, value, ttlSeconds) {
        try {
            await this.redis.sadd(key, value);
            if (ttlSeconds) {
                await this.redis.expire(key, ttlSeconds);
            }
        }
        catch (error) {
            console.error(`Redis SADD error for key ${key}:`, error);
        }
    }
    async sismember(key, value) {
        try {
            const result = await this.redis.sismember(key, value);
            return result === 1;
        }
        catch (error) {
            console.error(`Redis SISMEMBER error for key ${key}:`, error);
            return false;
        }
    }
}
export const cache = new RedisCache();
export const disconnectRedis = async () => {
    if (redis) {
        try {
            await redis.quit();
            console.log('Redis disconnected gracefully');
        }
        catch (error) {
            console.error('Error disconnecting Redis:', error);
        }
    }
};
//# sourceMappingURL=redis.js.map