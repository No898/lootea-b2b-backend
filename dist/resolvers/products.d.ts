import { Context } from '../context';
interface CreateProductInput {
    name: string;
    slug: string;
    description?: string;
    basePrice: number;
    unit: 'KS' | 'KG' | 'L' | 'BAL';
    packageSize?: number;
    categoryId: string;
    sortOrder?: number;
}
interface UpdateProductInput {
    name?: string;
    slug?: string;
    description?: string;
    basePrice?: number;
    unit?: 'KS' | 'KG' | 'L' | 'BAL';
    packageSize?: number;
    inStock?: boolean;
    isActive?: boolean;
    categoryId?: string;
    sortOrder?: number;
}
export declare const productResolvers: {
    Query: {
        products: (_: any, { categoryId, search, limit, offset, }: {
            categoryId?: string;
            search?: string;
            limit?: number;
            offset?: number;
        }, { prisma }: Context) => Promise<({
            category: {
                name: string;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                sortOrder: number;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
            basePrice: number;
            unit: import(".prisma/client").$Enums.Unit;
            packageSize: number | null;
            inStock: boolean;
            categoryId: string;
        })[]>;
        product: (_: any, { id, slug }: {
            id?: string;
            slug?: string;
        }, { prisma }: Context) => Promise<{
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
            basePrice: number;
            unit: import(".prisma/client").$Enums.Unit;
            packageSize: number | null;
            inStock: boolean;
            categoryId: string;
        } | null>;
    };
    Mutation: {
        createProduct: (_: any, { input }: {
            input: CreateProductInput;
        }, context: Context) => Promise<{
            category: {
                name: string;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                sortOrder: number;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
            basePrice: number;
            unit: import(".prisma/client").$Enums.Unit;
            packageSize: number | null;
            inStock: boolean;
            categoryId: string;
        }>;
        updateProduct: (_: any, { id, input }: {
            id: string;
            input: UpdateProductInput;
        }, context: Context) => Promise<{
            category: {
                name: string;
                id: string;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
                slug: string;
                description: string | null;
                sortOrder: number;
            };
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
            basePrice: number;
            unit: import(".prisma/client").$Enums.Unit;
            packageSize: number | null;
            inStock: boolean;
            categoryId: string;
        }>;
        deleteProduct: (_: any, { id }: {
            id: string;
        }, context: Context) => Promise<boolean>;
    };
    Product: {
        currentPrice: (parent: any, _: any, { prisma, user }: Context) => Promise<any>;
    };
};
export {};
//# sourceMappingURL=products.d.ts.map