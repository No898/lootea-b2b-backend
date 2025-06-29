import { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
import { cache } from '../utils/redis.js';
import { Prisma } from '@prisma/client';

export const adminResolvers = {
  Query: {
    // User management
    users: async (
      _: any,
      {
        limit = 50,
        offset = 0,
        search,
        isActive,
      }: {
        limit?: number;
        offset?: number;
        search?: string;
        isActive?: boolean;
      },
      context: Context
    ) => {
      requireAdmin(context.user);

      const where: Prisma.UserWhereInput = {};

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
      });
    },

    user: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context.user);

      const user = await context.prisma.user.findUnique({
        where: { id },
        include: {
          orders: {
            include: {
              items: {
                include: {
                  productVariant: true,
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          customPrices: {
            include: {
              productVariant: {
                include: {
                  product: true,
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

    // Analytics
    analytics: async (_: any, __: any, context: Context) => {
      requireAdmin(context.user);

      const cacheKey = 'analytics:dashboard';
      const cached = await cache.get(cacheKey);
      if (cached) {
        return JSON.parse(cached as string);
      }

      const [
        totalUsers,
        activeUsers,
        totalOrders,
        pendingOrders,
        totalRevenue,
        monthlyRevenue,
        topVariantItems,
      ] = await Promise.all([
        context.prisma.user.count({ where: { role: 'B2B_CUSTOMER' } }),
        context.prisma.user.count({
          where: { role: 'B2B_CUSTOMER', isActive: true },
        }),
        context.prisma.order.count(),
        context.prisma.order.count({ where: { status: 'PENDING' } }),
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
          by: ['productVariantId'],
          _sum: { quantity: true },
          _count: { _all: true },
          orderBy: { _sum: { quantity: 'desc' } },
          take: 10,
        }),
      ]);

      const topProductVariants = await context.prisma.productVariant.findMany({
        where: {
          id: { in: topVariantItems.map(item => item.productVariantId) },
        },
      });

      const topProducts = topVariantItems.map(item => {
        const variant = topProductVariants.find(
          p => p.id === item.productVariantId
        );
        return {
          productVariant: variant,
          totalQuantity: item._sum.quantity || 0,
          orderCount: item._count._all,
        };
      });

      const result = {
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
        topProducts,
      };

      await cache.set(cacheKey, JSON.stringify(result), 300); // Cache for 5 minutes

      return result;
    },
  },
  Mutation: {
    // User management
    updateUserStatus: async (
      _: any,
      { id, isActive }: { id: string; isActive: boolean },
      context: Context
    ) => {
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
      });

      await cache.invalidatePattern('analytics:*');
      return updatedUser;
    },

    bulkUpdateUserStatus: async (
      _: any,
      { userIds, isActive }: { userIds: string[]; isActive: boolean },
      context: Context
    ) => {
      requireAdmin(context.user);

      const { count } = await context.prisma.user.updateMany({
        where: {
          id: { in: userIds },
          role: 'B2B_CUSTOMER',
        },
        data: { isActive },
      });

      await cache.invalidatePattern('analytics:*');

      return {
        count,
        success: true,
      };
    },

    // Custom price bulk operations
    bulkSetCustomPrices: async (
      _: any,
      {
        prices,
      }: {
        prices: Array<{
          userId: string;
          productVariantId: string;
          price: number;
        }>;
      },
      context: Context
    ) => {
      requireAdmin(context.user);

      const userIds = [...new Set(prices.map(p => p.userId))];
      const productVariantIds = [
        ...new Set(prices.map(p => p.productVariantId)),
      ];

      const [users, productVariants] = await Promise.all([
        context.prisma.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true },
        }),
        context.prisma.productVariant.findMany({
          where: { id: { in: productVariantIds } },
          select: { id: true },
        }),
      ]);

      const validUserIds = new Set(users.map(u => u.id));
      const validProductVariantIds = new Set(productVariants.map(p => p.id));

      const validPrices = prices.filter(
        p =>
          validUserIds.has(p.userId) &&
          validProductVariantIds.has(p.productVariantId)
      );

      if (validPrices.length === 0) {
        throw new GraphQLError(
          'Žádné validní kombinace uživatel-varianta produktu'
        );
      }

      const results = await context.prisma.$transaction(
        validPrices.map(price =>
          context.prisma.customPrice.upsert({
            where: {
              userId_productVariantId: {
                userId: price.userId,
                productVariantId: price.productVariantId,
              },
            },
            update: { price: price.price },
            create: {
              userId: price.userId,
              productVariantId: price.productVariantId,
              price: price.price,
            },
          })
        )
      );

      return {
        count: results.length,
        success: true,
      };
    },
  },

  // We need to resolve nested relations for Admin queries
  User: {
    orders: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.order.findMany({
        where: { userId: parent.id },
        orderBy: { createdAt: 'desc' },
      });
    },
    customPrices: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.customPrice.findMany({
        where: { userId: parent.id },
        include: {
          productVariant: {
            include: {
              product: true,
            },
          },
        },
      });
    },
  },
};
