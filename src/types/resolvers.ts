// GraphQL Input Types
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  sortOrder?: number;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
}

export interface CreateProductInput {
  name: string;
  slug: string;
  description?: string;
  categoryId: string;
  sortOrder?: number;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  categoryId?: string;
  isActive?: boolean;
  sortOrder?: number;
}

interface ImageInput {
  url: string;
  altText?: string;
}

export interface CreateProductVariantInput {
  productId: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  discountPrice?: number;
  brand?: string;
  flavor?: string;
  weightKg?: number;
  volumeL?: number;
  stockQuantity?: number;
  isActive?: boolean;
  isDefault?: boolean;
  images?: ImageInput[];
}

export interface UpdateProductVariantInput {
  name?: string;
  slug?: string;
  sku?: string;
  price?: number;
  discountPrice?: number;
  brand?: string;
  flavor?: string;
  weightKg?: number;
  volumeL?: number;
  stockQuantity?: number;
  isActive?: boolean;
  isDefault?: boolean;
  images?: ImageInput[];
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  companyName: string;
  ico?: string;
  dic?: string;
  phone?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}

export interface SetCustomPriceInput {
  userId: string;
  productVariantId: string;
  price: number;
}

export interface CreateOrderInput {
  items: OrderItemInput[];
  shippingStreet?: string;
  shippingCity?: string;
  shippingZipCode?: string;
  shippingCountry?: string;
  customerNote?: string;
}

export interface OrderItemInput {
  productVariantId: string;
  quantity: number;
}

// GraphQL Resolver Types
export interface Resolvers {
  Query: {
    [key: string]: any;
  };
  Mutation: {
    [key: string]: any;
  };
  Product?: {
    [key: string]: any;
  };
  Category?: {
    [key: string]: any;
  };
  ProductVariant?: {
    [key: string]: any;
  };
}
