export const typeDefs = `#graphql
  # Enums
  enum UserRole {
    ADMIN
    B2B_CUSTOMER
  }

  enum OrderStatus {
    PENDING
    PAID
    PROCESSING
    SHIPPED
    DELIVERED
    CANCELLED
  }

  enum Unit {
    KS
    KG
    L
    BAL
  }

  # Types
  type User {
    id: ID!
    email: String!
    role: UserRole!
    companyName: String
    ico: String
    dic: String
    phone: String
    street: String
    city: String
    zipCode: String
    country: String
    isActive: Boolean!
    createdAt: String!
    updatedAt: String!
    orders: [Order!]!
  }

  type Category {
    id: ID!
    name: String!
    slug: String!
    description: String
    isActive: Boolean!
    sortOrder: Int!
    createdAt: String!
    updatedAt: String!
    products: [Product!]!
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    basePrice: Float!
    unit: Unit!
    packageSize: Int
    inStock: Boolean!
    isActive: Boolean!
    sortOrder: Int!
    category: Category!
    createdAt: String!
    updatedAt: String!
    # Cena pro přihlášeného uživatele (může být custom price)
    currentPrice: Float!
  }

  type CustomPrice {
    id: ID!
    user: User!
    product: Product!
    price: Float!
    createdAt: String!
    updatedAt: String!
  }

  type Order {
    id: ID!
    orderNumber: String!
    user: User!
    status: OrderStatus!
    subtotal: Float!
    shipping: Float!
    total: Float!
    shippingStreet: String
    shippingCity: String
    shippingZipCode: String
    shippingCountry: String
    paymentId: String
    paymentMethod: String
    paidAt: String
    customerNote: String
    adminNote: String
    trackingNumber: String
    shippedAt: String
    deliveredAt: String
    createdAt: String!
    updatedAt: String!
    items: [OrderItem!]!
  }

  type OrderItem {
    id: ID!
    product: Product!
    quantity: Int!
    unitPrice: Float!
    total: Float!
  }

  # Auth types
  type AuthPayload {
    token: String!
    user: User!
  }

  # Input types
  input RegisterInput {
    email: String!
    password: String!
    companyName: String!
    ico: String
    dic: String
    phone: String
    street: String
    city: String
    zipCode: String
    country: String
  }

  input LoginInput {
    email: String!
    password: String!
  }

  input CreateCategoryInput {
    name: String!
    slug: String!
    description: String
    sortOrder: Int
  }

  input UpdateCategoryInput {
    name: String
    slug: String
    description: String
    isActive: Boolean
    sortOrder: Int
  }

  input CreateProductInput {
    name: String!
    slug: String!
    description: String
    basePrice: Float!
    unit: Unit!
    packageSize: Int
    categoryId: ID!
    sortOrder: Int
  }

  input UpdateProductInput {
    name: String
    slug: String
    description: String
    basePrice: Float
    unit: Unit
    packageSize: Int
    inStock: Boolean
    isActive: Boolean
    categoryId: ID
    sortOrder: Int
  }

  input CreateOrderInput {
    items: [OrderItemInput!]!
    shippingStreet: String
    shippingCity: String
    shippingZipCode: String
    shippingCountry: String
    customerNote: String
  }

  input OrderItemInput {
    productId: ID!
    quantity: Int!
  }

  input SetCustomPriceInput {
    userId: ID!
    productId: ID!
    price: Float!
  }

  # Analytics types
  type UserStats {
    total: Int!
    active: Int!
    inactive: Int!
  }

  type OrderStats {
    total: Int!
    pending: Int!
    completed: Int!
  }

  type RevenueStats {
    total: Float!
    monthly: Float!
  }

  type TopProduct {
    product: Product
    totalQuantity: Int!
    orderCount: Int!
  }

  type Analytics {
    users: UserStats!
    orders: OrderStats!
    revenue: RevenueStats!
    topProducts: [TopProduct!]!
    recentOrders: [Order!]!
  }

  # Bulk operation results
  type BulkOperationResult {
    count: Int!
    success: Boolean!
  }

  # Bulk custom price input
  input BulkCustomPriceInput {
    userId: ID!
    productId: ID!
    price: Float!
  }

  # Payment types
  type PaymentStatus {
    transId: String!
    status: String!
    price: Float!
    curr: String!
    method: String!
    order: Order!
  }

  type CreatePaymentResult {
    success: Boolean!
    transId: String
    redirectUrl: String
    order: Order
  }

  type CancelPaymentResult {
    success: Boolean!
    message: String!
  }

  # Queries
  type Query {
    # Public queries
    categories: [Category!]!
    category(id: ID, slug: String): Category
    products(categoryId: ID, search: String, limit: Int, offset: Int): [Product!]!
    product(id: ID, slug: String): Product

    # Authenticated queries
    me: User
    myOrders: [Order!]!
    order(id: ID!): Order

    # Admin queries
    users(limit: Int, offset: Int, search: String, isActive: Boolean): [User!]!
    user(id: ID!): User
    orders(status: OrderStatus, limit: Int, offset: Int): [Order!]!
    customPrices(userId: ID, productId: ID, limit: Int, offset: Int): [CustomPrice!]!
    analytics: Analytics!

    # Payment queries
    paymentStatus(transId: String!): PaymentStatus!
  }

  # Mutations
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!

    # Categories (Admin only)
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!

    # Products (Admin only)
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): Boolean!

    # Orders
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    addTrackingNumber(id: ID!, trackingNumber: String!): Order!

    # Custom prices (Admin only)
    setCustomPrice(input: SetCustomPriceInput!): CustomPrice!
    removeCustomPrice(userId: ID!, productId: ID!): Boolean!

    # User management (Admin only)
    updateUserStatus(id: ID!, isActive: Boolean!): User!
    
    # Bulk operations (Admin only)
    bulkUpdateUserStatus(userIds: [ID!]!, isActive: Boolean!): BulkOperationResult!
    bulkSetCustomPrices(prices: [BulkCustomPriceInput!]!): BulkOperationResult!

    # Payment mutations
    createPayment(orderId: ID!, method: String, returnUrl: String): CreatePaymentResult!
    cancelPayment(transId: String!): CancelPaymentResult!
  }
`;
//# sourceMappingURL=typeDefs.js.map