import { extractToken, getUserFromToken } from './utils/auth.js';
export const createContext = (prisma) => {
    return async ({ req }) => {
        const token = extractToken(req.headers.authorization);
        const user = await getUserFromToken(token, prisma);
        return {
            prisma,
            user,
        };
    };
};
//# sourceMappingURL=context.js.map