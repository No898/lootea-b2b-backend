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

  enum ProductSortKeys {
    RELEVANCE
    NEWEST
    # Note: Sorting by price requires more complex logic now
    # PRICE_ASC
    # PRICE_DESC
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

  type Image {
    id: ID!
    url: String!
    altText: String
  }

  type ProductVariant {
    id: ID!
    name: String!
    slug: String!
    sku: String!
    price: Float!
    discountPrice: Float
    brand: String
    flavor: String
    weightKg: Float
    volumeL: Float
    inStock: Boolean!
    stockQuantity: Int
    isActive: Boolean!
    isDefault: Boolean!
    createdAt: String!
    updatedAt: String!
    product: Product!
    images: [Image!]
    # Dynamická cena, která zohledňuje slevu a individuální cenu zákazníka
    currentPrice: Float!
  }

  type Product {
    id: ID!
    name: String!
    slug: String!
    description: String
    isActive: Boolean!
    sortOrder: Int!
    createdAt: String!
    updatedAt: String!
    category: Category!
    variants: [ProductVariant!]!
    # Dynamická cena, která bere cenu z defaultní varianty
    currentPrice: Float
    # Všechny obrázky ze všech variant
    images: [Image!]
  }

  type CustomPrice {
    id: ID!
    user: User!
    productVariant: ProductVariant!
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
    productVariant: ProductVariant!
    quantity: Int!
    unitPrice: Float!
    total: Float!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type ProductEdge {
    cursor: String!
    node: Product!
  }

  type ProductConnection {
    totalCount: Int!
    edges: [ProductEdge!]!
    pageInfo: PageInfo!
  }

  # Auth types
  type AuthPayload {
    token: String!
    user: User!
  }

  type BatchPayload {
    count: Int!
    success: Boolean
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

  # Product (obal)
  input CreateProductInput {
    name: String!
    slug: String!
    description: String
    categoryId: ID!
    sortOrder: Int
  }

  input UpdateProductInput {
    name: String
    slug: String
    description: String
    isActive: Boolean
    categoryId: ID
    sortOrder: Int
  }

  # Product Variant
  input ImageInput {
    url: String!
    altText: String
  }

  input CreateProductVariantInput {
    productId: ID!
    name: String!
    slug: String!
    sku: String!
    price: Float!
    discountPrice: Float
    brand: String
    flavor: String
    weightKg: Float
    volumeL: Float
    stockQuantity: Int
    isActive: Boolean
    isDefault: Boolean
    images: [ImageInput!]
  }

  input UpdateProductVariantInput {
    name: String
    sku: String
    price: Float
    stock: Int
    isDefault: Boolean
    attributes: [AttributeInput!]
  }

  input AttributeInput {
    name: String!
    value: String!
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
    productVariantId: ID!
    quantity: Int!
  }

  input SetCustomPriceInput {
    userId: ID!
    productVariantId: ID!
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
    productVariant: ProductVariant
    totalQuantity: Int!
    orderCount: Int!
  }

  type Analytics {
    users: UserStats!
    orders: OrderStats!
    revenue: RevenueStats!
    topProducts: [TopProduct!]!
  }

  # Queries
  type Query {
    # Users
    me: User
    user(id: ID!): User
    users(first: Int, after: String): [User!]
    
    # Categories
    category(id: ID!): Category
    categories: [Category!]!
    
    # Products
    products(
      first: Int,
      after: String,
      search: String,
      categoryId: ID,
      minPrice: Float,
      maxPrice: Float,
      sortBy: ProductSortKeys
    ): ProductConnection!
    product(id: ID, slug: String): Product
    productBySlug(slug: String!): Product
    productVariant(id: ID!): ProductVariant
    
    # Orders
    order(id: ID!): Order
    orders(
      userId: ID, 
      status: OrderStatus, 
      first: Int, 
      after: String
    ): [Order!]
    
    # Analytics
    analytics: Analytics!
  }

  # Mutations
  type Mutation {
    # Auth
    register(input: RegisterInput!): AuthPayload!
    login(input: LoginInput!): AuthPayload!
    
    # Category
    createCategory(input: CreateCategoryInput!): Category!
    updateCategory(id: ID!, input: UpdateCategoryInput!): Category!
    deleteCategory(id: ID!): Boolean!
    
    # Product
    createProduct(input: CreateProductInput!): Product!
    updateProduct(id: ID!, input: UpdateProductInput!): Product!
    deleteProduct(id: ID!): BatchPayload
    
    # Product Variant
    createProductVariant(input: CreateProductVariantInput!): ProductVariant!
    updateProductVariant(id: ID!, input: UpdateProductVariantInput!): ProductVariant!
    deleteProductVariant(id: ID!): BatchPayload
    
    # Custom Price
    setCustomPrice(input: SetCustomPriceInput!): CustomPrice!
    removeCustomPrice(userId: ID!, productVariantId: ID!): Boolean!
    
    # Order
    createOrder(input: CreateOrderInput!): Order!
    updateOrderStatus(id: ID!, status: OrderStatus!): Order!
    
    # Admin mutations
    updateUserStatus(id: ID!, isActive: Boolean!): User
    bulkUpdateUserStatus(userIds: [ID!]!, isActive: Boolean!): BatchPayload
    bulkSetCustomPrices(prices: [CustomPriceInput!]!): BatchPayload
  }

  input CustomPriceInput {
    userId: ID!
    productVariantId: ID!
    price: Float!
  }
`;
