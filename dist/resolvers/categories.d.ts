import { Context } from '../context';
interface CreateCategoryInput {
    name: string;
    slug: string;
    description?: string;
    sortOrder?: number;
}
interface UpdateCategoryInput {
    name?: string;
    slug?: string;
    description?: string;
    isActive?: boolean;
    sortOrder?: number;
}
export declare const categoryResolvers: {
    Query: {
        categories: (_: any, __: any, { prisma }: Context) => Promise<({
            products: {
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
            }[];
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
        })[]>;
        category: (_: any, { id, slug }: {
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
        } | null>;
    };
    Mutation: {
        createCategory: (_: any, { input }: {
            input: CreateCategoryInput;
        }, context: Context) => Promise<{
            products: {
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
            }[];
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
        }>;
        updateCategory: (_: any, { id, input }: {
            id: string;
            input: UpdateCategoryInput;
        }, context: Context) => Promise<{
            products: {
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
            }[];
        } & {
            name: string;
            id: string;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
            slug: string;
            description: string | null;
            sortOrder: number;
        }>;
        deleteCategory: (_: any, { id }: {
            id: string;
        }, context: Context) => Promise<boolean>;
    };
    Category: {
        products: (parent: any, _: any, { prisma }: Context) => Promise<{
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
        }[]>;
    };
};
export {};
//# sourceMappingURL=categories.d.ts.map