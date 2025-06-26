import { authResolvers } from './auth.js';
import { categoryResolvers } from './categories.js';
import { productResolvers } from './products.js';
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
//# sourceMappingURL=index.js.map