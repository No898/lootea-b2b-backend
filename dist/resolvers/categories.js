import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
export const categoryResolvers = {
    Query: {
        categories: async (_, __, { prisma }) => {
            return await prisma.category.findMany({
                where: { isActive: true },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                include: {
                    products: {
                        where: { isActive: true },
                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    },
                },
            });
        },
        category: async (_, { id, slug }, { prisma }) => {
            if (!id && !slug) {
                throw new GraphQLError('Musíte zadat buď ID nebo slug kategorie');
            }
            const where = id ? { id } : { slug: slug };
            return await prisma.category.findUnique({
                where,
                include: {
                    products: {
                        where: { isActive: true },
                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    },
                },
            });
        },
    },
    Mutation: {
        createCategory: async (_, { input }, context) => {
            await requireAdmin(context);
            const existing = await context.prisma.category.findFirst({
                where: {
                    OR: [{ name: input.name }, { slug: input.slug }],
                },
            });
            if (existing) {
                throw new GraphQLError('Kategorie s tímto názvem nebo slug už existuje');
            }
            return await context.prisma.category.create({
                data: {
                    ...input,
                    sortOrder: input.sortOrder || 0,
                },
                include: {
                    products: true,
                },
            });
        },
        updateCategory: async (_, { id, input }, context) => {
            await requireAdmin(context);
            const existingCategory = await context.prisma.category.findUnique({
                where: { id },
            });
            if (!existingCategory) {
                throw new GraphQLError('Kategorie neexistuje');
            }
            if (input.name || input.slug) {
                const conflicts = [];
                if (input.name && input.name !== existingCategory.name) {
                    conflicts.push({ name: input.name });
                }
                if (input.slug && input.slug !== existingCategory.slug) {
                    conflicts.push({ slug: input.slug });
                }
                if (conflicts.length > 0) {
                    const existingConflict = await context.prisma.category.findFirst({
                        where: {
                            AND: [{ id: { not: id } }, { OR: conflicts }],
                        },
                    });
                    if (existingConflict) {
                        throw new GraphQLError('Kategorie s tímto názvem nebo slug už existuje');
                    }
                }
            }
            return await context.prisma.category.update({
                where: { id },
                data: input,
                include: {
                    products: {
                        where: { isActive: true },
                        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                    },
                },
            });
        },
        deleteCategory: async (_, { id }, context) => {
            await requireAdmin(context);
            const category = await context.prisma.category.findUnique({
                where: { id },
                include: {
                    products: true,
                },
            });
            if (!category) {
                throw new GraphQLError('Kategorie neexistuje');
            }
            const activeProducts = category.products.filter(p => p.isActive);
            if (activeProducts.length > 0) {
                throw new GraphQLError('Nelze smazat kategorii s aktivními produkty');
            }
            await context.prisma.category.update({
                where: { id },
                data: { isActive: false },
            });
            return true;
        },
    },
    Category: {
        products: async (parent, _, { prisma }) => {
            return await prisma.product.findMany({
                where: {
                    categoryId: parent.id,
                    isActive: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            });
        },
    },
};
//# sourceMappingURL=categories.js.map