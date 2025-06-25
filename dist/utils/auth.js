import { GraphQLError } from 'graphql';
import { UserRole } from '@prisma/client';
export function requireAuth(context) {
    if (!context.user) {
        throw new GraphQLError('Pro tuto operaci se musíte přihlásit', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    return context.user;
}
export function requireAdmin(context) {
    const user = requireAuth(context);
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
export function requireActiveAccount(context) {
    return requireAuth(context);
}
//# sourceMappingURL=auth.js.map