# Instalace a nastavení

## Požadavky systému

- **Node.js** 18+ 
- **PostgreSQL** 13+
- **Redis** 6+
- **npm** nebo **yarn**

## Quick Start

### 1. Klonování a instalace
```bash
git clone <repository-url>
cd b2b-eshop-backend
npm install
```

### 2. Nastavení prostředí
```bash
cp .env.example .env
```

### 3. Databáze
```bash
# Migrace databáze
npx prisma migrate dev

# Seed data (volitelné)
npx prisma db seed
```

### 4. Spuštění
```bash
# Development mode
npm run dev

# Production mode  
npm start
```

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/b2b_eshop"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-refresh-secret"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Comgate V2 REST API
COMGATE_MERCHANT_ID="your-merchant-id"
COMGATE_API_KEY="your-api-key"
COMGATE_SECRET="your-webhook-secret"
COMGATE_TEST_MODE=true

# Email
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
EMAIL_FROM="B2B E-shop <noreply@yoursite.com>"

# Server
PORT=3000
NODE_ENV="development"
```

## Verifikace instalace

Po spuštění by měly být dostupné:
- **GraphQL API:** http://localhost:3000/graphql
- **Health check:** http://localhost:3000/health
- **GraphQL Playground:** http://localhost:3000/graphiql

## Troubleshooting

### Database connection error
```bash
# Zkontroluj, zda běží PostgreSQL
sudo service postgresql status

# Vytvoř databázi pokud neexistuje
createdb b2b_eshop
```

### Redis connection error
```bash
# Spuštění Redis
redis-server

# Test connection
redis-cli ping
``` 