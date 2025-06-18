const { PrismaClient } = require('@prisma/client');
const Redis = require('ioredis');

async function testConnections() {
    console.log('🔍 Testování připojení k Railway službám...\n');

    // Použij PUBLIC URLs pro externí připojení
    const DATABASE_URL = process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL;
    const REDIS_URL = process.env.REDIS_PUBLIC_URL || process.env.REDIS_URL;

    console.log('🔍 Environment variables:');
    console.log('DATABASE_URL:', DATABASE_URL ? 'SET' : 'NOT SET');
    console.log('REDIS_URL:', REDIS_URL ? 'SET' : 'NOT SET');
    console.log('');

    // Test PostgreSQL připojení
    console.log('📊 Testování PostgreSQL připojení...');
    const prisma = new PrismaClient({
        datasources: {
            db: {
                url: DATABASE_URL
            }
        }
    });

    try {
        await prisma.$connect();
        console.log('✅ PostgreSQL připojení úspěšné!');

        // Test základní query
        const result = await prisma.$queryRaw`SELECT version()`;
        console.log('📋 PostgreSQL verze:', result[0].version);

    } catch (error) {
        console.error('❌ PostgreSQL připojení selhalo:', error.message);
    } finally {
        await prisma.$disconnect();
    }

    console.log('\n🔴 Testování Redis připojení...');

    // Test Redis připojení
    const redis = new Redis(REDIS_URL || 'redis://localhost:6379');

    try {
        await redis.ping();
        console.log('✅ Redis připojení úspěšné!');

        // Test základní operace
        await redis.set('test-key', 'test-value');
        const value = await redis.get('test-key');
        console.log('📋 Redis test:', value === 'test-value' ? 'OK' : 'FAILED');

        // Cleanup
        await redis.del('test-key');

    } catch (error) {
        console.error('❌ Redis připojení selhalo:', error.message);
    } finally {
        redis.disconnect();
    }

    console.log('\n🎉 Test připojení dokončen!');
}

// Spuštění testu
testConnections().catch(console.error); 