# 🚀 B2B Bubble Tea E-shop Backend - Komplexní TODO

## 📊 Přehled projektu
- **Celkový odhad:** 6-8 týdnů (240-320 hodin)
- **Tech stack:** Node.js + Fastify + GraphQL (Apollo Server) + JWT + Redis + PostgreSQL (Prisma) + Comgate V2
- **Cíl:** Připravit backend tak, aby frontend vývojář měl minimum práce

---

## 🗓️ Fáze 1: Databáze a základní infrastruktura (Týden 1-2)

### ✅ Hotovo
- [x] Základní package.json s dependencies
- [x] Základní Prisma schema (rozšířené pro B2B)
- [x] Dokumentace v Docusaurus
- [x] TypeScript konfigurace (tsconfig.json)
- [x] Docker Compose pro lokální development
- [x] Prisma migrace a seed data
- [x] Základní Fastify server v TypeScript
- [x] Health check a DB test endpointy
- [x] ESLint + TypeScript parser setup

### 🔄 Week 1: Railway setup a databázové modely

#### 🚀 Railway a CI/CD setup (10-12 hodin) - **PRIORITA #1**
- [x] **Railway projekt setup**
  - [x] Vytvoření Railway účtu a projektu
  - [x] GitHub repository propojení
  - [x] PostgreSQL databáze provision (production + test)
  - [x] Redis addon přidání
- [x] **CI/CD pipeline s testy**
  - [x] GitHub Actions workflow (.github/workflows/ci.yml)
  - [x] Test databáze setup v CI (PostgreSQL service)
  - [x] Lint + Format + Test + Deploy pipeline
  - [x] Deploy pouze pokud všechny testy prošly
- [x] **Environment konfigurace**
  - [x] `.env.example` template
  - [x] Railway environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET)
  - [x] Test environment variables (TEST_DATABASE_URL)
  - [x] Environment validation (joi/zod)
- [x] **Základní deployment test**
  - [x] Minimální Fastify server
  - [x] Health check endpoint
  - [x] Successful deployment verification

#### 🧪 Testing infrastruktura (8-10 hodin) - **PRIORITA #2**
- [ ] **Testing setup**
  - [ ] Jest konfigurace (jest.config.js, jest.e2e.config.js)
  - [ ] Test databáze setup a cleanup
  - [ ] Test utilities a helpers
  - [ ] Fake data generators (@faker-js/faker)
- [ ] **Code quality tools**
  - [ ] ESLint konfigurace (.eslintrc.js)
  - [ ] Prettier konfigurace (.prettierrc)
  - [ ] Husky pre-commit hooks
  - [ ] lint-staged konfigurace
- [ ] **Test struktura**
  - [ ] `tests/unit/` - unit testy
  - [ ] `tests/integration/` - integration testy
  - [ ] `tests/e2e/` - end-to-end testy
  - [ ] `tests/fixtures/` - test data
  - [ ] `tests/helpers/` - test utilities
- [ ] **Základní testy**
  - [ ] Health check endpoint test
  - [ ] Database connection test
  - [ ] Environment validation test

#### ✅ Rozšíření Prisma Schema (8-12 hodin) - **HOTOVO**
- [x] **Kategorie produktů** - model Category s hierarchií
  - [x] Enum pro typy: SIRUPY, TOPPINGS, PRASKY_SMESI, VYBAVENI, CAJE
  - [ ] Podpora pro subcategories (parent/children vztah) - zatím nepotřeba
- [x] **Rozšířený Product model** 
  - [x] Kategorie vztah (categoryId)
  - [x] Jednotky (unit: KS/BAL/KG/L, packageSize)
  - [x] Inventory (inStock boolean)
  - [x] SEO fields (slug)
- [x] **B2B User model rozšíření**
  - [x] Role enum (B2B_CUSTOMER, ADMIN)
  - [x] Firemní údaje (companyName, ico, dic, address)
  - [x] Status (isActive) - bez schvalování
- [x] **Individuální ceny - CustomPrice model**
  - [x] Vztah User <-> Product s custom cenou
  - [ ] Platnost ceny (validFrom, validTo) - zatím nepotřeba
