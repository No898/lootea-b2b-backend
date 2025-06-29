import { getRedisClient } from './redis.js';

/**
 * Rate limiting konfigurace
 */
export const rateLimitConfig = {
  // GraphQL endpoint - více permissive pro authenticated users
  graphql: {
    max: 100, // requests per window
    timeWindow: '1 minute',
    skipOnError: true, // Pokud Redis selže, nepřerušíme service
  },

  // Auth endpoints - méně permissive
  auth: {
    max: 10,
    timeWindow: '1 minute',
    skipOnError: true,
  },

  // General REST endpoints
  general: {
    max: 200,
    timeWindow: '1 minute',
    skipOnError: true,
  },
};

/**
 * Custom rate limiter pro GraphQL s Redis
 * Rozlišuje mezi authenticated a anonymous users
 */
export class GraphQLRateLimiter {
  private redis = getRedisClient();

  async checkLimit(
    identifier: string, // IP nebo user ID
    isAuthenticated: boolean = false
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    try {
      // Authenticated users mají vyšší limit
      const limit = isAuthenticated ? 200 : 50;
      const window = 60; // 1 minuta v sekundách

      const key = `rate_limit:graphql:${identifier}`;
      const now = Math.floor(Date.now() / 1000);
      const windowStart = now - window;

      // Použijeme sliding window s Redis sorted sets
      const pipeline = this.redis.pipeline();

      // Odstraň staré záznamy
      pipeline.zremrangebyscore(key, 0, windowStart);

      // Spočítej současné requests
      pipeline.zcard(key);

      // Přidej současný request
      pipeline.zadd(key, now, `${now}-${Math.random()}`);

      // Nastav expiraci
      pipeline.expire(key, window);

      const results = await pipeline.exec();

      if (!results) {
        // Redis error, povolíme request
        return { allowed: true, remaining: limit, resetTime: now + window };
      }

      const currentCount = (results[1][1] as number) || 0;
      const allowed = currentCount < limit;
      const remaining = Math.max(0, limit - currentCount - 1);

      return {
        allowed,
        remaining,
        resetTime: now + window,
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // Při chybě povolíme request
      return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
    }
  }
}

/**
 * Rate limit plugin pro Fastify
 */
export const createRateLimitPlugin = () => {
  return async function rateLimitPlugin(fastify: any) {
    // Registruj @fastify/rate-limit
    try {
      const fastifyRateLimit = await import('@fastify/rate-limit');
      await fastify.register(fastifyRateLimit.default, {
        max: rateLimitConfig.general.max,
        timeWindow: rateLimitConfig.general.timeWindow,
        skipOnError: true,
        redis: getRedisClient(), // Použije Redis pro storage
      });
    } catch (error) {
      console.warn('Rate limit plugin registration failed:', error);
      // Fallback bez rate limiting
    }
  };
};

/**
 * GraphQL rate limit middleware
 */
export const graphqlRateLimitMiddleware = () => {
  const limiter = new GraphQLRateLimiter();

  return async (req: any, res: any, next: () => void) => {
    try {
      // Získej identifier (user ID nebo IP)
      const userId = req.user?.id;
      const identifier = userId || req.ip || 'anonymous';
      const isAuthenticated = !!userId;

      const result = await limiter.checkLimit(identifier, isAuthenticated);

      // Přidej headers
      res.header('X-RateLimit-Limit', isAuthenticated ? '200' : '50');
      res.header('X-RateLimit-Remaining', result.remaining.toString());
      res.header('X-RateLimit-Reset', result.resetTime.toString());

      if (!result.allowed) {
        return res.status(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter: result.resetTime - Math.floor(Date.now() / 1000),
        });
      }

      next();
    } catch (error) {
      console.error('Rate limit middleware error:', error);
      // Při chybě pokračuj
      next();
    }
  };
};
