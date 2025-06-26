import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
export const authResolvers = {
    Mutation: {
        register: async (_, { input }, { prisma }) => {
            const existingUser = await prisma.user.findUnique({
                where: { email: input.email },
            });
            if (existingUser) {
                throw new GraphQLError('Uživatel s tímto emailem už existuje', {
                    extensions: { code: 'USER_ALREADY_EXISTS' },
                });
            }
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
            const hashedPassword = await bcrypt.hash(input.password, 12);
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
            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return {
                token,
                user,
            };
        },
        login: async (_, { input }, { prisma }) => {
            const user = await prisma.user.findUnique({
                where: { email: input.email },
            });
            if (!user) {
                throw new GraphQLError('Neplatné přihlašovací údaje', {
                    extensions: { code: 'INVALID_CREDENTIALS' },
                });
            }
            const valid = await bcrypt.compare(input.password, user.password);
            if (!valid) {
                throw new GraphQLError('Neplatné přihlašovací údaje', {
                    extensions: { code: 'INVALID_CREDENTIALS' },
                });
            }
            if (!user.isActive) {
                throw new GraphQLError('Váš účet je deaktivován', {
                    extensions: { code: 'ACCOUNT_DISABLED' },
                });
            }
            const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
            return {
                token,
                user,
            };
        },
    },
    Query: {
        me: async (_, __, { prisma, user }) => {
            if (!user) {
                return null;
            }
            return await prisma.user.findUnique({
                where: { id: user.id },
            });
        },
    },
};
//# sourceMappingURL=auth.js.map