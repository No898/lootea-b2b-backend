import { Context } from '../context';
interface RegisterInput {
    email: string;
    password: string;
    companyName: string;
    ico?: string;
    dic?: string;
    phone?: string;
    street?: string;
    city?: string;
    zipCode?: string;
    country?: string;
}
interface LoginInput {
    email: string;
    password: string;
}
export declare const authResolvers: {
    Mutation: {
        register: (_: any, { input }: {
            input: RegisterInput;
        }, { prisma }: Context) => Promise<{
            token: string;
            user: {
                id: string;
                email: string;
                password: string;
                role: import(".prisma/client").$Enums.UserRole;
                companyName: string | null;
                ico: string | null;
                dic: string | null;
                phone: string | null;
                street: string | null;
                city: string | null;
                zipCode: string | null;
                country: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        }>;
        login: (_: any, { input }: {
            input: LoginInput;
        }, { prisma }: Context) => Promise<{
            token: string;
            user: {
                id: string;
                email: string;
                password: string;
                role: import(".prisma/client").$Enums.UserRole;
                companyName: string | null;
                ico: string | null;
                dic: string | null;
                phone: string | null;
                street: string | null;
                city: string | null;
                zipCode: string | null;
                country: string | null;
                isActive: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
        }>;
    };
    Query: {
        me: (_: any, __: any, { prisma, user }: Context) => Promise<{
            id: string;
            email: string;
            password: string;
            role: import(".prisma/client").$Enums.UserRole;
            companyName: string | null;
            ico: string | null;
            dic: string | null;
            phone: string | null;
            street: string | null;
            city: string | null;
            zipCode: string | null;
            country: string | null;
            isActive: boolean;
            createdAt: Date;
            updatedAt: Date;
        } | null>;
    };
};
export {};
//# sourceMappingURL=auth.d.ts.map