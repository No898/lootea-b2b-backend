import { GraphQLError } from 'graphql';
import { requireAuth, requireAdmin } from '../utils/auth.js';
import { cache } from '../utils/redis.js';
import { getEmailService, createOrderEmailData } from '../utils/email.js';
export const orderResolvers = {
    Query: {
        myOrders: async (_, __, context) => {
            const user = requireAuth(context.user);
            return await context.prisma.order.findMany({
                where: { userId: user.id },
                include: {
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
        },
        order: async (_, { id }, context) => {
            const user = requireAuth(context.user);
            const order = await context.prisma.order.findUnique({
                where: { id },
                include: {
                    user: true,
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                },
                            },
                        },
                    },
                },
            });
            if (!order) {
                throw new GraphQLError('Objednávka neexistuje');
            }
            if (user.role !== 'ADMIN' && order.userId !== user.id) {
                throw new GraphQLError('Nemáte oprávnění k této objednávce');
            }
            return order;
        },
        orders: async (_, { status, limit = 50, offset = 0, }, context) => {
            requireAdmin(context.user);
            const where = {};
            if (status) {
                where.status = status;
            }
            return await context.prisma.order.findMany({
                where,
                include: {
                    user: true,
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
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
    },
    Mutation: {
        createOrder: async (_, { input }, context) => {
            const user = requireAuth(context.user);
            if (!input.items || input.items.length === 0) {
                throw new GraphQLError('Objednávka musí obsahovat alespoň jednu položku');
            }
            const productIds = input.items.map((item) => item.productId);
            const products = await context.prisma.product.findMany({
                where: {
                    id: { in: productIds },
                    isActive: true,
                    inStock: true,
                },
                include: {
                    customPrices: {
                        where: { userId: user.id },
                    },
                },
            });
            if (products.length !== productIds.length) {
                throw new GraphQLError('Některé produkty nejsou dostupné');
            }
            for (const item of input.items) {
                if (item.quantity <= 0) {
                    throw new GraphQLError('Množství musí být větší než 0');
                }
            }
            const orderNumber = await generateOrderNumber(context.prisma);
            let subtotal = 0;
            const orderItems = [];
            for (const item of input.items) {
                const product = products.find(p => p.id === item.productId);
                const unitPrice = product.customPrices.length > 0
                    ? product.customPrices[0].price
                    : product.basePrice;
                const total = unitPrice * item.quantity;
                subtotal += total;
                orderItems.push({
                    productId: product.id,
                    quantity: item.quantity,
                    unitPrice,
                    total,
                });
            }
            const shipping = subtotal > 1000 ? 0 : 100;
            const totalAmount = subtotal + shipping;
            const order = await context.prisma.$transaction(async (tx) => {
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
                            create: orderItems,
                        },
                    },
                    include: {
                        user: true,
                        items: {
                            include: {
                                product: {
                                    include: {
                                        category: true,
                                    },
                                },
                            },
                        },
                    },
                });
                return newOrder;
            });
            await cache.invalidatePattern(`orders:user:${user.id}:*`);
            await cache.invalidatePattern('orders:admin:*');
            const emailService = getEmailService();
            const emailData = createOrderEmailData(order);
            emailService.sendOrderConfirmation(emailData).catch(error => {
                console.error('❌ Failed to send order confirmation email:', error);
            });
            return order;
        },
        updateOrderStatus: async (_, { id, status }, context) => {
            requireAdmin(context.user);
            const order = await context.prisma.order.findUnique({
                where: { id },
                include: { user: true },
            });
            if (!order) {
                throw new GraphQLError('Objednávka neexistuje');
            }
            const validTransitions = {
                PENDING: ['PAID', 'CANCELLED'],
                PAID: ['PROCESSING', 'CANCELLED'],
                PROCESSING: ['SHIPPED', 'CANCELLED'],
                SHIPPED: ['DELIVERED'],
                DELIVERED: [],
                CANCELLED: [],
            };
            if (!validTransitions[order.status]?.includes(status)) {
                throw new GraphQLError(`Nelze změnit stav z ${order.status} na ${status}`);
            }
            const updateData = { status };
            if (status === 'PAID') {
                updateData.paidAt = new Date();
            }
            else if (status === 'SHIPPED') {
                updateData.shippedAt = new Date();
            }
            else if (status === 'DELIVERED') {
                updateData.deliveredAt = new Date();
            }
            const updatedOrder = await context.prisma.order.update({
                where: { id },
                data: updateData,
                include: {
                    user: true,
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                },
                            },
                        },
                    },
                },
            });
            await cache.invalidatePattern(`orders:user:${order.userId}:*`);
            await cache.invalidatePattern('orders:admin:*');
            return updatedOrder;
        },
        addTrackingNumber: async (_, { id, trackingNumber }, context) => {
            requireAdmin(context.user);
            const order = await context.prisma.order.findUnique({
                where: { id },
            });
            if (!order) {
                throw new GraphQLError('Objednávka neexistuje');
            }
            if (order.status !== 'PROCESSING' && order.status !== 'SHIPPED') {
                throw new GraphQLError('Tracking number lze přidat pouze k objednávkám ve stavu PROCESSING nebo SHIPPED');
            }
            const updatedOrder = await context.prisma.order.update({
                where: { id },
                data: {
                    trackingNumber,
                    ...(order.status === 'PROCESSING' && {
                        status: 'SHIPPED',
                        shippedAt: new Date(),
                    }),
                },
                include: {
                    user: true,
                    items: {
                        include: {
                            product: {
                                include: {
                                    category: true,
                                },
                            },
                        },
                    },
                },
            });
            await cache.invalidatePattern(`orders:user:${order.userId}:*`);
            await cache.invalidatePattern('orders:admin:*');
            return updatedOrder;
        },
    },
    Order: {
        user: async (parent, _, { prisma }) => {
            return await prisma.user.findUnique({
                where: { id: parent.userId },
            });
        },
        items: async (parent, _, { prisma }) => {
            return await prisma.orderItem.findMany({
                where: { orderId: parent.id },
                include: {
                    product: {
                        include: {
                            category: true,
                        },
                    },
                },
                orderBy: { id: 'asc' },
            });
        },
    },
    OrderItem: {
        product: async (parent, _, { prisma }) => {
            return await prisma.product.findUnique({
                where: { id: parent.productId },
                include: {
                    category: true,
                },
            });
        },
    },
};
async function generateOrderNumber(prisma) {
    const year = new Date().getFullYear();
    const prefix = `${year}`;
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
    let nextNumber = 1;
    if (lastOrder) {
        const lastNumber = parseInt(lastOrder.orderNumber.substring(prefix.length));
        nextNumber = lastNumber + 1;
    }
    return `${prefix}${nextNumber.toString().padStart(6, '0')}`;
}
//# sourceMappingURL=orders.js.map