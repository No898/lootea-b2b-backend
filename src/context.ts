import type { PrismaClient } from '@prisma/client';
import { extractToken, getUserFromToken, type AuthUser } from './utils/auth.js';

// User typ se teď importuje z auth utils

export interface Context {
  prisma: PrismaClient;
  user: AuthUser | null;
}

/**
 * Vytvoří context pro Apollo Server 4
 * Automaticky načte uživatele z JWT tokenu
 */
export const createContext = (prisma: PrismaClient) => {
  return async ({ req }: { req: any }): Promise<Context> => {
    // Extrahuj token z Authorization header
    const token = extractToken(req.headers.authorization);

    // Načti uživatele z tokenu (pokud existuje)
    const user = await getUserFromToken(token, prisma);

    return {
      prisma,
      user,
    };
  };
};
