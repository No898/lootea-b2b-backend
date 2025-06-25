import jwt from 'jsonwebtoken';
export const createContext = (prisma) => {
    return ({ request }) => {
        const token = request.headers.authorization?.replace('Bearer ', '');
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
            req: request,
        };
    };
};
//# sourceMappingURL=context.js.map