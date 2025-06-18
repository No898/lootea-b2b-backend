declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      DATABASE_URL: string;
      REDIS_URL: string;
      JWT_SECRET: string;
      PORT?: string;
      HOST?: string;

      // Email configuration (optional for now)
      SMTP_HOST?: string;
      SMTP_PORT?: string;
      SMTP_USER?: string;
      SMTP_PASS?: string;

      // Comgate configuration (optional for now)
      COMGATE_SECRET_KEY?: string;
      COMGATE_MERCHANT_ID?: string;
    }
  }
}

export {};
