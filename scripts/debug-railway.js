#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function debugRailway() {
    console.log('🔍 Railway Environment Debug');
    console.log('============================');

    console.log('\n📊 Environment Variables:');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('PORT:', process.env.PORT);
    console.log('HOST:', process.env.HOST);
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Set' : '❌ Missing');

    console.log('\n📁 File System Check:');

    const checkFile = (filePath) => {
        const exists = fs.existsSync(filePath);
        console.log(`${exists ? '✅' : '❌'} ${filePath}`);
        return exists;
    };

    checkFile('./dist/index.js');
    checkFile('./dist/schema/typeDefs.js');
    checkFile('./dist/resolvers/index.js');
    checkFile('./dist/context.js');

    console.log('\n🔧 Module Resolution Test:');
    try {
        const typeDefs = await import('../dist/schema/typeDefs.js');
        console.log('✅ typeDefs import successful');
    } catch (error) {
        console.log('❌ typeDefs import failed:', error.message);
    }

    try {
        const resolvers = await import('../dist/resolvers/index.js');
        console.log('✅ resolvers import successful');
    } catch (error) {
        console.log('❌ resolvers import failed:', error.message);
    }

    console.log('\n🎯 Recommendations:');
    if (process.env.NODE_ENV !== 'production') {
        console.log('⚠️  Set NODE_ENV=production');
    }
    if (!process.env.PORT) {
        console.log('⚠️  Set PORT environment variable');
    }
    if (!process.env.HOST) {
        console.log('⚠️  Set HOST=0.0.0.0 for Railway');
    }
}

// Spuštění debug funkce
debugRailway().catch(console.error); 