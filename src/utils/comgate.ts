import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto-js';

// Comgate API types
export interface ComgateConfig {
  merchant: string;
  secret: string;
  test: boolean;
  country: string;
  curr: string;
}

export interface CreatePaymentRequest {
  price: number;
  curr: string;
  label: string;
  refId: string;
  method?: string;
  email?: string;
  phone?: string;
  name?: string;
  lang?: string;
  prepareOnly?: boolean;
  initRecurring?: boolean;
  verification?: boolean;
  embedded?: boolean;
  eetReport?: boolean;
  eetData?: any;
  dynamicExpiration?: boolean;
  expirationTime?: string;
  shopNotificationUrl?: string;
  shopRedirectUrl?: string;
  country?: string;
}

export interface CreatePaymentResponse {
  code: number;
  message: string;
  transId?: string;
  redirect?: string;
}

export interface PaymentStatus {
  merchant: string;
  transId: string;
  test: string;
  price: string;
  curr: string;
  label: string;
  refId: string;
  method: string;
  email: string;
  name: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'AUTHORIZED';
  fee: string;
  vs?: string;
  txn?: string;
  secret: string;
}

export interface WebhookPayload {
  merchant: string;
  transId: string;
  test: string;
  price: string;
  curr: string;
  label: string;
  refId: string;
  method: string;
  email: string;
  name: string;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'AUTHORIZED';
  fee: string;
  vs?: string;
  txn?: string;
  secret: string;
}

export class ComgateClient {
  private client: AxiosInstance;
  private config: ComgateConfig;

