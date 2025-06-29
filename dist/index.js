import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { createContext } from './context.js';
import { testRedisConnection, disconnectRedis } from './utils/redis.js';
import { getCorsConfig } from './utils/cors.js';
import { createRateLimitPlugin } from './utils/rateLimit.js';
import { getEmailService } from './utils/email.js';
dotenv.config();
const prisma = new PrismaClient();
const fastify = Fastify({
    logger: process.env.NODE_ENV === 'development',
});
const registerPlugins = async () => {
    try {
        const fastifyCors = await import('@fastify/cors');
        await fastify.register(fastifyCors.default, getCorsConfig());
        await fastify.register(createRateLimitPlugin());
        console.log('✅ Fastify plugins registered');
    }
    catch (error) {
        console.error('❌ Plugin registration failed:', error);
    }
};
await registerPlugins();
fastify.get('/health', async () => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        services: {
            database: 'checking...',
            graphql: 'ok',
        },
    };
});
fastify.get('/db-test', async () => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        return {
            database: 'connected',
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        fastify.log.error('Database connection failed:', error);
        return {
            database: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
});
fastify.get('/health/detailed', async () => {
    const result = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        services: {
            graphql: 'ok',
            database: 'unknown',
            redis: 'unknown',
            email: 'unknown',
        },
    };
    try {
        await prisma.$queryRaw `SELECT 1`;
        result.services.database = 'connected';
    }
    catch (error) {
        result.services.database = 'error';
        result.status = 'degraded';
    }
    try {
        const redisOk = await testRedisConnection();
        result.services.redis = redisOk ? 'connected' : 'error';
        if (!redisOk) {
            result.status = 'degraded';
        }
    }
    catch (error) {
        result.services.redis = 'error';
        result.status = 'degraded';
    }
    try {
        const emailService = getEmailService();
        const emailOk = await emailService.testConnection();
        result.services.email = emailOk ? 'connected' : 'configured';
    }
    catch (error) {
        result.services.email = 'error';
    }
    return result;
});
fastify.get('/health/redis', async () => {
    try {
        const isConnected = await testRedisConnection();
        return {
            redis: isConnected ? 'connected' : 'error',
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        return {
            redis: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString(),
        };
    }
});
fastify.post('/webhooks/comgate', async (request, reply) => {
    try {
        const webhookData = request.body;
        console.log('🔔 Comgate webhook received:', {
            transId: webhookData.transId,
            status: webhookData.status,
            refId: webhookData.refId,
        });
        const { getComgateClient } = await import('./utils/comgate.js');
        const comgate = getComgateClient();
        if (!comgate.verifyWebhook(webhookData)) {
            console.error('❌ Invalid webhook signature');
            return reply.code(400).send({ error: 'Invalid signature' });
        }
        const order = await prisma.order.findUnique({
            where: { id: webhookData.refId },
            include: { user: true },
        });
        if (!order) {
            console.error('❌ Order not found:', webhookData.refId);
            return reply.code(404).send({ error: 'Order not found' });
        }
        if (order.paymentId !== webhookData.transId) {
            console.error('❌ Payment ID mismatch:', {
                orderPaymentId: order.paymentId,
                webhookTransId: webhookData.transId,
            });
            return reply.code(400).send({ error: 'Payment ID mismatch' });
        }
        const { mapComgateStatusToOrderStatus } = await import('./utils/comgate.js');
        const newStatus = mapComgateStatusToOrderStatus(webhookData.status);
        if (order.status !== newStatus) {
            const updateData = {
                status: newStatus,
                paymentMethod: webhookData.method,
            };
            if (webhookData.status === 'PAID' && !order.paidAt) {
                updateData.paidAt = new Date();
            }
            await prisma.order.update({
                where: { id: order.id },
                data: updateData,
            });
            const { cache } = await import('./utils/redis.js');
            await cache.invalidatePattern(`orders:user:${order.userId}:*`);
            await cache.invalidatePattern('orders:admin:*');
            await cache.invalidatePattern('analytics:*');
            console.log(`✅ Order ${order.orderNumber} payment status updated: ${order.status} → ${newStatus}`);
            try {
                const { getEmailService, createOrderEmailData, createPaymentEmailData, } = await import('./utils/email.js');
                const emailService = getEmailService();
                if (webhookData.status === 'PAID') {
                    const paymentEmailData = createPaymentEmailData({
                        ...order,
                        user: order.user,
                    });
                    emailService
                        .sendPaymentConfirmation(paymentEmailData)
                        .catch(console.error);
                }
                else if (webhookData.status === 'CANCELLED') {
                    const orderEmailData = createOrderEmailData({
                        ...order,
                        user: order.user,
                        items: [],
                    });
                    emailService.sendOrderCancelled(orderEmailData).catch(console.error);
                }
            }
            catch (emailError) {
                console.error('❌ Failed to send status change email:', emailError);
            }
        }
        return reply.send({
            success: true,
            message: 'Webhook processed successfully',
        });
    }
    catch (error) {
        console.error('❌ Webhook processing error:', error);
        return reply.code(500).send({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error',
        });
    }
});
const gracefulShutdown = async () => {
    try {
        await prisma.$disconnect();
        await disconnectRedis();
        await fastify.close();
        console.log('Server shut down gracefully');
        process.exit(0);
    }
    catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
    }
};
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);
const start = async () => {
    try {
        if (!process.env.JWT_SECRET) {
            throw new Error('JWT_SECRET environment variable is required');
        }
        const port = Number(process.env.PORT) || Number(process.env.REST_PORT) || 3000;
        const restPort = port;
        const graphqlPort = port + 1;
        const host = process.env.HOST || '0.0.0.0';
        await fastify.listen({ port: restPort, host });
        console.log('🔧 REST API server running on http://%s:%d', host, restPort);
        console.log('📊 Health check: http://%s:%d/health', host, restPort);
        console.log('📊 Detailed health: http://%s:%d/health/detailed', host, restPort);
        console.log('🗄️  Database test: http://%s:%d/db-test', host, restPort);
        console.log('🔴 Redis test: http://%s:%d/health/redis', host, restPort);
        const apollo = new ApolloServer({
            typeDefs,
            resolvers,
        });
        const { url } = await startStandaloneServer(apollo, {
            listen: { port: graphqlPort, host },
            context: createContext(prisma),
        });
        console.log('🚀 GraphQL server ready at:', url);
        console.log('🎮 GraphQL Playground available at:', url);
        console.log('\n🎯 Summary:');
        console.log('   REST API: http://%s:%d', host, restPort);
        console.log('   GraphQL:  %s', url);
    }
    catch (error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
};
start();
//# sourceMappingURL=index.js.map