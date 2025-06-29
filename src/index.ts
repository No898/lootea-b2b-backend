import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';

import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { createContext } from './context.js';
import {
  testRedisConnection,
  disconnectRedis,
  connectRedis,
} from './utils/redis.js';
import { getCorsConfig } from './utils/cors.js';
import { createRateLimitPlugin } from './utils/rateLimit.js';
import { getEmailService } from './utils/email.js';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Fastify instance for REST endpoints
const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development',
});

// Register plugins before defining routes
const registerPlugins = async () => {
  try {
    // CORS
    const fastifyCors = await import('@fastify/cors');
    await fastify.register(fastifyCors.default, getCorsConfig());

    // Rate limiting
    await fastify.register(createRateLimitPlugin());

    console.log('✅ Fastify plugins registered');
  } catch (error) {
    console.error('❌ Plugin registration failed:', error);
  }
};

// Register plugins immediately (před definováním routes)
await registerPlugins();

// Health check endpoint (REST)
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

// Database test endpoint (REST)
fastify.get('/db-test', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      database: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    fastify.log.error('Database connection failed:', error);
    return {
      database: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
});

// Enhanced health check with DB, Redis and Email test
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
    await prisma.$queryRaw`SELECT 1`;
    result.services.database = 'connected';
  } catch {
    result.services.database = 'error';
    result.status = 'degraded';
  }

  try {
    const redisOk = await testRedisConnection();
    result.services.redis = redisOk ? 'connected' : 'error';
    if (!redisOk) {
      result.status = 'degraded';
    }
  } catch {
    result.services.redis = 'error';
    result.status = 'degraded';
  }

  try {
    const emailService = getEmailService();
    const emailOk = await emailService.testConnection();
    result.services.email = emailOk ? 'connected' : 'configured';
  } catch {
    result.services.email = 'error';
    // Email není kritický pro provoz, takže nezhoršujeme status
  }

  return result;
});

// Redis-specific health check
fastify.get('/health/redis', async () => {
  try {
    const isConnected = await testRedisConnection();
    return {
      redis: isConnected ? 'connected' : 'error',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      redis: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
});

// Comgate webhook endpoint
fastify.post('/webhooks/comgate', async (request, reply) => {
  try {
    const webhookData = request.body as any;

    console.log('🔔 Comgate webhook received:', {
      transId: webhookData.transId,
      status: webhookData.status,
      refId: webhookData.refId,
    });

    // Import zde kvůli circular dependency
    const { getComgateClient } = await import('./utils/comgate.js');
    const comgate = getComgateClient();

    // Verifikace webhook podpisu
    if (!comgate.verifyWebhook(webhookData)) {
      console.error('❌ Invalid webhook signature');
      return reply.code(400).send({ error: 'Invalid signature' });
    }

    // Najdeme objednávku podle refId
    const order = await prisma.order.findUnique({
      where: { id: webhookData.refId },
      include: { user: true },
    });

    if (!order) {
      console.error('❌ Order not found:', webhookData.refId);
      return reply.code(404).send({ error: 'Order not found' });
    }

    // Kontrola, zda payment ID odpovídá
    if (order.paymentId !== webhookData.transId) {
      console.error('❌ Payment ID mismatch:', {
        orderPaymentId: order.paymentId,
        webhookTransId: webhookData.transId,
      });
      return reply.code(400).send({ error: 'Payment ID mismatch' });
    }

    // Import mapování statusů
    const { mapComgateStatusToOrderStatus } = await import(
      './utils/comgate.js'
    );
    const newStatus = mapComgateStatusToOrderStatus(webhookData.status);

    // Aktualizace objednávky pouze pokud se status změnil
    if (order.status !== newStatus) {
      const updateData: any = {
        status: newStatus,
        paymentMethod: webhookData.method,
      };

      // Nastavení paidAt při úspěšné platbě
      if (webhookData.status === 'PAID' && !order.paidAt) {
        updateData.paidAt = new Date();
      }

      await prisma.order.update({
        where: { id: order.id },
        data: updateData,
      });

      // Invalidace cache
      const { cache } = await import('./utils/redis.js');
      await cache.invalidatePattern(`orders:user:${order.userId}:*`);
      await cache.invalidatePattern('orders:admin:*');
      await cache.invalidatePattern('analytics:*');

      console.log(
        `✅ Order ${order.orderNumber} payment status updated: ${order.status} → ${newStatus}`
      );

      // Poslání email notifikace o změně stavu platby
      try {
        const {
          getEmailService,
          createOrderEmailData,
          createPaymentEmailData,
        } = await import('./utils/email.js');
        const emailService = getEmailService();

        if (webhookData.status === 'PAID') {
          // Email potvrzení platby
          const paymentEmailData = createPaymentEmailData({
            ...order,
            user: order.user,
          });
          emailService
            .sendPaymentConfirmation(paymentEmailData)
            .catch(console.error);
        } else if (webhookData.status === 'CANCELLED') {
          // Email o zrušení
          const orderEmailData = createOrderEmailData({
            ...order,
            user: order.user,
            items: [], // Webhook nemá items, ale pro email template to není kritické
          });
          emailService.sendOrderCancelled(orderEmailData).catch(console.error);
        }
      } catch (emailError) {
        console.error('❌ Failed to send status change email:', emailError);
      }
    }

    return reply.send({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    return reply.code(500).send({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
    await disconnectRedis();
    await fastify.close();
    console.log('Server shut down gracefully');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start both servers
const start = async (): Promise<void> => {
  try {
    // Připojení k externím službám
    await connectRedis();

    // Test emailového připojení bez přerušení startu
    const emailService = getEmailService();
    await emailService.testConnection().catch(() => {
      console.warn(
        '⚠️  SMTP není nakonfigurováno. Odesílání e-mailů nebude fungovat.'
      );
    });

    // Validace environment variables
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET environment variable is required');
    }

    // Railway používá PORT proměnnou
    const port =
      Number(process.env.PORT) || Number(process.env.REST_PORT) || 3003;
    const restPort = port;
    const graphqlPort = port + 1; // GraphQL na dalším portu
    const host = process.env.HOST || '0.0.0.0'; // Railway potřebuje 0.0.0.0

    // Start Fastify server pro REST endpoints
    await fastify.listen({ port: restPort, host });
    console.log('🔧 REST API server running on http://%s:%d', host, restPort);
    console.log('📊 Health check: http://%s:%d/health', host, restPort);
    console.log(
      '📊 Detailed health: http://%s:%d/health/detailed',
      host,
      restPort
    );
    console.log('🗄️  Database test: http://%s:%d/db-test', host, restPort);
    console.log('🔴 Redis test: http://%s:%d/health/redis', host, restPort);

    // Apollo Server 4 Standalone Server (oficiální způsob 2025)
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
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
};

start();
