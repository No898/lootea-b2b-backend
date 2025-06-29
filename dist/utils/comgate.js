import axios from 'axios';
import crypto from 'crypto-js';
export class ComgateClient {
    client;
    config;
    constructor(config) {
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
        this.client.interceptors.request.use(config => {
            console.log(`🔵 Comgate API Request: ${config.method?.toUpperCase()} ${config.url}`);
            return config;
        }, error => {
            console.error('🔴 Comgate API Request Error:', error);
            return Promise.reject(error);
        });
        this.client.interceptors.response.use(response => {
            console.log(`🟢 Comgate API Response: ${response.status} ${response.config.url}`);
            return response;
        }, error => {
            console.error('🔴 Comgate API Response Error:', error.response?.data || error.message);
            return Promise.reject(error);
        });
    }
    async createPayment(request) {
        try {
            const params = new URLSearchParams();
            params.append('merchant', this.config.merchant);
            params.append('test', this.config.test ? 'true' : 'false');
            params.append('price', (request.price * 100).toString());
            params.append('curr', request.curr || this.config.curr);
            params.append('label', request.label);
            params.append('refId', request.refId);
            params.append('country', request.country || this.config.country);
            if (request.method)
                params.append('method', request.method);
            if (request.email)
                params.append('email', request.email);
            if (request.phone)
                params.append('phone', request.phone);
            if (request.name)
                params.append('name', request.name);
            if (request.lang)
                params.append('lang', request.lang);
            if (request.prepareOnly)
                params.append('prepareOnly', 'true');
            if (request.initRecurring)
                params.append('initRecurring', 'true');
            if (request.verification)
                params.append('verification', 'true');
            if (request.embedded)
                params.append('embedded', 'true');
            if (request.eetReport)
                params.append('eetReport', 'true');
            if (request.dynamicExpiration)
                params.append('dynamicExpiration', 'true');
            if (request.expirationTime)
                params.append('expirationTime', request.expirationTime);
            if (request.shopNotificationUrl)
                params.append('shopNotificationUrl', request.shopNotificationUrl);
            if (request.shopRedirectUrl)
                params.append('shopRedirectUrl', request.shopRedirectUrl);
            const secret = this.generateSecret(params);
            params.append('secret', secret);
            const response = await this.client.post('/create', params);
            return {
                code: response.data.code,
                message: response.data.message,
                transId: response.data.transId,
                redirect: response.data.redirect,
            };
        }
        catch (error) {
            console.error('❌ Comgate createPayment error:', error);
            throw new Error(`Comgate API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPaymentStatus(transId) {
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
        }
        catch (error) {
            console.error('❌ Comgate getPaymentStatus error:', error);
            throw new Error(`Comgate API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    verifyWebhook(payload) {
        try {
            const params = new URLSearchParams();
            Object.entries(payload).forEach(([key, value]) => {
                if (key !== 'secret' && value !== undefined && value !== null) {
                    params.append(key, value.toString());
                }
            });
            const expectedSecret = this.generateSecret(params);
            return payload.secret === expectedSecret;
        }
        catch (error) {
            console.error('❌ Comgate webhook verification error:', error);
            return false;
        }
    }
    generateSecret(params) {
        const sortedParams = Array.from(params.entries()).sort(([a], [b]) => a.localeCompare(b));
        let hashString = '';
        sortedParams.forEach(([_, value]) => {
            hashString += value;
        });
        hashString += this.config.secret;
        return crypto.SHA256(hashString).toString();
    }
    getPaymentUrl(transId) {
        const baseUrl = this.config.test
            ? 'https://payments.comgate.cz'
            : 'https://payments.comgate.cz';
        return `${baseUrl}/client/instructions/index?id=${transId}`;
    }
    async cancelPayment(transId) {
        try {
            const params = new URLSearchParams();
            params.append('merchant', this.config.merchant);
            params.append('transId', transId);
            params.append('test', this.config.test ? 'true' : 'false');
            const secret = this.generateSecret(params);
            params.append('secret', secret);
            const response = await this.client.post('/cancel', params);
            return response.data.code === 0;
        }
        catch (error) {
            console.error('❌ Comgate cancelPayment error:', error);
            return false;
        }
    }
}
let comgateClient = null;
export const getComgateClient = () => {
    if (!comgateClient) {
        const config = {
            merchant: process.env.COMGATE_MERCHANT || '',
            secret: process.env.COMGATE_SECRET || '',
            test: process.env.NODE_ENV !== 'production',
            country: 'CZ',
            curr: 'CZK',
        };
        if (!config.merchant || !config.secret) {
            throw new Error('Comgate configuration missing. Please set COMGATE_MERCHANT and COMGATE_SECRET environment variables.');
        }
        comgateClient = new ComgateClient(config);
    }
    return comgateClient;
};
export const mapComgateStatusToOrderStatus = (comgateStatus) => {
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
//# sourceMappingURL=comgate.js.map