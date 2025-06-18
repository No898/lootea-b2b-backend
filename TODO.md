# 🚀 B2B Bubble Tea E-shop Backend - Komplexní TODO

## 📊 Přehled projektu
- **Celkový odhad:** 6-8 týdnů (240-320 hodin)
- **Tech stack:** Node.js + Fastify + GraphQL (Apollo Server) + JWT + Redis + PostgreSQL (Prisma) + Comgate V2
- **Cíl:** Připravit backend tak, aby frontend vývojář měl minimum práce

---

## 🗓️ Fáze 1: Databáze a základní infrastruktura (Týden 1-2)

### ✅ Hotovo
- [x] Základní package.json s dependencies
- [x] Základní Prisma schema
- [x] Dokumentace v Docusaurus

### 🔄 Week 1: Railway setup a databázové modely

#### 🚀 Railway a CI/CD setup (10-12 hodin) - **PRIORITA #1**
- [ ] **Railway projekt setup**
  - [ ] Vytvoření Railway účtu a projektu
  - [ ] GitHub repository propojení
  - [ ] PostgreSQL databáze provision (production + test)
  - [ ] Redis addon přidání
- [ ] **CI/CD pipeline s testy**
  - [ ] GitHub Actions workflow (.github/workflows/ci.yml)
  - [ ] Test databáze setup v CI (PostgreSQL service)
  - [ ] Lint + Format + Test + Deploy pipeline
  - [ ] Deploy pouze pokud všechny testy prošly
- [ ] **Environment konfigurace**
  - [ ] `.env.example` template
  - [ ] Railway environment variables (DATABASE_URL, REDIS_URL, JWT_SECRET)
  - [ ] Test environment variables (TEST_DATABASE_URL)
  - [ ] Environment validation (joi/zod)
- [ ] **Základní deployment test**
  - [ ] Minimální Fastify server
  - [ ] Health check endpoint
  - [ ] Successful deployment verification

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

#### 📋 Rozšíření Prisma Schema (8-12 hodin)
- [ ] **Kategorie produktů** - model Category s hierarchií
  - [ ] Enum pro typy: SIRUPY, TOPPINGS, PRASKY_SMESI, VYBAVENI, CAJE
  - [ ] Podpora pro subcategories (parent/children vztah)
- [ ] **Rozšířený Product model** 
  - [ ] Kategorie vztah (categoryId)
  - [ ] Jednotky (unit: KS/BAL, weightPerUnit, volumePerUnit)
  - [ ] Inventory (inStock boolean, stockQuantity)
  - [ ] SEO fields (slug, metaDescription)
- [ ] **B2B User model rozšíření**
  - [ ] Role enum (CUSTOMER, ADMIN)
  - [ ] Firemní údaje (companyName, ico, dic, address)
  - [ ] Status (PENDING, APPROVED, BLOCKED)
- [ ] **Individuální ceny - CustomerPrice model**
  - [ ] Vztah User <-> Product s custom cenou
  - [ ] Platnost ceny (validFrom, validTo)
- [ ] **Detailní Order system**
  - [ ] Status enum (PENDING, PAID, PROCESSING, SHIPPED, DELIVERED, CANCELLED)
  - [ ] Shipping info (address, method, cost)
  - [ ] Payment info (paymentId, paymentMethod, paidAt)
- [ ] **Email templates a logs**
  - [ ] EmailTemplate model (typ, subject, body)
  - [ ] EmailLog model (tracking odeslaných emailů)

#### 🗄️ Database setup na Railway (4-6 hodin)
- [ ] **Prisma konfigurace**
  - [ ] Database URL z Railway
  - [ ] Prisma migrate na production databázi
  - [ ] Seed data (kategorie, admin user, testovací produkty)
  - [ ] Prisma Studio přístup k production DB

### 🔄 Week 2: Základní server infrastruktura

#### 🚀 Fastify + Apollo Server setup (12-16 hodin)
- [ ] **Základní server struktura**
  - [ ] `src/index.js` - entry point s Fastify
  - [ ] `src/config/` - konfigurace (database, redis, jwt)
  - [ ] `src/graphql/` - Apollo Server setup
  - [ ] `src/utils/` - helper funkce
- [ ] **Apollo Server integrace**
  - [ ] Apollo Server 4 setup s Fastify
  - [ ] GraphQL schema definice (typeDefs)
  - [ ] Context setup (user z JWT)
  - [ ] Apollo Studio v development
- [ ] **Middleware a pluginy**
  - [ ] JWT authentication middleware
  - [ ] CORS konfigurace
  - [ ] Rate limiting (pro GraphQL endpoint)
  - [ ] Request logging
  - [ ] Error handling
- [ ] **Redis integrace**
  - [ ] Redis client setup
  - [ ] Session storage
  - [ ] Cache helper funkce
