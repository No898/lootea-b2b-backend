import Redis from 'ioredis';

// Redis client instance
let redis: Redis | null = null;

/**
 * Získá Redis client instanci
 * Lazy loading - vytvoří se až při prvním použití
 */
export const getRedisClient = (): Redis => {
  if (!redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      // Pro Railway production
      enableOfflineQueue: false,
      connectTimeout: 10000,
      commandTimeout: 5000,
    });

    // Error handling
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

/**
 * Testuje Redis připojení
 */
export const testRedisConnection = async (): Promise<boolean> => {
  try {
    const client = getRedisClient();
    await client.ping();
    return true;
  } catch (error) {
    console.error('Redis connection test failed:', error);
    return false;
  }
};

/**
 * Cache helper funkce
 */
export class RedisCache {
  private redis: Redis;

  constructor() {
    this.redis = getRedisClient();
  }

  /**
   * Uloží data do cache s TTL
   */
  async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
    try {
      const serialized = JSON.stringify(value);
      await this.redis.set(key, serialized, 'EX', ttlSeconds);
    } catch (error) {
      console.error(`Redis SET error for key ${key}:`, error);
    }
  }

  /**
   * Načte data z cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error);
      return null;
    }
  }

  /**
   * Smaže klíč z cache
   */
  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      console.error(`Redis DEL error for key ${key}:`, error);
    }
  }

  /**
   * Invaliduje cache podle pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
      console.error(`Redis pattern invalidation error for ${pattern}:`, error);
    }
  }

  /**
   * Uloží do set (pro blacklist tokenů apod.)
   */
  async sadd(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      await this.redis.sadd(key, value);
      if (ttlSeconds) {
        await this.redis.expire(key, ttlSeconds);
      }
    } catch (error) {
      console.error(`Redis SADD error for key ${key}:`, error);
    }
  }

  /**
   * Kontroluje zda je hodnota v setu
   */
  async sismember(key: string, value: string): Promise<boolean> {
    try {
      const result = await this.redis.sismember(key, value);
      return result === 1;
    } catch (error) {
      console.error(`Redis SISMEMBER error for key ${key}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const cache = new RedisCache();

/**
 * Explicitně se připojí k Redis a čeká, dokud není spojení připraveno.
 */
export const connectRedis = async (): Promise<void> => {
  const client = getRedisClient();
  // .connect() vrací promise, která se vyřeší, když je spojení navázáno.
  // Pokud je lazyConnect: true, toto spojení vynutí.
  // Pokud je již připojeno, promise se okamžitě vyřeší.
  await client.connect().catch(err => {
    // ioredis se pokusí znovu připojit, takže tohle nemusí být fatální.
    // Ale je dobré to zalogovat.
    console.error('Initial Redis connection failed:', err);
    // Pokud chceme, aby aplikace spadla, pokud se Redis nepřipojí na startu:
    // throw err;
  });
};

/**
 * Graceful shutdown pro Redis
 */
export const disconnectRedis = async (): Promise<void> => {
  if (redis) {
    try {
      await redis.quit();
      console.log('Redis disconnected gracefully');
    } catch (error) {
      console.error('Error disconnecting Redis:', error);
    }
  }
};
