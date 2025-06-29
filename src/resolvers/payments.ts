/*
import { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { requireAuth, requireAdmin } from '../utils/auth.js';
import { getComgateClient } from '../utils/comgate.js';
import { cache } from '../utils/redis.js';

export const paymentResolvers = {
  Query: {
    // Získání stavu platby
    paymentStatus: async (
      _: any,
      { transId }: { transId: string },
      context: Context
    ) => {
      const user = requireAuth(context.user);

      try {
        const comgate = getComgateClient();
        const status = await comgate.getPaymentStatus(transId);

        // Najdeme objednávku podle paymentId
        const order = await context.prisma.order.findFirst({
          where: { paymentId: transId },
          include: { user: true },
        });

        if (!order) {
          throw new GraphQLError('Objednávka s tímto payment ID neexistuje');
        }

        // Kontrola oprávnění - user může vidět pouze své platby
        if (user.role !== 'ADMIN' && order.userId !== user.id) {
          throw new GraphQLError('Nemáte oprávnění k této platbě');
        }

        return {
          transId: status.transId,
          status: status.status,
          price: parseFloat(status.price) / 100, // Převod z haléřů
          curr: status.curr,
          method: status.method,
          order: order,
        };
      } catch (error) {
        console.error('❌ Payment status error:', error);
        throw new GraphQLError('Chyba při získávání stavu platby');
      }
    },
  },

  Mutation: {
    // Vytvoření platby pro objednávku
    createPayment: async (
      _: any,
      {
        orderId,
        method,
        returnUrl,
      }: {
        orderId: string;
        method?: string;
        returnUrl?: string;
      },
      context: Context
    ) => {
      const user = requireAuth(context.user);

      try {
        // Najdeme objednávku
        const order = await context.prisma.order.findUnique({
          where: { id: orderId },
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        if (!order) {
          throw new GraphQLError('Objednávka neexistuje');
        }

        // Kontrola oprávnění
        if (user.role !== 'ADMIN' && order.userId !== user.id) {
          throw new GraphQLError('Nemáte oprávnění k této objednávce');
        }

        // Kontrola stavu objednávky
        if (order.status !== 'PENDING') {
          throw new GraphQLError('Objednávka již byla zaplacena nebo zrušena');
        }

        // Už má platbu?
        if (order.paymentId) {
          throw new GraphQLError('Pro tuto objednávku již existuje platba');
        }

        // Vytvoření platby v Comgate
        const comgate = getComgateClient();

        const paymentRequest = {
          price: order.total,
          curr: 'CZK',
          label: `Objednávka ${order.orderNumber}`,
          refId: order.id,
          ...(method && { method }),
          email: order.user.email,
          name: order.user.companyName || `${order.user.email}`,
          lang: 'cs',
          shopNotificationUrl: `${process.env.APP_URL}/webhooks/comgate`,
          shopRedirectUrl:
            returnUrl || `${process.env.FRONTEND_URL}/orders/${order.id}`,
        };

        const paymentResponse = await comgate.createPayment(paymentRequest);

        if (paymentResponse.code !== 0) {
          throw new GraphQLError(
            `Chyba při vytváření platby: ${paymentResponse.message}`
          );
        }

        // Uložíme payment ID do objednávky
        const updatedOrder = await context.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentId: paymentResponse.transId || null,
            paymentMethod: method || 'comgate',
          },
          include: {
            user: true,
            items: {
              include: {
                product: true,
              },
            },
          },
        });

        // Invalidace cache
        await cache.invalidatePattern(`orders:user:${user.id}:*`);
        await cache.invalidatePattern('orders:admin:*');

        return {
          success: true,
          transId: paymentResponse.transId,
          redirectUrl: paymentResponse.redirect,
          order: updatedOrder,
        };
      } catch (error) {
        console.error('❌ Create payment error:', error);
        throw new GraphQLError(
          error instanceof GraphQLError
            ? error.message
            : 'Chyba při vytváření platby'
        );
      }
    },

    // Zrušení platby (admin only)
    cancelPayment: async (
      _: any,
      { transId }: { transId: string },
      context: Context
    ) => {
      requireAdmin(context.user);

      try {
        const comgate = getComgateClient();
        const success = await comgate.cancelPayment(transId);

        if (success) {
          // Najdeme a aktualizujeme objednávku
          const order = await context.prisma.order.findFirst({
            where: { paymentId: transId },
          });

          if (order) {
            await context.prisma.order.update({
              where: { id: order.id },
              data: { status: 'CANCELLED' },
            });

            // Invalidace cache
            await cache.invalidatePattern(`orders:user:${order.userId}:*`);
            await cache.invalidatePattern('orders:admin:*');
            await cache.invalidatePattern('analytics:*');
          }
        }

        return {
          success,
          message: success ? 'Platba byla zrušena' : 'Platbu nelze zrušit',
        };
      } catch (error) {
        console.error('❌ Cancel payment error:', error);
        throw new GraphQLError('Chyba při rušení platby');
      }
    },
  },
};
*/
export const paymentResolvers = {};
