import { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../types/resolvers.js';

export const categoryResolvers = {
  Query: {
    categories: async (_: any, __: any, { prisma }: Context) => {
      return await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        include: {
          products: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      });
    },

    category: async (
      _: any,
      { id, slug }: { id?: string; slug?: string },
      { prisma }: Context
    ) => {
      if (!id && !slug) {
        throw new GraphQLError('Musíte zadat buď ID nebo slug kategorie');
      }

      const where = id ? { id } : { slug: slug! };

      return await prisma.category.findUnique({
        where,
        include: {
          products: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      });
    },
  },

  Mutation: {
    createCategory: async (
      _: any,
      { input }: { input: CreateCategoryInput },
      context: Context
    ) => {
      await requireAdmin(context);

      // Kontrola, zda už kategorie s tímto názvem nebo slug neexistuje
      const existing = await context.prisma.category.findFirst({
        where: {
          OR: [{ name: input.name }, { slug: input.slug }],
        },
      });

      if (existing) {
        throw new GraphQLError(
          'Kategorie s tímto názvem nebo slug už existuje'
        );
      }

      return await context.prisma.category.create({
        data: {
          ...input,
          sortOrder: input.sortOrder || 0,
        },
        include: {
          products: true,
        },
      });
    },

    updateCategory: async (
      _: any,
      { id, input }: { id: string; input: UpdateCategoryInput },
      context: Context
    ) => {
      await requireAdmin(context);

      // Kontrola, zda kategorie existuje
      const existingCategory = await context.prisma.category.findUnique({
        where: { id },
      });

      if (!existingCategory) {
        throw new GraphQLError('Kategorie neexistuje');
      }

      // Kontrola konfliktů názvu a slug (pouze pokud se mění)
      if (input.name || input.slug) {
        const conflicts: any[] = [];

        if (input.name && input.name !== existingCategory.name) {
          conflicts.push({ name: input.name });
        }

        if (input.slug && input.slug !== existingCategory.slug) {
          conflicts.push({ slug: input.slug });
        }

        if (conflicts.length > 0) {
          const existingConflict = await context.prisma.category.findFirst({
            where: {
              AND: [{ id: { not: id } }, { OR: conflicts }],
            },
          });

          if (existingConflict) {
            throw new GraphQLError(
              'Kategorie s tímto názvem nebo slug už existuje'
            );
          }
        }
      }

      return await context.prisma.category.update({
        where: { id },
        data: input,
        include: {
          products: {
            where: { isActive: true },
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          },
        },
      });
    },

    deleteCategory: async (
      _: any,
      { id }: { id: string },
      context: Context
    ) => {
      await requireAdmin(context);

      // Kontrola, zda kategorie existuje
      const category = await context.prisma.category.findUnique({
        where: { id },
        include: {
          products: true,
        },
      });

      if (!category) {
        throw new GraphQLError('Kategorie neexistuje');
      }

      // Kontrola, zda kategorie nemá aktivní produkty
      const activeProducts = category.products.filter(p => p.isActive);
      if (activeProducts.length > 0) {
        throw new GraphQLError('Nelze smazat kategorii s aktivními produkty');
      }

      // Soft delete - jen označíme jako neaktivní
      await context.prisma.category.update({
        where: { id },
        data: { isActive: false },
      });

      return true;
    },
  },

  Category: {
    products: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.product.findMany({
        where: {
          categoryId: parent.id,
          isActive: true,
        },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      });
    },
  },
};