- [ ] **Health check endpoints**
  - [ ] `/health` - základní health check
  - [ ] `/health/db` - database connectivity
  - [ ] `/health/redis` - redis connectivity

---

## 🗓️ Fáze 2: GraphQL API a autentizace (Týden 3-4)

### 🔄 Week 3: GraphQL schema a základní resolvers

#### 📝 GraphQL schema definice (16-20 hodin)
- [ ] **GraphQL typy podle dokumentace**
  - [ ] User, Customer, Admin typy
  - [ ] Product, Category, CustomerPrice typy
  - [ ] Order, OrderItem, OrderStatus typy
  - [ ] Input typy pro mutations
  - [ ] Enum typy (Role, OrderStatus, Category, Unit)
- [ ] **Query resolvers**
  - [ ] `products` - s filtry (kategorie, search, cena)
  - [ ] `product(id)` - detail produktu
  - [ ] `categories` - hierarchie kategorií
  - [ ] `me` - současný uživatel
  - [ ] `orders` - objednávky uživatele
  - [ ] `order(id)` - detail objednávky
- [ ] **Admin queries**
  - [ ] `allUsers` - správa zákazníků
  - [ ] `allOrders` - všechny objednávky
  - [ ] `analytics` - základní statistiky
- [ ] **Apollo Server integrace**
  - [ ] Apollo Server setup s Fastify
  - [ ] GraphQL Playground/Apollo Studio setup
  - [ ] Schema definice a resolvers
  - [ ] Context setup (user authentication)

#### 🔐 Autentizace a autorizace (12-16 hodin)
- [ ] **JWT implementace**
  - [ ] Token generování a validace
  - [ ] Refresh token mechanismus
  - [ ] Context injection (currentUser)
- [ ] **Auth mutations**
  - [ ] `register` - registrace B2B zákazníka
  - [ ] `login` - přihlášení
  - [ ] `refreshToken` - obnovení tokenu
  - [ ] `requestPasswordReset` - reset hesla
  - [ ] `resetPassword` - potvrzení reset hesla
- [ ] **Authorization guards**
  - [ ] Role-based access control
  - [ ] Resource ownership validation
  - [ ] Admin-only operations

### 🔄 Week 4: Business logic a mutations

#### 🛒 E-commerce mutations (16-20 hodin)
- [ ] **Product management (Admin)**
  - [ ] `createProduct` - vytvoření produktu
  - [ ] `updateProduct` - úprava produktu
  - [ ] `deleteProduct` - smazání produktu
  - [ ] `setCustomerPrice` - individuální cena
- [ ] **Order management**
  - [ ] `createOrder` - vytvoření objednávky
  - [ ] `updateOrderStatus` - změna stavu (Admin)
  - [ ] `cancelOrder` - zrušení objednávky
  - [ ] `addOrderItem` - přidání položky
  - [ ] `removeOrderItem` - odebrání položky
- [ ] **User management**
  - [ ] `updateProfile` - úprava profilu
  - [ ] `approveCustomer` - schválení zákazníka (Admin)
  - [ ] `blockCustomer` - blokování zákazníka (Admin)

#### 🔍 Advanced features (8-12 hodin)
- [ ] **Search a filtering**
  - [ ] Full-text search v produktech
  - [ ] Pokročilé filtry (cena, kategorie, dostupnost)
  - [ ] Sorting options
- [ ] **Caching strategie**
  - [ ] Redis cache pro produkty
  - [ ] Cache invalidation
  - [ ] Performance optimalizace

---

## 🗓️ Fáze 3: Platby a email systém (Týden 5)

### 💳 Comgate V2 integrace (20-24 hodin)
- [ ] **Comgate API client**
  - [ ] REST API wrapper
  - [ ] Authentication (API key)
  - [ ] Error handling a retry logic
- [ ] **Payment flow**
  - [ ] `createPayment` - inicializace platby
  - [ ] Payment redirect URL generování
  - [ ] Webhook endpoint pro status updates
  - [ ] Payment verification
- [ ] **Order synchronizace**
  - [ ] Automatická změna stavu při úspěšné platbě
  - [ ] Handling failed payments
  - [ ] Refund support (základní)
- [ ] **Testing a validation**
  - [ ] Sandbox environment setup
  - [ ] Test payment scenarios
  - [ ] Webhook security validation

### 📧 Email systém (12-16 hodin)
- [ ] **Nodemailer setup**
  - [ ] SMTP konfigurace
  - [ ] Email templates engine (handlebars)
  - [ ] Attachment support
- [ ] **Email templates**
  - [ ] Registrace potvrzení
  - [ ] Order confirmation
  - [ ] Payment confirmation
  - [ ] Shipping notification
  - [ ] Delivery confirmation
- [ ] **Email queue system**
  - [ ] Background job processing
  - [ ] Retry mechanism
  - [ ] Email delivery tracking

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