  constructor(config: ComgateConfig) {
    this.config = config;

    const baseURL = config.test
      ? 'https://payments.comgate.cz/v1.0'
      : 'https://payments.comgate.cz/v1.0';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
    });

    // Request interceptor pro logging
    this.client.interceptors.request.use(
      config => {
        console.log(
          `🔵 Comgate API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      error => {
        console.error('🔴 Comgate API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      response => {
        console.log(
          `🟢 Comgate API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      error => {
        console.error(
          '🔴 Comgate API Response Error:',
          error.response?.data || error.message
        );
        return Promise.reject(error);
      }
    );
  }

  /**
   * Vytvoří novou platbu
   */
  async createPayment(
    request: CreatePaymentRequest
  ): Promise<CreatePaymentResponse> {
    try {
      // Příprava parametrů
      const params = new URLSearchParams();
      params.append('merchant', this.config.merchant);
      params.append('test', this.config.test ? 'true' : 'false');
      params.append('price', (request.price * 100).toString()); // Comgate očekává haléře
      params.append('curr', request.curr || this.config.curr);
      params.append('label', request.label);
      params.append('refId', request.refId);
      params.append('country', request.country || this.config.country);

      // Volitelné parametry
      if (request.method) params.append('method', request.method);
      if (request.email) params.append('email', request.email);
      if (request.phone) params.append('phone', request.phone);
      if (request.name) params.append('name', request.name);
      if (request.lang) params.append('lang', request.lang);
      if (request.prepareOnly) params.append('prepareOnly', 'true');
      if (request.initRecurring) params.append('initRecurring', 'true');
      if (request.verification) params.append('verification', 'true');
      if (request.embedded) params.append('embedded', 'true');
      if (request.eetReport) params.append('eetReport', 'true');
      if (request.dynamicExpiration) params.append('dynamicExpiration', 'true');
      if (request.expirationTime)
        params.append('expirationTime', request.expirationTime);
      if (request.shopNotificationUrl)
        params.append('shopNotificationUrl', request.shopNotificationUrl);
      if (request.shopRedirectUrl)
        params.append('shopRedirectUrl', request.shopRedirectUrl);

      // Generování podpisu
      const secret = this.generateSecret(params);
      params.append('secret', secret);

      const response = await this.client.post('/create', params);

      return {
        code: response.data.code,
        message: response.data.message,
        transId: response.data.transId,
        redirect: response.data.redirect,
      };
    } catch (error) {
      console.error('❌ Comgate createPayment error:', error);
      throw new Error(
        `Comgate API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Získá status platby
   */
  async getPaymentStatus(transId: string): Promise<PaymentStatus> {
    try {
      const params = new URLSearchParams();
      params.append('merchant', this.config.merchant);
      params.append('transId', transId);
      params.append('test', this.config.test ? 'true' : 'false');

      const secret = this.generateSecret(params);
      params.append('secret', secret);

      const response = await this.client.post('/status', params);

      if (response.data.code !== 0) {
        throw new Error(`Comgate API error: ${response.data.message}`);
      }

      return response.data;
    } catch (error) {
      console.error('❌ Comgate getPaymentStatus error:', error);
      throw new Error(
        `Comgate API error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Verifikuje webhook podpis
   */
  verifyWebhook(payload: WebhookPayload): boolean {
    try {
      const params = new URLSearchParams();

      // Přidáme všechny parametry kromě secret
      Object.entries(payload).forEach(([key, value]) => {
        if (key !== 'secret' && value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      const expectedSecret = this.generateSecret(params);

      return payload.secret === expectedSecret;
    } catch (error) {
      console.error('❌ Comgate webhook verification error:', error);
      return false;
    }
  }

  /**
   * Generuje secret hash pro API požadavky
   */
  private generateSecret(params: URLSearchParams): string {
    // Seřadíme parametry podle klíče
    const sortedParams = Array.from(params.entries()).sort(([a], [b]) =>
      a.localeCompare(b)
    );

    // Vytvoříme string pro hashování
    let hashString = '';
    sortedParams.forEach(([_, value]) => {
      hashString += value;
    });
    hashString += this.config.secret;

    // SHA-256 hash
    return crypto.SHA256(hashString).toString();
  }

  /**
   * Získá URL pro přesměrování na platbu
   */
  getPaymentUrl(transId: string): string {
    const baseUrl = this.config.test
      ? 'https://payments.comgate.cz'
      : 'https://payments.comgate.cz';

    return `${baseUrl}/client/instructions/index?id=${transId}`;
  }

  /**
   * Zruší platbu (pokud je to možné)
   */
  async cancelPayment(transId: string): Promise<boolean> {
    try {
      const params = new URLSearchParams();
      params.append('merchant', this.config.merchant);
      params.append('transId', transId);
      params.append('test', this.config.test ? 'true' : 'false');

      const secret = this.generateSecret(params);
      params.append('secret', secret);

      const response = await this.client.post('/cancel', params);

      return response.data.code === 0;
    } catch (error) {
      console.error('❌ Comgate cancelPayment error:', error);
      return false;
    }
  }
}

// Singleton instance
let comgateClient: ComgateClient | null = null;

export const getComgateClient = (): ComgateClient => {
  if (!comgateClient) {
    const config: ComgateConfig = {
      merchant: process.env.COMGATE_MERCHANT || '',
      secret: process.env.COMGATE_SECRET || '',
      test: process.env.NODE_ENV !== 'production',
      country: 'CZ',
      curr: 'CZK',
    };

    if (!config.merchant || !config.secret) {
      throw new Error(
        'Comgate configuration missing. Please set COMGATE_MERCHANT and COMGATE_SECRET environment variables.'
      );
    }

    comgateClient = new ComgateClient(config);
  }

  return comgateClient;
};

// Helper funkce pro mapování Comgate status na náš OrderStatus
export const mapComgateStatusToOrderStatus = (
  comgateStatus: string
): string => {
  switch (comgateStatus) {
    case 'PAID':
      return 'PAID';
    case 'CANCELLED':
      return 'CANCELLED';
    case 'PENDING':
    case 'AUTHORIZED':
    default:
      return 'PENDING';
  }
};
