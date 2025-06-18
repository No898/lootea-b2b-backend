# GraphQL Schema

## Přehled API

GraphQL endpoint: `http://localhost:3000/graphql`
Apollo Studio: `http://localhost:3000/graphql` (v development módu)

## Types Definice

### User Types
```graphql
enum Role {
  CUSTOMER
  ADMIN
}

type User {
  id: ID!
  email: String!
  role: Role!
  customPricing: Boolean!
  createdAt: DateTime!
  orders: [Order!]!
}

type AuthPayload {
  token: String!
  refreshToken: String!
  user: User!
}
```

### Product Types
```graphql
type Category {
  id: ID!
  name: String!
  slug: String!
  description: String
  products: [Product!]!
  createdAt: DateTime!
}

type Product {
  id: ID!
  name: String!
  slug: String!
  description: String
  
  # Jednotky a balení
  baseUnit: String!        # "l", "kg", "ks"
  salesUnit: String!       # "ks", "bal"
  unitSize: Float!         # 1 ks = 1 litr
  packageSize: Int         # 1 bal = 6 ks
  
  # Ceny
  price: Float!            # Základní cena za ks
  packagePrice: Float      # Cena za bal
  customerPrice: Float     # Individuální cena pro přihlášeného uživatele
  
  # Sklad
  inStock: Boolean!
  stockCount: Int
  
  # Relations
  category: Category!
  createdAt: DateTime!
  updatedAt: DateTime!
}

input ProductFilter {
  categoryId: ID
  inStock: Boolean
  search: String
  priceMin: Float
  priceMax: Float
}

input ProductSort {
  field: ProductSortField!
  direction: SortDirection!
}

enum ProductSortField {
  NAME
  PRICE
  CREATED_AT
}

enum SortDirection {
  ASC
  DESC
}
```

### Order Types
```graphql
enum OrderStatus {
  PENDING     # Vytvořena, čeká na platbu
  PAID        # Zaplacena, zpracovává se
  PROCESSING  # Balí se
  SHIPPED     # Odesláno
  DELIVERED   # Doručeno
  CANCELLED   # Zrušena
}

type Order {
  id: ID!
  orderNumber: String!
  user: User!
  status: OrderStatus!
  
  # Ceny
  subtotal: Float!
  shippingCost: Float!
  total: Float!
  
  # Platba
  paymentId: String
  paymentUrl: String
  
  # Doprava
  shippingAddress: String
  trackingNumber: String
  
  # Items
  items: [OrderItem!]!
  
  # Meta
  createdAt: DateTime!
  updatedAt: DateTime!
}

type OrderItem {
  id: ID!
  product: Product!
  quantity: Int!
  unitPrice: Float!
  total: Float!
}

input CreateOrderInput {
  items: [OrderItemInput!]!
  shippingAddress: String!
}

input OrderItemInput {
  productId: ID!
  quantity: Int!
}

input OrderFilter {
  status: OrderStatus
  dateFrom: DateTime
  dateTo: DateTime
  userId: ID  # Pouze pro admin
}
```

### Cart Types
```graphql
type Cart {
  items: [CartItem!]!
  total: Float!
  itemCount: Int!
}

type CartItem {
  product: Product!
  quantity: Int!
  unitPrice: Float!
  total: Float!
}

input CartItemInput {
  productId: ID!
  quantity: Int!
}
```

## Queries

### Authentication Queries
```graphql
type Query {
  # Aktuální uživatel
  me: User
  
  # Refresh token
  refreshToken(refreshToken: String!): AuthPayload!
}
```

### Product Queries
```graphql
extend type Query {
  # Seznam všech produktů
  products(
    filter: ProductFilter
    sort: ProductSort
    page: Int = 1
    limit: Int = 20
  ): ProductConnection!
  
  # Jeden produkt
  product(id: ID, slug: String): Product
  
  # Kategorie
  categories: [Category!]!
  category(id: ID, slug: String): Category
}

type ProductConnection {
  nodes: [Product!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}
```

### Order Queries
```graphql
extend type Query {
  # Moje objednávky (customer)
  myOrders(
    filter: OrderFilter
    page: Int = 1
    limit: Int = 10
  ): OrderConnection!
  
  # Jedna objednávka
  order(id: ID!): Order
  
  # Všechny objednávky (admin only)
  orders(
    filter: OrderFilter
    page: Int = 1
    limit: Int = 20
  ): OrderConnection! @auth(requires: ADMIN)
}

type OrderConnection {
  nodes: [Order!]!
  totalCount: Int!
  hasNextPage: Boolean!
  hasPreviousPage: Boolean!
}
```

### Cart Queries
```graphql
extend type Query {
  # Můj košík
  myCart: Cart!
}
```

