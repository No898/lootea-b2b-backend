import { Context } from '../context.js';
import bcrypt from 'bcrypt';
import { GraphQLError } from 'graphql';
import { generateToken } from '../utils/auth.js';
import {
  getEmailService,
  createRegistrationEmailData,
} from '../utils/email.js';
import type { RegisterInput, LoginInput } from '../types/resolvers.js';

export const authResolvers = {
  Mutation: {
    register: async (
      _: any,
      { input }: { input: RegisterInput },
      { prisma }: Context
    ) => {
      // Kontrola, zda už uživatel existuje
      const existingUser = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (existingUser) {
        throw new GraphQLError('Uživatel s tímto emailem už existuje', {
          extensions: { code: 'USER_ALREADY_EXISTS' },
        });
      }

      // Kontrola IČO pokud je zadáno
      if (input.ico) {
        const existingIco = await prisma.user.findUnique({
          where: { ico: input.ico },
        });

        if (existingIco) {
          throw new GraphQLError('Uživatel s tímto IČO už existuje', {
            extensions: { code: 'ICO_ALREADY_EXISTS' },
          });
        }
      }

      // Hash hesla
      const hashedPassword = await bcrypt.hash(input.password, 12);

      // Vytvoření uživatele
      const user = await prisma.user.create({
        data: {
          email: input.email,
          password: hashedPassword,
          companyName: input.companyName,
          ico: input.ico || null,
          dic: input.dic || null,
          phone: input.phone || null,
          street: input.street || null,
          city: input.city || null,
          zipCode: input.zipCode || null,
          country: input.country || 'Czech Republic',
        },
      });

      // Poslání registračního emailu (asynchronně, neblokuje odpověď)
      const emailService = getEmailService();
      const emailData = createRegistrationEmailData(user);
      emailService.sendRegistrationConfirmation(emailData).catch(error => {
        console.error('❌ Failed to send registration email:', error);
      });

      // Generování JWT tokenu
      const token = generateToken(user);

      return {
        token,
        user,
      };
    },

    login: async (
      _: any,
      { input }: { input: LoginInput },
      { prisma }: Context
    ) => {
      // Najít uživatele
      const user = await prisma.user.findUnique({
        where: { email: input.email },
      });

      if (!user) {
        throw new GraphQLError('Neplatné přihlašovací údaje', {
          extensions: { code: 'INVALID_CREDENTIALS' },
        });
      }

      // Kontrola hesla
      const valid = await bcrypt.compare(input.password, user.password);

      if (!valid) {
        throw new GraphQLError('Neplatné přihlašovací údaje', {
          extensions: { code: 'INVALID_CREDENTIALS' },
        });
      }

      // Kontrola, zda je účet aktivní
      if (!user.isActive) {
        throw new GraphQLError('Váš účet je deaktivován', {
          extensions: { code: 'ACCOUNT_DISABLED' },
        });
      }

      // Generování JWT tokenu
      const token = generateToken(user);

      return {
        token,
        user,
      };
    },
  },

  Query: {
    me: async (_: any, __: any, { prisma, user }: Context) => {
      if (!user) {
        return null;
      }

      return await prisma.user.findUnique({
        where: { id: user.id },
      });
    },
  },
};
