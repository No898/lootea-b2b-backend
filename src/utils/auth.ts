import { GraphQLError } from 'graphql';
import { Context } from '../context.js';
import { UserRole } from '@prisma/client';

export function requireAuth(context: Context) {
  if (!context.user) {
    throw new GraphQLError('Pro tuto operaci se musíte přihlásit', {
      extensions: { code: 'UNAUTHENTICATED' },
    });
  }
  return context.user;
}

export function requireAdmin(context: Context) {
  const user = requireAuth(context);

  // Pro jednodušší testování, načteme uživatele z DB
  // V produkci bychom měli roli už v JWT tokenu
  return context.prisma.user
    .findUnique({
      where: { id: user.id },
    })
    .then(fullUser => {
      if (!fullUser || fullUser.role !== UserRole.ADMIN) {
        throw new GraphQLError('Pro tuto operaci potřebujete admin oprávnění', {
          extensions: { code: 'FORBIDDEN' },
        });
      }
      return fullUser;
    });
}

export function requireActiveAccount(context: Context) {
  return requireAuth(context);
  // Dodatečné kontroly active accountu můžeme přidat později
}
