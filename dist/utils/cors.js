export const getCorsConfig = () => {
    const isDevelopment = process.env.NODE_ENV === 'development';
    if (isDevelopment) {
        return {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: [
                'Content-Type',
                'Authorization',
                'X-Requested-With',
                'Accept',
                'Origin',
            ],
        };
    }
    const allowedOrigins = [
        process.env.FRONTEND_URL,
        'https://studio.apollographql.com',
    ].filter(Boolean);
    return {
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],
    };
};
export const apolloCorsConfig = {
    origin: process.env.NODE_ENV === 'development'
        ? true
        : [process.env.FRONTEND_URL, 'https://studio.apollographql.com'].filter(Boolean),
    credentials: true,
};
//# sourceMappingURL=cors.js.map