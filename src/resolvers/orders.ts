import { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { requireAuth, requireAdmin } from '../utils/auth.js';
import { cache } from '../utils/redis.js';
import { getEmailService, createOrderEmailData } from '../utils/email.js';
import type { CreateOrderInput } from '../types/resolvers.js';
import { Prisma } from '@prisma/client';

export const orderResolvers = {
  Query: {
    order: async (_: any, { id }: { id: string }, context: Context) => {
      const user = requireAuth(context.user);

      const order = await context.prisma.order.findUnique({
        where: { id },
        include: {
          user: true,
          items: {
            include: {
              productVariant: {
                include: {
                  product: true,
                  images: true,
                },
              },
            },
          },
        },
      });

      if (!order) {
        throw new GraphQLError('Objednávka neexistuje');
      }

      // User může vidět pouze své objednávky, admin může vidět všechny
      if (user.role !== 'ADMIN' && order.userId !== user.id) {
        throw new GraphQLError('Nemáte oprávnění k této objednávce');
      }

      return order;
    },

    // Admin queries
    orders: async (
      _: any,
      {
        status,
        userId,
        first = 50,
        after,
      }: {
        status?:
          | 'PENDING'
          | 'PAID'
          | 'PROCESSING'
          | 'SHIPPED'
          | 'DELIVERED'
          | 'CANCELLED';
        userId?: string;
        first?: number;
        after?: string;
      },
      context: Context
    ) => {
      requireAdmin(context.user);

      const where: Prisma.OrderWhereInput = {};
      if (status) {
        where.status = status;
      }
      if (userId) {
        where.userId = userId;
      }

      return await context.prisma.order.findMany({
        where,
        include: {
          user: true,
          items: {
            include: {
              productVariant: {
                include: {
                  product: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: Math.min(first, 100) + 1,
        ...(after && { cursor: { id: after } }),
      });
    },
  },

  Mutation: {
    createOrder: async (
      _: any,
      { input }: { input: CreateOrderInput },
      context: Context
    ) => {
      const user = requireAuth(context.user);

      if (!input.items || input.items.length === 0) {
        throw new GraphQLError(
          'Objednávka musí obsahovat alespoň jednu položku'
        );
      }

      const variantIds = input.items.map(item => item.productVariantId);
      const variants = await context.prisma.productVariant.findMany({
        where: {
          id: { in: variantIds },
          isActive: true,
          inStock: true,
        },
        include: {
          customPrices: {
            where: { userId: user.id },
          },
        },
      });

      if (variants.length !== variantIds.length) {
        throw new GraphQLError('Některé varianty produktu nejsou dostupné');
      }

      for (const item of input.items) {
        if (item.quantity <= 0) {
          throw new GraphQLError('Množství musí být větší než 0');
        }
        const variant = variants.find(v => v.id === item.productVariantId);
        if (
          variant &&
          variant.stockQuantity &&
          item.quantity > variant.stockQuantity
        ) {
          throw new GraphQLError(`Nedostatek zásob pro: ${variant.name}`);
        }
      }

      const orderNumber = await generateOrderNumber(context.prisma);

      let subtotal = 0;
      const orderItemsData: {
        productVariantId: string;
        quantity: number;
        unitPrice: number;
        total: number;
      }[] = [];

      for (const item of input.items) {
        const variant = variants.find(v => v.id === item.productVariantId)!;
        const unitPrice =
          variant.customPrices[0]?.price ||
          variant.discountPrice ||
          variant.price;
        const total = unitPrice * item.quantity;
        subtotal += total;

        orderItemsData.push({
          productVariantId: variant.id,
          quantity: item.quantity,
          unitPrice,
          total,
        });
      }

      const shipping = subtotal > 1000 ? 0 : 100;
      const totalAmount = subtotal + shipping;

      const order = await context.prisma.$transaction(async tx => {
        // Snižování skladu
        for (const item of input.items) {
          await tx.productVariant.update({
            where: { id: item.productVariantId },
            data: { stockQuantity: { decrement: item.quantity } },
          });
        }

        const newOrder = await tx.order.create({
          data: {
            orderNumber,
            userId: user.id,
            status: 'PENDING',
            subtotal,
            shipping,
            total: totalAmount,
            shippingStreet: input.shippingStreet || null,
            shippingCity: input.shippingCity || null,
            shippingZipCode: input.shippingZipCode || null,
            shippingCountry: input.shippingCountry || 'Czech Republic',
            customerNote: input.customerNote || null,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            user: true,
            items: {
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

        return newOrder;
      });

      // Invalidace cache a odeslání emailu
      await cache.invalidatePattern(`orders:user:${user.id}:*`);
      await cache.invalidatePattern('orders:admin:*');

      const emailService = getEmailService();
      const emailData = createOrderEmailData(order);
      emailService.sendOrderConfirmation(emailData).catch(error => {
        console.error('❌ Failed to send order confirmation email:', error);
      });

      return order;
    },

    updateOrderStatus: async (
      _: any,
      {
        id,
        status,
      }: {
        id: string;
        status: 'PAID' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
      },
      context: Context
    ) => {
      requireAdmin(context.user);

      const order = await context.prisma.order.findUnique({
        where: { id },
        include: { user: true },
      });

      if (!order) {
        throw new GraphQLError('Objednávka neexistuje');
      }

      const validTransitions: Record<string, string[]> = {
        PENDING: ['PAID', 'CANCELLED'],
        PAID: ['PROCESSING', 'CANCELLED'],
        PROCESSING: ['SHIPPED', 'CANCELLED'],
        SHIPPED: ['DELIVERED'],
        DELIVERED: [],
        CANCELLED: [],
      };

      if (!validTransitions[order.status].includes(status)) {
        throw new GraphQLError(
          `Nelze změnit status z ${order.status} na ${status}`
        );
      }

      const updatedOrder = await context.prisma.order.update({
        where: { id },
        data: {
          status,
          ...(status === 'PAID' && { paidAt: new Date() }),
          ...(status === 'SHIPPED' && { shippedAt: new Date() }),
          ...(status === 'DELIVERED' && { deliveredAt: new Date() }),
        },
      });

      // Zde by mohlo být odeslání emailu o změně statusu
      // ...

      return updatedOrder;
    },
  },

  Order: {
    user: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.user.findUnique({ where: { id: parent.userId } });
    },
    items: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.orderItem.findMany({
        where: { orderId: parent.id },
        include: {
          productVariant: {
            include: {
              product: true,
              images: true,
            },
          },
        },
      });
    },
  },

  OrderItem: {
    productVariant: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.productVariant.findUnique({
        where: { id: parent.productVariantId },
        include: {
          images: true,
          product: true,
        },
      });
    },
  },
};

/**
 * Generuje unikátní číslo objednávky ve formátu RRRRMMXXXX.
 * Např. 2023070001
 */
async function generateOrderNumber(
  prisma: Prisma.TransactionClient
): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = (now.getMonth() + 1).toString().padStart(2, '0');
  const prefix = `${year}${month}`;

  const lastOrder = await prisma.order.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
  });

  let sequence = 1;
  if (lastOrder) {
    const lastSequence = parseInt(lastOrder.orderNumber.substring(6), 10);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}
