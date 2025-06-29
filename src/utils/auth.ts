import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import type { PrismaClient } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  role: 'ADMIN' | 'B2B_CUSTOMER';
}

export interface AuthUser {
  id: string;
  email: string;
  role: 'ADMIN' | 'B2B_CUSTOMER';
}

/**
 * Ověří JWT token a vrátí user data
 */
export const verifyToken = (token: string): JWTPayload => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    throw new GraphQLError('Neplatný token', {
      extensions: { code: 'INVALID_TOKEN' },
    });
  }
};

/**
 * Extrahuje token z Authorization header
 */
export const extractToken = (authHeader: string | undefined): string | null => {
  if (!authHeader) return null;

  // Očekáváme "Bearer TOKEN"
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
};

/**
 * Middleware pro ověření autentizace (pro resolvers)
 */
export const requireAuth = (user: AuthUser | null): AuthUser => {
  if (!user) {
    throw new GraphQLError('Musíte být přihlášeni', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return user;
};

/**
 * Middleware pro ověření admin role
 */
export const requireAdmin = (user: AuthUser | null): AuthUser => {
  const authUser = requireAuth(user);

  if (authUser.role !== 'ADMIN') {
    throw new GraphQLError('Nemáte oprávnění k této operaci', {
      extensions: { code: 'FORBIDDEN' },
    });
  }

  return authUser;
};

/**
 * Načte uživatele z databáze podle JWT tokenu
 */
export const getUserFromToken = async (
  token: string | null,
  prisma: PrismaClient
): Promise<AuthUser | null> => {
  if (!token) return null;

  try {
    const payload = verifyToken(token);

    // Ověříme, že uživatel stále existuje a je aktivní
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
    };
  } catch (error) {
    // Token je neplatný, vrátíme null (uživatel není přihlášen)
    return null;
  }
};

/**
 * Generuje nový JWT token
 */
export const generateToken = (user: {
  id: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
};

export function requireActiveAccount(user: AuthUser | null) {
  return requireAuth(user);
  // Dodatečné kontroly active accountu můžeme přidat později
}