- [x] **Detailní Order system**
  - [x] Status enum (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  - [x] Shipping info (address, method, cost)
  - [x] Payment info (paymentId, paymentMethod, paidAt)
- [ ] **Email templates a logs** - pro později
  - [ ] EmailTemplate model (typ, subject, body)
  - [ ] EmailLog model (tracking odeslaných emailů)

#### 🔄 Database setup na Railway (4-6 hodin) - **ČÁSTEČNĚ HOTOVO**
- [x] **Prisma konfigurace**
  - [x] Database URL z Railway (lokálně přes Docker)
  - [x] Prisma migrate na databázi
  - [x] Seed data (kategorie, admin user, testovací produkty)
  - [x] Prisma Studio přístup k databázi
- [ ] **Railway production setup** - zatím jen lokální Docker

### 🔄 Week 2: Základní server infrastruktura

#### ✅ Fastify + Apollo Server setup (12-16 hodin) - **HOTOVO**
- [x] **Základní server struktura**
  - [x] `src/index.ts` - entry point s Fastify (TypeScript)
  - [x] `src/utils/` - helper funkce (auth, redis, cors, rateLimit)
  - [x] Apollo Server 4 standalone setup
- [x] **Apollo Server integrace**
  - [x] Apollo Server 4 setup standalone
  - [x] GraphQL schema definice (typeDefs)
  - [x] Context setup (user z JWT)
  - [x] Apollo Studio v development
- [x] **Middleware a pluginy**
  - [x] JWT authentication middleware
  - [x] CORS konfigurace
  - [x] Rate limiting (pro GraphQL endpoint)
  - [x] Request logging
  - [x] Error handling
- [x] **Redis integrace**
  - [x] Redis client setup
  - [x] Cache helper funkce
  - [x] Session storage ready
- [x] **Health check endpoints**
  - [x] `/health` - základní health check
  - [x] `/db-test` - database connectivity
  - [x] `/health/redis` - redis connectivity
  - [x] `/health/detailed` - kompletní check

---

## 🗓️ Fáze 2: GraphQL API a autentizace (Týden 3-4)

### ✅ Week 3: GraphQL schema a základní resolvers - **HOTOVO**

#### ✅ GraphQL schema definice (16-20 hodin) - **HOTOVO**
- [x] **GraphQL typy podle dokumentace**
  - [x] User, Customer, Admin typy
  - [x] Product, Category, CustomerPrice typy
  - [x] Order, OrderItem, OrderStatus typy
  - [x] Input typy pro mutations
  - [x] Enum typy (Role, OrderStatus, Category, Unit)
  - [x] Analytics typy (UserStats, OrderStats, RevenueStats)
  - [x] Bulk operation typy
- [x] **Query resolvers**
  - [x] `products` - s filtry (kategorie, search, pagination)
  - [x] `product(id)` - detail produktu s custom pricing
  - [x] `categories` - hierarchie kategorií
  - [x] `me` - současný uživatel
  - [x] `myOrders` - objednávky uživatele
  - [x] `order(id)` - detail objednávky s authorization
- [x] **Admin queries**
  - [x] `users` - správa zákazníků s search a filtering
  - [x] `orders` - všechny objednávky s filtering
  - [x] `customPrices` - správa individuálních cen
  - [x] `analytics` - kompletní dashboard statistiky
- [x] **Apollo Server integrace**
  - [x] Apollo Server setup standalone
  - [x] GraphQL Playground/Apollo Studio setup
  - [x] Schema definice a resolvers
  - [x] Context setup (user authentication)

#### ✅ Autentizace a autorizace (12-16 hodin) - **HOTOVO**
- [x] **JWT implementace**
  - [x] Token generování a validace
  - [x] Context injection (currentUser)
  - [ ] Refresh token mechanismus - pro později
- [x] **Auth mutations**
  - [x] `register` - registrace B2B zákazníka
  - [x] `login` - přihlášení
  - [ ] `refreshToken` - obnovení tokenu - pro později
  - [ ] `requestPasswordReset` - reset hesla - pro později
  - [ ] `resetPassword` - potvrzení reset hesla - pro později
- [x] **Authorization guards**
  - [x] Role-based access control (requireAuth, requireAdmin)
  - [x] Resource ownership validation
  - [x] Admin-only operations

### ✅ Week 4: Business logic a mutations - **HOTOVO**

#### ✅ E-commerce mutations (16-20 hodin) - **HOTOVO**
- [x] **Product management (Admin)**
  - [x] `createProduct` - vytvoření produktu
  - [x] `updateProduct` - úprava produktu
  - [x] `deleteProduct` - smazání produktu
  - [x] `setCustomPrice` - individuální cena
  - [x] `removeCustomPrice` - odebrání individuální ceny
- [x] **Order management**
  - [x] `createOrder` - vytvoření objednávky s business logikou
  - [x] `updateOrderStatus` - změna stavu s validací (Admin)
  - [x] `addTrackingNumber` - přidání tracking čísla
  - [ ] `cancelOrder` - zrušení objednávky - zatím přes updateOrderStatus
- [x] **User management**
  - [x] `updateUserStatus` - aktivace/deaktivace zákazníka (Admin)
  - [x] `bulkUpdateUserStatus` - hromadné operace
  - [x] `bulkSetCustomPrices` - hromadné nastavení cen
  - [ ] `updateProfile` - úprava profilu - pro později

#### ✅ Advanced features (8-12 hodin) - **HOTOVO**
- [x] **Search a filtering**
  - [x] Search v produktech (název, popis)
  - [x] Filtry (kategorie, dostupnost, aktivní)
  - [x] Pagination (limit, offset)
  - [x] Sorting options
- [x] **Caching strategie**
  - [x] Redis cache pro analytics
  - [x] Cache invalidation patterns
  - [x] Performance optimalizace s cache

---

## ✅ Fáze 3: Platby a email systém (Týden 5) - **HOTOVO**

### ✅ Comgate V2 integrace (20-24 hodin) - **HOTOVO**
- [x] **Comgate API client**
  - [x] REST API wrapper s Axios
  - [x] Authentication (merchant + secret hash)
  - [x] Error handling a retry logic
  - [x] TypeScript types pro všechny API calls
- [x] **Payment flow**
  - [x] `createPayment` - inicializace platby s business logikou
  - [x] Payment redirect URL generování
  - [x] Webhook endpoint pro status updates (/webhooks/comgate)
  - [x] Payment verification s signature checking
- [x] **Order synchronizace**
  - [x] Automatická změna stavu při úspěšné platbě
  - [x] Handling failed payments (CANCELLED status)
  - [x] Payment ID tracking v objednávkách
  - [x] Admin cancel payment funkce
- [x] **GraphQL mutations**
  - [x] `createPayment` - vytvoření platby pro objednávku
  - [x] `paymentStatus` - získání stavu platby
  - [x] `cancelPayment` - zrušení platby (admin)

### ✅ Email systém (12-16 hodin) - **HOTOVO**
- [x] **Nodemailer setup**
  - [x] SMTP konfigurace s environment variables
  - [x] Email templates engine (Handlebars)
  - [x] Mock transporter pro development
  - [x] Czech localization (formatPrice, formatDate)
- [x] **Email templates**
  - [x] Registrace potvrzení
  - [x] Order confirmation (profesionální HTML template)
  - [x] Payment confirmation
  - [x] Order shipped notification
  - [x] Order delivered notification
  - [x] Order cancelled notification
- [x] **Integration s business logikou**
  - [x] Automatic email při registraci
  - [x] Automatic email při vytvoření objednávky
  - [x] Automatic email při změně stavu platby (webhook)
  - [x] Email health check v /health/detailed

---

## 🗓️ Fáze 4: Testing a optimalizace (Týden 6)

### 🧪 Testing (16-20 hodin)
- [ ] **Unit tests**
  - [ ] Utility funkce testy
  - [ ] Database model testy
  - [ ] Business logic testy
- [ ] **Integration tests**
  - [ ] GraphQL resolver testy
  - [ ] Authentication flow testy
  - [ ] Payment integration testy
- [ ] **E2E tests**
  - [ ] Complete order flow
  - [ ] Admin operations
  - [ ] Error scenarios

### ⚡ Performance a security (12-16 hodin)
- [ ] **Performance optimalizace**
  - [ ] Database indexy
  - [ ] N+1 query elimination
  - [ ] Response caching
  - [ ] Connection pooling
- [ ] **Security hardening**
  - [ ] Input validation (joi/zod)
  - [ ] SQL injection prevention
  - [ ] XSS protection
  - [ ] Rate limiting fine-tuning
- [ ] **Monitoring setup**
  - [ ] Logging strategy
  - [ ] Error tracking
  - [ ] Performance metrics

---

## 🗓️ Fáze 5: Deployment a dokumentace (Týden 7-8)

### 🚀 Railway deployment (12-16 hodin)
- [ ] **Production setup**
  - [ ] Environment variables konfigurace
  - [ ] Database migration strategy
  - [ ] Redis setup na Railway
- [ ] **CI/CD pipeline**
  - [ ] GitHub Actions workflow
  - [ ] Automated testing
  - [ ] Deployment automation
- [ ] **Monitoring a health checks**
  - [ ] Application monitoring
  - [ ] Database monitoring
  - [ ] Alert setup

### 📚 Finální dokumentace (8-12 hodin)
- [ ] **API dokumentace update**
  - [ ] GraphQL schema export
  - [ ] Mutation examples
  - [ ] Error codes dokumentace
- [ ] **Frontend integration guide**
  - [ ] Apollo Client setup
  - [ ] Authentication patterns
  - [ ] Common queries/mutations
- [ ] **Admin dokumentace**
  - [ ] Deployment guide
  - [ ] Maintenance procedures
  - [ ] Troubleshooting guide

---

## 🎯 Prioritní úkoly na tento týden

### 🔥 Vysoká priorita (udělej první)
1. **Railway setup + CI/CD** - deploy first přístup! 🚀
2. **Testing infrastruktura** - kvalita kódu od začátku! 🧪
3. **Rozšíření Prisma schema** - na production databázi s testy
4. **Základní Fastify server** - s automatickým deploymentem a testy

### 📋 Střední priorita (pak)
4. **GraphQL schema definice** - struktura API
5. **JWT autentizace** - security základ

### 📌 Nízká priorita (později)
6. **Admin funkce** - až bude základ hotový
7. **Advanced features** - optimalizace na konec

---

## 💡 Tipy pro efektivní práci

### 🛠️ Development workflow
- Vždy začni s databázovými modely
- Testuj každou funkci postupně (Prisma Studio, GraphQL Playground)
- Používej TypeScript pro lepší developer experience
- Commituj často s popisnými zprávami

### 🎨 UI/UX tipy pro frontend kolegu
- Připrav mock data pro rychlý frontend vývoj
- Dokumentuj všechny GraphQL queries s příklady
- Vytvoř Postman collection pro API testování
- Navrhni konzistentní error handling

### 📈 Performance tipy
- Implementuj pagination u všech listů
- Používej DataLoader pattern pro N+1 queries
- Cache často používané data (produkty, kategorie)
- Optimalizuj database queries s explain

---

## ⏰ Časový plán (40h/týden)

| Týden | Fokus | Hodiny | Klíčové deliverables |
|-------|-------|--------|---------------------|
| 1 | Database + Environment | 40h | Prisma schema, základní server |
| 2 | Server infrastruktura | 40h | Fastify setup, middleware |
| 3 | GraphQL + Auth | 40h | Schema, resolvers, JWT |
| 4 | Business logic | 40h | Mutations, advanced features |
| 5 | Payments + Emails | 40h | Comgate, Nodemailer |
| 6 | Testing + Performance | 40h | Tests, optimalizace |
| 7-8 | Deployment + Docs | 80h | Railway, dokumentace |

**Celkem: 320 hodin (8 týdnů full-time)**

---

*Tento TODO je živý dokument - aktualizuj ho podle pokroku a nových požadavků! 🚀* 