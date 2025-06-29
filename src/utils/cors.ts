import type { FastifyCorsOptions } from '@fastify/cors';

/**
 * CORS konfigurace pro různá prostředí
 */
export const getCorsConfig = (): FastifyCorsOptions => {
  const isDevelopment = process.env.NODE_ENV === 'development';

  if (isDevelopment) {
    // Development - povolíme vše
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

  // Production - specific origins
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'https://studio.apollographql.com', // Apollo Studio
    // Přidat další povolené domény
  ].filter(Boolean) as string[];

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

/**
 * CORS middleware pro Apollo Server
 */
export const apolloCorsConfig = {
  origin:
    process.env.NODE_ENV === 'development'
      ? true
      : [process.env.FRONTEND_URL, 'https://studio.apollographql.com'].filter(
          Boolean
        ),
  credentials: true,
};
