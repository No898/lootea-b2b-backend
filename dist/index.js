import Fastify from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import dotenv from 'dotenv';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './resolvers/index.js';
import { createContext } from './context.js';
dotenv.config();
const prisma = new PrismaClient();
const fastify = Fastify({
    logger: process.env.NODE_ENV === 'development',
});
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
    return result;
});
const gracefulShutdown = async () => {
    try {
        await prisma.$disconnect();
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