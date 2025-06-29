import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
export const productResolvers = {
    Query: {
        products: async (_, { categoryId, search, limit = 50, offset = 0, }, { prisma }) => {
            const where = { isActive: true };
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
                take: Math.min(limit, 100),
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
            requireAdmin(context.user);
            const category = await context.prisma.category.findUnique({
                where: { id: input.categoryId },
            });
            if (!category) {
                throw new GraphQLError('Kategorie neexistuje');
            }
            const existing = await context.prisma.product.findFirst({
                where: {
                    OR: [{ name: input.name }, { slug: input.slug }],
                },
            });
            if (existing) {
                throw new GraphQLError('Produkt s tímto názvem nebo slug už existuje');
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
            requireAdmin(context.user);
            const existingProduct = await context.prisma.product.findUnique({
                where: { id },
            });
            if (!existingProduct) {
                throw new GraphQLError('Produkt neexistuje');
            }
            if (input.categoryId) {
                const category = await context.prisma.category.findUnique({
                    where: { id: input.categoryId },
                });
                if (!category) {
                    throw new GraphQLError('Kategorie neexistuje');
                }
            }
            if (input.name || input.slug) {
                const conflicts = [];
                if (input.name && input.name !== existingProduct.name) {
                    conflicts.push({ name: input.name });
                }
                if (input.slug && input.slug !== existingProduct.slug) {
                    conflicts.push({ slug: input.slug });
                }
                if (conflicts.length > 0) {
                    const existingConflict = await context.prisma.product.findFirst({
                        where: {
                            AND: [{ id: { not: id } }, { OR: conflicts }],
                        },
                    });
                    if (existingConflict) {
                        throw new GraphQLError('Produkt s tímto názvem nebo slug už existuje');
                    }
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
            requireAdmin(context.user);
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
        setCustomPrice: async (_, { input }, context) => {
            requireAdmin(context.user);
            const [user, product] = await Promise.all([
                context.prisma.user.findUnique({ where: { id: input.userId } }),
                context.prisma.product.findUnique({ where: { id: input.productId } }),
            ]);
            if (!user) {
                throw new GraphQLError('Uživatel neexistuje');
            }
            if (!product) {
                throw new GraphQLError('Produkt neexistuje');
            }
            return await context.prisma.customPrice.upsert({
                where: {
                    userId_productId: {
                        userId: input.userId,
                        productId: input.productId,
                    },
                },
                update: {
                    price: input.price,
                },
                create: {
                    userId: input.userId,
                    productId: input.productId,
                    price: input.price,
                },
                include: {
                    user: true,
                    product: true,
                },
            });
        },
        removeCustomPrice: async (_, { userId, productId }, context) => {
            requireAdmin(context.user);
            try {
                await context.prisma.customPrice.delete({
                    where: {
                        userId_productId: {
                            userId,
                            productId,
                        },
                    },
                });
                return true;
            }
            catch (error) {
                throw new GraphQLError('Custom price neexistuje');
            }
        },
    },
    Product: {
        currentPrice: async (parent, _, { prisma, user }) => {
            if (user) {
                const customPrice = await prisma.customPrice.findUnique({
                    where: {
                        userId_productId: {
                            userId: user.id,
                            productId: parent.id,
                        },
                    },
                });
                if (customPrice) {
                    return customPrice.price;
                }
            }
            return parent.basePrice;
        },
        category: async (parent, _, { prisma }) => {
            return await prisma.category.findUnique({
                where: { id: parent.categoryId },
            });
        },
    },
};
//# sourceMappingURL=products.js.map