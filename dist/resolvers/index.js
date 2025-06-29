import { authResolvers } from './auth.js';
import { categoryResolvers } from './categories.js';
import { productResolvers } from './products.js';
import { orderResolvers } from './orders.js';
import { adminResolvers } from './admin.js';
import { paymentResolvers } from './payments.js';
export const resolvers = {
    Query: {
        ...authResolvers.Query,
        ...categoryResolvers.Query,
        ...productResolvers.Query,
        ...orderResolvers.Query,
        ...adminResolvers.Query,
        ...paymentResolvers.Query,
    },
    Mutation: {
        ...authResolvers.Mutation,
        ...categoryResolvers.Mutation,
        ...productResolvers.Mutation,
        ...orderResolvers.Mutation,
        ...adminResolvers.Mutation,
        ...paymentResolvers.Mutation,
    },
    Product: {
        ...productResolvers.Product,
    },
    Category: {
        ...categoryResolvers.Category,
    },
    Order: {
        ...orderResolvers.Order,
    },
    OrderItem: {
        ...orderResolvers.OrderItem,
    },
};
//# sourceMappingURL=index.js.map