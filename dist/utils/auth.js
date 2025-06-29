import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
export const verifyToken = (token) => {
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new GraphQLError('Neplatný token', {
            extensions: { code: 'INVALID_TOKEN' },
        });
    }
};
export const extractToken = (authHeader) => {
    if (!authHeader)
        return null;
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return null;
    }
    return parts[1];
};
export const requireAuth = (user) => {
    if (!user) {
        throw new GraphQLError('Musíte být přihlášeni', {
            extensions: { code: 'UNAUTHENTICATED' },
        });
    }
    return user;
};
export const requireAdmin = (user) => {
    const authUser = requireAuth(user);
    if (authUser.role !== 'ADMIN') {
        throw new GraphQLError('Nemáte oprávnění k této operaci', {
            extensions: { code: 'FORBIDDEN' },
        });
    }
    return authUser;
};
export const getUserFromToken = async (token, prisma) => {
    if (!token)
        return null;
    try {
        const payload = verifyToken(token);
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
    }
    catch (error) {
        return null;
    }
};
export const generateToken = (user) => {
    return jwt.sign({
        userId: user.id,
        email: user.email,
        role: user.role,
    }, process.env.JWT_SECRET, { expiresIn: '7d' });
};
export function requireActiveAccount(user) {
    return requireAuth(user);
}
//# sourceMappingURL=auth.js.map