import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
export const productResolvers = {
    Query: {
        products: async (_, { categoryId, search, limit = 50, offset = 0, }, { prisma }) => {
            const where = {
                isActive: true,
            };
            if (categoryId) {
                where.categoryId = categoryId;
            }
            if (search) {
                where.OR = [
                    { name: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } },
                ];
            }
            return await prisma.product.findMany({
                where,
                include: {
                    category: true,
                },
                orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
                take: limit,
                skip: offset,
            });
        },
        product: async (_, { id, slug }, { prisma }) => {
            if (!id && !slug) {
                throw new GraphQLError('Musíte zadat buď ID nebo slug produktu');
            }
            const where = id ? { id } : { slug: slug };
            return await prisma.product.findUnique({
                where,
                include: {
                    category: true,
                },
            });
        },
    },
    Mutation: {
        createProduct: async (_, { input }, context) => {
            await requireAdmin(context);
            const existingProduct = await context.prisma.product.findUnique({
                where: { slug: input.slug },
            });
            if (existingProduct) {
                throw new GraphQLError('Produkt s tímto slug už existuje');
            }
            const category = await context.prisma.category.findUnique({
                where: { id: input.categoryId },
            });
            if (!category) {
                throw new GraphQLError('Kategorie neexistuje');
            }
            return await context.prisma.product.create({
                data: {
                    ...input,
                    sortOrder: input.sortOrder || 0,
                },
                include: {
                    category: true,
                },
            });
        },
        updateProduct: async (_, { id, input }, context) => {
            await requireAdmin(context);
            const existingProduct = await context.prisma.product.findUnique({
                where: { id },
            });
            if (!existingProduct) {
                throw new GraphQLError('Produkt neexistuje');
            }
            if (input.slug && input.slug !== existingProduct.slug) {
                const slugConflict = await context.prisma.product.findUnique({
                    where: { slug: input.slug },
                });
                if (slugConflict) {
                    throw new GraphQLError('Produkt s tímto slug už existuje');
                }
            }
            if (input.categoryId) {
                const category = await context.prisma.category.findUnique({
                    where: { id: input.categoryId },
                });
                if (!category) {
                    throw new GraphQLError('Kategorie neexistuje');
                }
            }
            return await context.prisma.product.update({
                where: { id },
                data: input,
                include: {
                    category: true,
                },
            });
        },
        deleteProduct: async (_, { id }, context) => {
            await requireAdmin(context);
            const product = await context.prisma.product.findUnique({
                where: { id },
            });
            if (!product) {
                throw new GraphQLError('Produkt neexistuje');
            }
            await context.prisma.product.update({
                where: { id },
                data: { isActive: false },
            });
            return true;
        },
    },
    Product: {
        currentPrice: async (parent, _, { prisma, user }) => {
            if (!user) {
                return parent.basePrice;
            }
            const customPrice = await prisma.customPrice.findUnique({
                where: {
                    userId_productId: {
                        userId: user.id,
                        productId: parent.id,
                    },
                },
            });
            return customPrice ? customPrice.price : parent.basePrice;
        },
    },
};
//# sourceMappingURL=products.js.map