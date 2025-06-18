import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Initialize Prisma Client
const prisma = new PrismaClient();

// Create Fastify instance
const fastify = Fastify({
  logger: process.env.NODE_ENV === 'development',
});

// Health check endpoint
fastify.get('/health', async () => {
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  };
});

// Test database connection
fastify.get('/db-test', async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { database: 'connected' };
  } catch (error) {
    return {
      database: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  try {
    await prisma.$disconnect();
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

// Start server
const start = async (): Promise<void> => {
  try {
    const port = Number(process.env.PORT) || 4000;
    const host = process.env.HOST || '0.0.0.0';

    await fastify.listen({ port, host });
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`📊 Health check: http://${host}:${port}/health`);
    console.log(`🗄️  Database test: http://${host}:${port}/db-test`);
  } catch (error) {
    fastify.log.error(error);
    process.exit(1);
  }
};

start();
