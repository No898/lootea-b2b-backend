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
  basePrice: number;
  unit?: 'KS' | 'KG' | 'L' | 'BAL';
  packageSize?: number;
  categoryId: string;
  sortOrder?: number;
}

export interface UpdateProductInput {
  name?: string;
  slug?: string;
  description?: string;
  basePrice?: number;
  unit?: 'KS' | 'KG' | 'L' | 'BAL';
  packageSize?: number;
  categoryId?: string;
  inStock?: boolean;
  isActive?: boolean;
  sortOrder?: number;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  companyName: string; // povinné pole
  ico?: string;
  dic?: string;
  phone?: string;
  street?: string;
  city?: string;
  zipCode?: string;
  country?: string;
}
