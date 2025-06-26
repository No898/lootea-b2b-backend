import { Context } from '../context';
import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth';
import type {
  CreateProductInput,
  UpdateProductInput,
} from '../types/resolvers';

export const productResolvers = {
  Query: {
    products: async (
      _: any,
      {
        categoryId,
        search,
        limit = 50,
        offset = 0,
      }: {
        categoryId?: string;
        search?: string;
        limit?: number;
        offset?: number;
      },
      { prisma }: Context
    ) => {
      const where: any = {
        isActive: true,
      };

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
        take: limit,
        skip: offset,
      });
    },

    product: async (
      _: any,
      { id, slug }: { id?: string; slug?: string },
      { prisma }: Context
    ) => {
      if (!id && !slug) {
        throw new GraphQLError('Musíte zadat buď ID nebo slug produktu');
      }

      const where = id ? { id } : { slug: slug! };

      return await prisma.product.findUnique({
        where,
        include: {
          category: true,
        },
      });
    },
  },

  Mutation: {
    createProduct: async (
      _: any,
      { input }: { input: CreateProductInput },
      context: Context
    ) => {
      await requireAdmin(context);

      // Kontrola, zda slug už neexistuje
      const existingProduct = await context.prisma.product.findUnique({
        where: { slug: input.slug },
      });

      if (existingProduct) {
        throw new GraphQLError('Produkt s tímto slug už existuje');
      }

      // Kontrola, zda kategorie existuje
      const category = await context.prisma.category.findUnique({
        where: { id: input.categoryId },
      });

      if (!category) {
        throw new GraphQLError('Kategorie neexistuje');
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

    updateProduct: async (
      _: any,
      { id, input }: { id: string; input: UpdateProductInput },
      context: Context
    ) => {
      await requireAdmin(context);

      // Kontrola, zda produkt existuje
      const existingProduct = await context.prisma.product.findUnique({
        where: { id },
      });

      if (!existingProduct) {
        throw new GraphQLError('Produkt neexistuje');
      }

      // Kontrola slug konfliktu (pokud se mění)
      if (input.slug && input.slug !== existingProduct.slug) {
        const slugConflict = await context.prisma.product.findUnique({
          where: { slug: input.slug },
        });

        if (slugConflict) {
          throw new GraphQLError('Produkt s tímto slug už existuje');
        }
      }

      // Kontrola kategorie (pokud se mění)
      if (input.categoryId) {
        const category = await context.prisma.category.findUnique({
          where: { id: input.categoryId },
        });

        if (!category) {
          throw new GraphQLError('Kategorie neexistuje');
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

    deleteProduct: async (_: any, { id }: { id: string }, context: Context) => {
      await requireAdmin(context);

      // Kontrola, zda produkt existuje
      const product = await context.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new GraphQLError('Produkt neexistuje');
      }

      // Soft delete - jen označíme jako neaktivní
      await context.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });

      return true;
    },
  },

  Product: {
    currentPrice: async (parent: any, _: any, { prisma, user }: Context) => {
      // Pokud není uživatel přihlášený, vrátíme základní cenu
      if (!user) {
        return parent.basePrice;
      }

      // Zkusíme najít custom price pro tohoto uživatele
      const customPrice = await prisma.customPrice.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: parent.id,
          },
        },
      });

      return customPrice ? customPrice.price : parent.basePrice;
    },
  },
};
