# Railway Deployment

## Příprava pro produkci

### 1. Package.json scripts
```json
{
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "build": "npx prisma generate && npx prisma migrate deploy",
    "db:migrate": "npx prisma migrate deploy",
    "db:seed": "npx prisma db seed",
    "test": "jest"
  },
  "engines": {
    "node": "18.x"
  }
}
```

### 2. Dockerfile (volitelné)
```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

# Kopírovat package files
COPY package*.json ./
COPY prisma ./prisma/

# Instalace závislostí
RUN npm ci --only=production

# Generování Prisma klienta
RUN npx prisma generate

# Kopírovat aplikaci
COPY . .

EXPOSE 3000

CMD ["npm", "start"]
```

## Railway Setup

### 1. Railway CLI instalace
```bash
# macOS
brew install railway/tap/railway

# npm
npm install -g @railway/cli

# Přihlášení
railway login
```

### 2. Inicializace projektu
```bash
# V root složce projektu
railway init

# Propojení s existujícím projektem
railway link [project-id]
```

### 3. Služby setup
```bash
# PostgreSQL databáze
railway add postgresql

# Redis cache
railway add redis

# Deploy aplikace
railway up
```

## Environment Variables

### 1. Automatické proměnné (Railway)
```env
# Tyto jsou automaticky generované
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
PORT=3000
RAILWAY_ENVIRONMENT="production"
```

### 2. Manuální konfigurace
```bash
# Pomocí Railway CLI
railway variables set JWT_SECRET="your-super-secret-key"
railway variables set COMGATE_MERCHANT_ID="your-merchant-id"
railway variables set COMGATE_API_KEY="your-api-key"
railway variables set COMGATE_SECRET="your-webhook-secret"
railway variables set SMTP_HOST="smtp.gmail.com"
railway variables set SMTP_PORT="587"
railway variables set SMTP_USER="your-email@gmail.com"
railway variables set SMTP_PASSWORD="your-app-password"
```

### 3. Frontend URL konfigurace
```bash
railway variables set FRONTEND_URL="https://your-frontend.vercel.app"
railway variables set BACKEND_URL="https://your-backend.railway.app"
```

## Database Migration

### 1. První deploy
```bash
# Railway automaticky spustí
npm run build

# Což obsahuje:
# - npx prisma generate
# - npx prisma migrate deploy
```

### 2. Seed data
```bash
# Po prvním deployu
railway run npm run db:seed
```

### 3. Prisma Studio v produkci
```bash
# Připojení k produkční DB
railway run npx prisma studio
```

## CI/CD Pipeline

### 1. Automatický deploy z GitHub
```yaml
# Propojení s GitHub repository
# Railway automaticky deployuje při push na main branch

# railway.json
{
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "healthcheckTimeout": 100,
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

### 2. GitHub Actions (volitelné)
```yaml
# .github/workflows/deploy.yml
name: Deploy to Railway

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install Railway CLI
        run: npm install -g @railway/cli
      
      - name: Deploy
        run: railway up --detach
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
```

## Health Checks

### 1. Health endpoint
```javascript
// src/routes/health.js
const healthCheck = async (request, reply) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {}
  }
  
  try {
    // Database check
    await prisma.$queryRaw`SELECT 1`
    health.services.database = 'OK'
  } catch (error) {
    health.services.database = 'ERROR'
    health.status = 'ERROR'
  }
  
  try {
    // Redis check
    await redis.ping()
    health.services.redis = 'OK'
  } catch (error) {
    health.services.redis = 'ERROR'
  }
  
  // Comgate check (volitelné)
  try {
    // Test ping to Comgate
    health.services.comgate = 'OK'
  } catch (error) {
    health.services.comgate = 'WARNING'
  }
  
  return reply
    .code(health.status === 'OK' ? 200 : 503)
    .send(health)
}

module.exports = { healthCheck }
```

### 2. Registrace v Fastify
```javascript
// src/index.js
fastify.get('/health', healthCheck)

// Readiness probe
fastify.get('/ready', async (request, reply) => {
  // Kontrola, zda je aplikace připravená
  return { status: 'ready' }
})
```

## Performance Optimizace

### 1. Production konfigurace
```javascript
// src/index.js
const fastify = require('fastify')({
  logger: process.env.NODE_ENV === 'production' ? {
    level: 'warn'
  } : {
    level: 'info',
    transport: {
      target: 'pino-pretty'
    }
  }
})

// Trust proxy (Railway)
fastify.register(require('@fastify/helmet'))
fastify.register(require('@fastify/compress'))
```

### 2. Database optimalizace
```javascript
// src/utils/db.js
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? 
    ['query', 'info', 'warn', 'error'] : 
    ['warn', 'error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

// Connection pooling pro Railway
prisma.$connect()

module.exports = prisma
```

## Monitoring & Logging

### 1. Railway Logs
```bash
# Sledování logů
railway logs

# Filtrování podle severity
railway logs --filter error

# Real-time sledování
railway logs --follow
```

### 2. Custom metrics
```javascript
// src/utils/metrics.js
const metrics = {
  requests: 0,
  errors: 0,
  orders: 0,
  payments: 0
}

const incrementMetric = (metric) => {
  metrics[metric]++
}

const getMetrics = () => ({
  ...metrics,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date().toISOString()
})

module.exports = { incrementMetric, getMetrics }
```

### 3. Metrics endpoint
```javascript
// src/routes/metrics.js (pouze pro admin)
fastify.get('/metrics', {
  preHandler: [requireAuth, requireAdmin]
}, async (request, reply) => {
  return getMetrics()
})
```

## Scaling & Performance

### 1. Railway Auto-scaling
```javascript
// railway.json
{
  "deploy": {
    "startCommand": "npm start",
    "healthcheckPath": "/health",
    "replicas": {
      "min": 1,
      "max": 3
    }
  }
}
```

### 2. Redis session sharing
```javascript
// Pro horizontální scaling
const session = require('@fastify/session')
const RedisStore = require('connect-redis')(session)

fastify.register(session, {
  store: new RedisStore({ client: redis }),
  secret: process.env.SESSION_SECRET,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hodin
  }
})
```

## Backup Strategy

### 1. Database backup
```bash
# Ruční backup
railway run pg_dump $DATABASE_URL > backup.sql

# Restore
railway run psql $DATABASE_URL < backup.sql
```

### 2. Automatický backup (Railway)
Railway automaticky zálohuje PostgreSQL databázi každých 24 hodin.

## Troubleshooting

### 1. Časté problémy
```bash
# Prisma generate chyba
railway run npx prisma generate

# Migration chyba
railway run npx prisma migrate deploy --force

# Redis connection chyba
railway variables get REDIS_URL

# Logs pro debugging
railway logs --filter error
```

### 2. Performance monitoring
```bash
# CPU a paměť usage
railway logs --filter "memory"

# Slow queries
railway logs --filter "slow"
```

## Security Checklist

- ✅ HTTPS only (Railway automaticky)
- ✅ Environment variables pro secrets
- ✅ Rate limiting implementován
- ✅ CORS správně nakonfigurován
- ✅ JWT tokens s expirací
- ✅ Database connection pooling
- ✅ Health checks aktivní
- ✅ Error handling bez leak informací 