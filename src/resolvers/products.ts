import { Context } from '../context.js';
import { GraphQLError } from 'graphql';
import { requireAdmin } from '../utils/auth.js';
import type {
  CreateProductInput,
  UpdateProductInput,
  SetCustomPriceInput,
  CreateProductVariantInput,
  UpdateProductVariantInput,
} from '../types/resolvers.js';
import { Prisma } from '@prisma/client';

export const productResolvers = {
  Query: {
    products: async (
      _: any,
      {
        first = 10,
        after,
        search,
        categoryId,
        minPrice,
        maxPrice,
        // sortBy, // NOTE: Not used currently, sorting is hardcoded
      }: {
        first?: number;
        after?: string;
        search?: string;
        categoryId?: string;
        minPrice?: number;
        maxPrice?: number;
        // sortBy?: string;
      },
      context: Context
    ) => {
      const { prisma } = context;
      const take = Math.min(first, 50);

      const where: Prisma.ProductWhereInput = {
        isActive: true,
      };

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          {
            variants: {
              some: {
                OR: [
                  { name: { contains: search, mode: 'insensitive' } },
                  { sku: { contains: search, mode: 'insensitive' } },
                  { brand: { contains: search, mode: 'insensitive' } },
                  { flavor: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        ];
      }

      if (categoryId) {
        where.categoryId = categoryId;
      }

      if (typeof minPrice === 'number' || typeof maxPrice === 'number') {
        const priceFilter: Prisma.FloatFilter = {};
        if (typeof minPrice === 'number') {
          priceFilter.gte = minPrice;
        }
        if (typeof maxPrice === 'number') {
          priceFilter.lte = maxPrice;
        }
        where.variants = { some: { price: priceFilter } };
      }

      const totalCount = await prisma.product.count({ where });

      const orderBy: Prisma.ProductOrderByWithRelationInput = {
        createdAt: 'desc',
      };

      const products = await prisma.product.findMany({
        where,
        take: take + 1,
        ...(after && { cursor: { id: after } }),
        orderBy,
        include: {
          category: true,
          variants: {
            include: {
              images: true,
            },
          },
        },
      });

      const hasNextPage = products.length > take;
      const edges = (hasNextPage ? products.slice(0, -1) : products).map(
        product => ({
          cursor: product.id,
          node: product,
        })
      );

      return {
        totalCount,
        edges,
        pageInfo: {
          hasNextPage,
          hasPreviousPage: !!after,
          startCursor: edges.length > 0 ? edges[0].cursor : null,
          endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null,
        },
      };
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

    productBySlug: async (
      _: any,
      { slug }: { slug: string },
      { prisma }: Context
    ) => {
      if (!slug) {
        throw new GraphQLError('Musíte zadat slug produktu');
      }

      return await prisma.product.findUnique({
        where: { slug },
        include: {
          category: true,
          variants: {
            include: {
              images: true,
            },
            orderBy: {
              isDefault: 'desc',
            },
          },
        },
      });
    },

    productVariant: async (
      _: any,
      { id }: { id: string },
      { prisma }: Context
    ) => {
      return prisma.productVariant.findUnique({
        where: { id },
        include: {
          product: true,
          images: true,
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
      requireAdmin(context.user);
      const { prisma } = context;

      const category = await prisma.category.findUnique({
        where: { id: input.categoryId },
      });
      if (!category) throw new GraphQLError('Kategorie neexistuje');

      const existing = await prisma.product.findFirst({
        where: { OR: [{ name: input.name }, { slug: input.slug }] },
      });
      if (existing)
        throw new GraphQLError('Produkt s tímto názvem nebo slug už existuje');

      return await prisma.product.create({
        data: {
          ...input,
          sortOrder: input.sortOrder || 0,
        },
      });
    },

    updateProduct: async (
      _: any,
      { id, input }: { id: string; input: UpdateProductInput },
      context: Context
    ) => {
      requireAdmin(context.user);
      const { prisma } = context;

      const existingProduct = await prisma.product.findUnique({
        where: { id },
      });
      if (!existingProduct) throw new GraphQLError('Produkt neexistuje');

      return await prisma.product.update({
        where: { id },
        data: input,
      });
    },

    deleteProduct: async (_: any, { id }: { id: string }, context: Context) => {
      requireAdmin(context.user);
      await context.prisma.product.update({
        where: { id },
        data: { isActive: false },
      });
      return true;
    },

    createProductVariant: async (
      _: any,
      { input }: { input: CreateProductVariantInput },
      context: Context
    ) => {
      requireAdmin(context.user);
      const { productId, images, ...variantData } = input;

      const product = await context.prisma.product.findUnique({
        where: { id: productId },
      });
      if (!product) {
        throw new GraphQLError('Produkt neexistuje.');
      }

      return context.prisma.productVariant.create({
        data: {
          ...variantData,
          product: { connect: { id: productId } },
          images: {
            create: images || [],
          },
        },
      });
    },

    updateProductVariant: async (
      _: any,
      { id, input }: { id: string; input: UpdateProductVariantInput },
      context: Context
    ) => {
      requireAdmin(context.user);
      const { images, ...variantData } = input;

      if (images) {
        await context.prisma.image.deleteMany({
          where: { productVariantId: id },
        });
      }

      return context.prisma.productVariant.update({
        where: { id },
        data: {
          ...variantData,
          images: {
            create: images || [],
          },
        },
      });
    },

    setCustomPrice: async (
      _: any,
      { input }: { input: SetCustomPriceInput },
      context: Context
    ) => {
      requireAdmin(context.user);
      const { prisma } = context;

      const [user, productVariant] = await Promise.all([
        prisma.user.findUnique({ where: { id: input.userId } }),
        prisma.productVariant.findUnique({
          where: { id: input.productVariantId },
        }),
      ]);

      if (!user) throw new GraphQLError('Uživatel neexistuje');
      if (!productVariant)
        throw new GraphQLError('Varianta produktu neexistuje');

      return await prisma.customPrice.upsert({
        where: {
          userId_productVariantId: {
            userId: input.userId,
            productVariantId: input.productVariantId,
          },
        },
        update: { price: input.price },
        create: {
          userId: input.userId,
          productVariantId: input.productVariantId,
          price: input.price,
        },
        include: { user: true, productVariant: true },
      });
    },

    removeCustomPrice: async (
      _: any,
      {
        userId,
        productVariantId,
      }: { userId: string; productVariantId: string },
      context: Context
    ) => {
      requireAdmin(context.user);

      try {
        await context.prisma.customPrice.delete({
          where: {
            userId_productVariantId: {
              userId,
              productVariantId,
            },
          },
        });
        return true;
      } catch {
        throw new GraphQLError(
          'Vlastní cena neexistuje nebo již byla smazána.'
        );
      }
    },
  },

  Product: {
    currentPrice: async (parent: any, _: any, context: Context) => {
      const { user, prisma } = context;
      const defaultVariant = await prisma.productVariant.findFirst({
        where: { productId: parent.id, isDefault: true },
      });

      if (!defaultVariant) return null;

      if (!user) {
        return defaultVariant.discountPrice || defaultVariant.price;
      }

      const customPrice = await prisma.customPrice.findUnique({
        where: {
          userId_productVariantId: {
            userId: user.id,
            productVariantId: defaultVariant.id,
          },
        },
      });

      return (
        customPrice?.price ||
        defaultVariant.discountPrice ||
        defaultVariant.price
      );
    },

    category: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.category.findUnique({
        where: { id: parent.categoryId },
      });
    },

    images: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.image.findMany({
        where: { productVariant: { productId: parent.id } },
      });
    },

    variants: async (parent: any, _: any, { prisma }: Context) => {
      return await prisma.productVariant.findMany({
        where: { productId: parent.id },
      });
    },
  },

  ProductVariant: {
    currentPrice: async (parent: any, _: any, context: Context) => {
      const { user, prisma } = context;

      if (!user) {
        return parent.discountPrice || parent.price;
      }

      const customPrice = await prisma.customPrice.findUnique({
        where: {
          userId_productVariantId: {
            userId: user.id,
            productVariantId: parent.id,
          },
        },
      });
      return customPrice?.price || parent.discountPrice || parent.price;
    },
    product: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.product.findUnique({ where: { id: parent.productId } });
    },
    images: async (parent: any, _: any, { prisma }: Context) => {
      return prisma.image.findMany({ where: { productVariantId: parent.id } });
    },
  },
};
