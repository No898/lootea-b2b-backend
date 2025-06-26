import jwt from 'jsonwebtoken';
export const createContext = (prisma) => {
    return async ({ req }) => {
        const token = req.headers.authorization?.replace('Bearer ', '');
        let user = null;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                user = { id: decoded.userId };
            }
            catch (error) {
                console.warn('Invalid JWT token:', error);
            }
        }
        return {
            prisma,
            user,
        };
    };
};
//# sourceMappingURL=context.js.map