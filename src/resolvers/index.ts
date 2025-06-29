import { authResolvers } from './auth.js';
import { categoryResolvers } from './categories.js';
import { productResolvers } from './products.js';
import { orderResolvers } from './orders.js';
import { adminResolvers } from './admin.js';
import { paymentResolvers } from './payments.js';

export const resolvers: any = {
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
    currentPrice: parent => {
      if (parent.discountPrice && parent.discountPrice > 0) {
        return parent.discountPrice;
      }
      return parent.basePrice;
    },
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