## Mutations

### Authentication Mutations
```graphql
type Mutation {
  # Registrace
  register(input: RegisterInput!): AuthPayload!
  
  # Přihlášení
  login(input: LoginInput!): AuthPayload!
  
  # Odhlášení
  logout: Boolean!
}

input RegisterInput {
  email: String!
  password: String!
}

input LoginInput {
  email: String!
  password: String!
}
```

### Cart Mutations
```graphql
extend type Mutation {
  # Přidat do košíku
  addToCart(input: CartItemInput!): Cart!
  
  # Aktualizovat množství
  updateCartItem(input: CartItemInput!): Cart!
  
  # Odebrat z košíku
  removeFromCart(productId: ID!): Cart!
  
  # Vyčistit košík
  clearCart: Boolean!
}
```

### Order Mutations
```graphql
extend type Mutation {
  # Vytvořit objednávku
  createOrder(input: CreateOrderInput!): Order!
  
  # Admin: aktualizovat status
  updateOrderStatus(
    orderId: ID!
    status: OrderStatus!
    trackingNumber: String
  ): Order! @auth(requires: ADMIN)
}
```

### Admin Mutations
```graphql
extend type Mutation {
  # Správa produktů
  createProduct(input: CreateProductInput!): Product! @auth(requires: ADMIN)
  updateProduct(id: ID!, input: UpdateProductInput!): Product! @auth(requires: ADMIN)
  deleteProduct(id: ID!): Boolean! @auth(requires: ADMIN)
  
  # Správa kategorií
  createCategory(input: CreateCategoryInput!): Category! @auth(requires: ADMIN)
  updateCategory(id: ID!, input: UpdateCategoryInput!): Category! @auth(requires: ADMIN)
  
  # Individuální ceny
  setCustomPrice(
    userId: ID!
    productId: ID!
    price: Float!
    packagePrice: Float
  ): Boolean! @auth(requires: ADMIN)
}

input CreateProductInput {
  name: String!
  slug: String
  description: String
  categoryId: ID!
  baseUnit: String!
  salesUnit: String!
  unitSize: Float!
  packageSize: Int
  price: Float!
  packagePrice: Float
  inStock: Boolean = true
  stockCount: Int
}

input UpdateProductInput {
  name: String
  description: String
  price: Float
  packagePrice: Float
  inStock: Boolean
  stockCount: Int
}

input CreateCategoryInput {
  name: String!
  slug: String
  description: String
}

input UpdateCategoryInput {
  name: String
  description: String
}
```

## Directives

### @auth Directive
```graphql
directive @auth(requires: Role) on FIELD_DEFINITION

# Použití:
type Query {
  adminStats: AdminStats! @auth(requires: ADMIN)
}
```

## Scalars

### Custom Scalars
```graphql
scalar DateTime  # ISO 8601 datetime
scalar Upload    # Pro nahrávání souborů (budoucí funkcionalita)
```

## Error Handling

### Standard Error Types
```javascript
// GraphQL errors
const ErrorTypes = {
  UNAUTHORIZED: 'Nepřihlášený uživatel',
  FORBIDDEN: 'Nedostatečná oprávnění', 
  NOT_FOUND: 'Zdroj nenalezen',
  VALIDATION_ERROR: 'Validační chyba',
  PAYMENT_ERROR: 'Chyba platby',
  INVENTORY_ERROR: 'Nedostatečné zásoby'
}
```

### Error Response Format
```json
{
  "errors": [
    {
      "message": "Nedostatečné zásoby",
      "extensions": {
        "code": "INVENTORY_ERROR",
        "field": "quantity",
        "availableStock": 5
      }
    }
  ]
}
```

## Example Queries

### Získání produktů s kategorií
```graphql
query GetProducts($filter: ProductFilter, $page: Int) {
  products(filter: $filter, page: $page, limit: 12) {
    nodes {
      id
      name
      slug
      price
      packagePrice
      customerPrice
      baseUnit
      salesUnit
      unitSize
      packageSize
      inStock
      category {
        name
        slug
      }
    }
    totalCount
    hasNextPage
  }
}
```

### Vytvoření objednávky
```graphql
mutation CreateOrder($input: CreateOrderInput!) {
  createOrder(input: $input) {
    id
    orderNumber
    status
    total
    paymentUrl
    items {
      product {
        name
      }
      quantity
      unitPrice
      total
    }
  }
}
```

### Košík s produkty
```graphql
query MyCart {
  myCart {
    items {
      product {
        id
        name
        price
        baseUnit
        salesUnit
      }
      quantity
      unitPrice
      total
    }
    total
    itemCount
  }
}
``` 