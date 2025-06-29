import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
import { cache } from '../utils/redis.js';
export const adminResolvers = {
    Query: {
        users: async (_, { limit = 50, offset = 0, search, isActive, }, context) => {
            requireAdmin(context.user);
            const where = {};
            if (search) {
                where.OR = [
                    { email: { contains: search, mode: 'insensitive' } },
                    { companyName: { contains: search, mode: 'insensitive' } },
                    { ico: { contains: search, mode: 'insensitive' } },
                ];
            }
            if (typeof isActive === 'boolean') {
                where.isActive = isActive;
            }
            return await context.prisma.user.findMany({
                where,
                orderBy: [{ createdAt: 'desc' }],
                take: Math.min(limit, 100),
                skip: offset,
                include: {
                    orders: {
                        select: {
                            id: true,
                            total: true,
                            status: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                    customPrices: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    basePrice: true,
                                },
                            },
                        },
                    },
                },
            });
        },
        user: async (_, { id }, context) => {
            requireAdmin(context.user);
            const user = await context.prisma.user.findUnique({
                where: { id },
                include: {
                    orders: {
                        include: {
                            items: {
                                include: {
                                    product: {
                                        select: {
                                            name: true,
                                            basePrice: true,
                                        },
                                    },
                                },
                            },
                        },
                        orderBy: { createdAt: 'desc' },
                    },
                    customPrices: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    basePrice: true,
                                    category: {
                                        select: {
                                            name: true,
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            });
            if (!user) {
                throw new GraphQLError('Uživatel neexistuje');
            }
            return user;
        },
        customPrices: async (_, { userId, productId, limit = 50, offset = 0, }, context) => {
            requireAdmin(context.user);
            const where = {};
            if (userId) {
                where.userId = userId;
            }
            if (productId) {
                where.productId = productId;
            }
            return await context.prisma.customPrice.findMany({
                where,
                include: {
                    user: {
                        select: {
                            id: true,
                            email: true,
                            companyName: true,
                        },
                    },
                    product: {
                        select: {
                            id: true,
                            name: true,
                            basePrice: true,
                            category: {
                                select: {
                                    name: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
                take: Math.min(limit, 100),
                skip: offset,
            });
        },
        analytics: async (_, __, context) => {
            requireAdmin(context.user);
            const cacheKey = 'analytics:dashboard';
            const cached = await cache.get(cacheKey);
            if (cached) {
                return cached;
            }
            const [totalUsers, activeUsers, totalOrders, pendingOrders, totalRevenue, monthlyRevenue, topProducts, recentOrders,] = await Promise.all([
                context.prisma.user.count({
                    where: { role: 'B2B_CUSTOMER' },
                }),
                context.prisma.user.count({
                    where: {
                        role: 'B2B_CUSTOMER',
                        isActive: true,
                    },
                }),
                context.prisma.order.count(),
                context.prisma.order.count({
                    where: { status: 'PENDING' },
                }),
                context.prisma.order.aggregate({
                    where: {
                        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                    },
                    _sum: { total: true },
                }),
                context.prisma.order.aggregate({
                    where: {
                        status: { in: ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'] },
                        createdAt: {
                            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
                        },
                    },
                    _sum: { total: true },
                }),
                context.prisma.orderItem.groupBy({
                    by: ['productId'],
                    _sum: { quantity: true },
                    _count: { _all: true },
                    orderBy: { _sum: { quantity: 'desc' } },
                    take: 10,
                }),
                context.prisma.order.findMany({
                    take: 10,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        user: {
                            select: {
                                email: true,
                                companyName: true,
                            },
                        },
                    },
                }),
            ]);
            const topProductIds = topProducts.map(tp => tp.productId);
            const productDetails = await context.prisma.product.findMany({
                where: { id: { in: topProductIds } },
                select: {
                    id: true,
                    name: true,
                    basePrice: true,
                    category: {
                        select: { name: true },
                    },
                },
            });
            const topProductsWithDetails = topProducts.map(tp => {
                const product = productDetails.find(p => p.id === tp.productId);
                return {
                    product,
                    totalQuantity: tp._sum.quantity || 0,
                    orderCount: tp._count._all,
                };
            });
            const analytics = {
                users: {
                    total: totalUsers,
                    active: activeUsers,
                    inactive: totalUsers - activeUsers,
                },
                orders: {
                    total: totalOrders,
                    pending: pendingOrders,
                    completed: totalOrders - pendingOrders,
                },
                revenue: {
                    total: totalRevenue._sum.total || 0,
                    monthly: monthlyRevenue._sum.total || 0,
                },
                topProducts: topProductsWithDetails,
                recentOrders,
            };
            await cache.set(cacheKey, analytics, 300);
            return analytics;
        },
    },
    Mutation: {
        updateUserStatus: async (_, { id, isActive }, context) => {
            requireAdmin(context.user);
            const user = await context.prisma.user.findUnique({
                where: { id },
            });
            if (!user) {
                throw new GraphQLError('Uživatel neexistuje');
            }
            if (user.role === 'ADMIN') {
                throw new GraphQLError('Nelze měnit status admin uživatele');
            }
            const updatedUser = await context.prisma.user.update({
                where: { id },
                data: { isActive },
                include: {
                    orders: {
                        select: {
                            id: true,
                            total: true,
                            status: true,
                            createdAt: true,
                        },
                        orderBy: { createdAt: 'desc' },
                        take: 5,
                    },
                    customPrices: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    basePrice: true,
                                },
                            },
                        },
                    },
                },
            });
            await cache.invalidatePattern('analytics:*');
            return updatedUser;
        },
        bulkUpdateUserStatus: async (_, { userIds, isActive }, context) => {
            requireAdmin(context.user);
            const users = await context.prisma.user.updateMany({
                where: {
                    id: { in: userIds },
                    role: 'B2B_CUSTOMER',
                },
                data: { isActive },
            });
            await cache.invalidatePattern('analytics:*');
            return {
                count: users.count,
                success: true,
            };
        },
        bulkSetCustomPrices: async (_, { prices, }, context) => {
            requireAdmin(context.user);
            const userIds = [...new Set(prices.map(p => p.userId))];
            const productIds = [...new Set(prices.map(p => p.productId))];
            const [users, products] = await Promise.all([
                context.prisma.user.findMany({
                    where: { id: { in: userIds } },
                    select: { id: true },
                }),
                context.prisma.product.findMany({
                    where: { id: { in: productIds } },
                    select: { id: true },
                }),
            ]);
            const validUserIds = new Set(users.map(u => u.id));
            const validProductIds = new Set(products.map(p => p.id));
            const validPrices = prices.filter(p => validUserIds.has(p.userId) && validProductIds.has(p.productId));
            if (validPrices.length === 0) {
                throw new GraphQLError('Žádné validní kombinace uživatel-produkt');
            }
            const results = await Promise.all(validPrices.map(price => context.prisma.customPrice.upsert({
                where: {
                    userId_productId: {
                        userId: price.userId,
                        productId: price.productId,
                    },
                },
                update: { price: price.price },
                create: {
                    userId: price.userId,
                    productId: price.productId,
                    price: price.price,
                },
            })));
            return {
                count: results.length,
                success: true,
            };
        },
    },
};
//# sourceMappingURL=admin.js.map