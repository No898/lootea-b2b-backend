import { PrismaClient, User } from '@prisma/client';
import { FastifyRequest } from 'fastify';
export interface Context {
    prisma: PrismaClient;
    user?: User | null;
    req: FastifyRequest;
}
export declare const createContext: (prisma: PrismaClient) => ({ request }: {
    request: FastifyRequest;
}) => Context;
//# sourceMappingURL=context.d.ts.map