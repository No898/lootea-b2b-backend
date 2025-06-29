import { getRedisClient } from './redis.js';
export const rateLimitConfig = {
    graphql: {
        max: 100,
        timeWindow: '1 minute',
        skipOnError: true,
    },
    auth: {
        max: 10,
        timeWindow: '1 minute',
        skipOnError: true,
    },
    general: {
        max: 200,
        timeWindow: '1 minute',
        skipOnError: true,
    },
};
export class GraphQLRateLimiter {
    redis = getRedisClient();
    async checkLimit(identifier, isAuthenticated = false) {
        try {
            const limit = isAuthenticated ? 200 : 50;
            const window = 60;
            const key = `rate_limit:graphql:${identifier}`;
            const now = Math.floor(Date.now() / 1000);
            const windowStart = now - window;
            const pipeline = this.redis.pipeline();
            pipeline.zremrangebyscore(key, 0, windowStart);
            pipeline.zcard(key);
            pipeline.zadd(key, now, `${now}-${Math.random()}`);
            pipeline.expire(key, window);
            const results = await pipeline.exec();
            if (!results) {
                return { allowed: true, remaining: limit, resetTime: now + window };
            }
            const currentCount = results[1][1] || 0;
            const allowed = currentCount < limit;
            const remaining = Math.max(0, limit - currentCount - 1);
            return {
                allowed,
                remaining,
                resetTime: now + window,
            };
        }
        catch (error) {
            console.error('Rate limiter error:', error);
            return { allowed: true, remaining: 100, resetTime: Date.now() + 60000 };
        }
    }
}
export const createRateLimitPlugin = () => {
    return async function rateLimitPlugin(fastify) {
        try {
            const fastifyRateLimit = await import('@fastify/rate-limit');
            await fastify.register(fastifyRateLimit.default, {
                max: rateLimitConfig.general.max,
                timeWindow: rateLimitConfig.general.timeWindow,
                skipOnError: true,
                redis: getRedisClient(),
            });
        }
        catch (error) {
            console.warn('Rate limit plugin registration failed:', error);
        }
    };
};
export const graphqlRateLimitMiddleware = () => {
    const limiter = new GraphQLRateLimiter();
    return async (req, res, next) => {
        try {
            const userId = req.user?.id;
            const identifier = userId || req.ip || 'anonymous';
            const isAuthenticated = !!userId;
            const result = await limiter.checkLimit(identifier, isAuthenticated);
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
        }
        catch (error) {
            console.error('Rate limit middleware error:', error);
            next();
        }
    };
};
//# sourceMappingURL=rateLimit.js.map