# Nastavení prostředí

## Development Environment

### Fastify Server
```javascript
// src/index.js
const fastify = require('fastify')({
  logger: true
})

// GraphQL endpoint
fastify.register(require('mercurius'), {
  schema,
  resolvers,
  graphiql: true, // GraphQL Playground
  path: '/graphql'
})

// Port configuration
const PORT = process.env.PORT || 3000
fastify.listen({ port: PORT, host: '0.0.0.0' })
```

### Hot Reload s Nodemon
```json
// package.json scripts
{
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "db:migrate": "npx prisma migrate dev",
    "db:seed": "npx prisma db seed",
    "db:studio": "npx prisma studio"
  }
}
```

### Prisma Development
```bash
# Prisma Studio - GUI pro databázi
npx prisma studio

# Generování Prisma klienta
npx prisma generate

# Reset databáze
npx prisma migrate reset
```

## Production Environment (Railway)

### Environment Variables
Railway automaticky detekuje tyto proměnné:
```env
DATABASE_URL          # Automaticky z Railway PostgreSQL
REDIS_URL            # Automaticky z Railway Redis
JWT_SECRET           # Nastav ručně
COMGATE_MERCHANT_ID  # Nastav ručně
COMGATE_API_KEY      # V2 REST API klíč
COMGATE_SECRET       # Webhook secret
SMTP_USER           # Nastav ručně
SMTP_PASSWORD       # Nastav ručně
NODE_ENV=production  # Nastav ručně
```

### Database Migrations
```bash
# Railway automaticky spustí při deployu
npm run db:migrate
```

### Health Check
```javascript
// src/routes/health.js
fastify.get('/health', async (request, reply) => {
  const health = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    services: {
      database: await checkDatabase(),
      redis: await checkRedis()
    }
  }
  
  return health
})
```

## Redis Configuration

### Development
```javascript
// src/utils/redis.js
const Redis = require('ioredis')

const redis = new Redis({
  host: 'localhost',
  port: 6379,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3
})

module.exports = redis
```

### Session Storage
```javascript
// JWT token blacklist
const invalidateToken = async (token) => {
  await redis.set(`blacklist:${token}`, 'true', 'EX', 3600)
}

// Cart storage
const saveCart = async (userId, cart) => {
  await redis.set(`cart:${userId}`, JSON.stringify(cart), 'EX', 86400)
}
```

## Logging Configuration

### Development
```javascript
const fastify = require('fastify')({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true
      }
    }
  }
})
```

### Production
```javascript
const fastify = require('fastify')({
  logger: {
    level: 'warn',
    serializers: {
      req: (req) => ({
        method: req.method,
        url: req.url,
        headers: req.headers
      })
    }
  }
})
```

## CORS Configuration

```javascript
// src/plugins/cors.js
const cors = require('@fastify/cors')

fastify.register(cors, {
  origin: [
    'http://localhost:3000',  // Next.js dev
    'https://yourfrontend.com' // Production frontend
  ],
  credentials: true
})
``` 