import { authResolvers } from './auth';
import { categoryResolvers } from './categories';
import { productResolvers } from './products';

export const resolvers = {
  Query: {
    ...authResolvers.Query,
    ...categoryResolvers.Query,
    ...productResolvers.Query,
  },
  Mutation: {
    ...authResolvers.Mutation,
    ...categoryResolvers.Mutation,
    ...productResolvers.Mutation,
  },
  Product: {
    ...productResolvers.Product,
  },
  Category: {
    ...categoryResolvers.Category,
  },
};
