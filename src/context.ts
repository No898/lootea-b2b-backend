import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

// Typ User se generuje z Prisma schema
type User = {
  id: string;
  email?: string;
  role?: string;
};

export interface Context {
  prisma: PrismaClient;
  user?: User | null;
}

export const createContext = (prisma: PrismaClient) => {
  return async ({ req }: { req: any }): Promise<Context> => {
    // Získání tokenu z headeru
    const token = req.headers.authorization?.replace('Bearer ', '');

    let user: User | null = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
          userId: string;
        };

        // V production můžeme user načíst z DB pro fresh data
        // Pro teď si uložíme jen userId do contextu
        user = { id: decoded.userId };
      } catch (error) {
        // Invalid token, user zůstane null
        console.warn('Invalid JWT token:', error);
      }
    }

    return {
      prisma,
      user,
    };
  };
};
