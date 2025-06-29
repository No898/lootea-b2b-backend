import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
export var EmailTemplate;
(function (EmailTemplate) {
    EmailTemplate["REGISTRATION_CONFIRMATION"] = "registration-confirmation";
    EmailTemplate["ORDER_CONFIRMATION"] = "order-confirmation";
    EmailTemplate["PAYMENT_CONFIRMATION"] = "payment-confirmation";
    EmailTemplate["ORDER_SHIPPED"] = "order-shipped";
    EmailTemplate["ORDER_DELIVERED"] = "order-delivered";
    EmailTemplate["PAYMENT_FAILED"] = "payment-failed";
    EmailTemplate["ORDER_CANCELLED"] = "order-cancelled";
})(EmailTemplate || (EmailTemplate = {}));
export class EmailService {
    transporter;
    templatesCache = new Map();
    constructor() {
        this.transporter = this.createTransporter();
        this.initializeHandlebarsHelpers();
    }
    createTransporter() {
        const config = {
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_PORT === '465',
            auth: {
                user: process.env.SMTP_USER || '',
                pass: process.env.SMTP_PASS || '',
            },
        };
        if (!config.auth.user || !config.auth.pass) {
            console.warn('⚠️  SMTP credentials not configured. Email sending will be disabled.');
            return {
                sendMail: async (mailOptions) => {
                    console.log('📧 Mock email would be sent:');
                    console.log('  To:', mailOptions.to);
                    console.log('  Subject:', mailOptions.subject);
                    console.log('  HTML preview:', mailOptions.html?.substring(0, 200) + '...');
                    return { messageId: 'mock-' + Date.now() };
                },
            };
        }
        return nodemailer.createTransport(config);
    }
    initializeHandlebarsHelpers() {
        handlebars.registerHelper('formatPrice', (price) => {
            return new Intl.NumberFormat('cs-CZ', {
                style: 'currency',
                currency: 'CZK',
            }).format(price);
        });
        handlebars.registerHelper('formatDate', (date) => {
            return new Intl.DateTimeFormat('cs-CZ', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }).format(new Date(date));
        });
        handlebars.registerHelper('ifEquals', function (arg1, arg2, options) {
            return arg1 == arg2 ? options.fn(this) : options.inverse(this);
        });
    }
    async getTemplate(templateName) {
        if (this.templatesCache.has(templateName)) {
            return this.templatesCache.get(templateName);
        }
        try {
            const templatePath = path.join(process.cwd(), 'src', 'templates', 'emails', `${templateName}.hbs`);
            const templateContent = await fs.readFile(templatePath, 'utf-8');
            const template = handlebars.compile(templateContent);
            this.templatesCache.set(templateName, template);
            return template;
        }
        catch (error) {
            console.error(`❌ Failed to load email template: ${templateName}`, error);
            const fallbackTemplate = handlebars.compile(`
        <h1>{{subject}}</h1>
        <p>{{message}}</p>
        <p><em>Email template "${templateName}" not found.</em></p>
      `);
            this.templatesCache.set(templateName, fallbackTemplate);
            return fallbackTemplate;
        }
    }
    async sendTemplateEmail(to, subject, templateName, data) {
        try {
            const template = await this.getTemplate(templateName);
            const html = template({ ...data, subject });
            const mailOptions = {
                from: {
                    name: process.env.EMAIL_FROM_NAME || 'B2B Bubble Tea Shop',
                    address: process.env.EMAIL_FROM_ADDRESS ||
                        process.env.SMTP_USER ||
                        'noreply@example.com',
                },
                to,
                subject,
                html,
            };
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Email sent successfully: ${result.messageId}`);
            return true;
        }
        catch (error) {
            console.error('❌ Failed to send email:', error);
            return false;
        }
    }
    async sendRegistrationConfirmation(data) {
        return this.sendTemplateEmail(data.customerEmail, 'Vítejte v B2B Bubble Tea Shop', EmailTemplate.REGISTRATION_CONFIRMATION, data);
    }
    async sendOrderConfirmation(data) {
        return this.sendTemplateEmail(data.customerEmail, `Potvrzení objednávky ${data.orderNumber}`, EmailTemplate.ORDER_CONFIRMATION, data);
    }
    async sendPaymentConfirmation(data) {
        return this.sendTemplateEmail(data.customerName, `Platba za objednávku ${data.orderNumber} byla přijata`, EmailTemplate.PAYMENT_CONFIRMATION, data);
    }
    async sendOrderShipped(data) {
        return this.sendTemplateEmail(data.customerEmail, `Objednávka ${data.orderNumber} byla odeslána`, EmailTemplate.ORDER_SHIPPED, data);
    }
    async sendOrderDelivered(data) {
        return this.sendTemplateEmail(data.customerEmail, `Objednávka ${data.orderNumber} byla doručena`, EmailTemplate.ORDER_DELIVERED, data);
    }
    async sendPaymentFailed(data) {
        return this.sendTemplateEmail(data.customerName, `Problém s platbou za objednávku ${data.orderNumber}`, EmailTemplate.PAYMENT_FAILED, data);
    }
    async sendOrderCancelled(data) {
        return this.sendTemplateEmail(data.customerEmail, `Objednávka ${data.orderNumber} byla zrušena`, EmailTemplate.ORDER_CANCELLED, data);
    }
    async testConnection() {
        try {
            await this.transporter.verify();
            console.log('✅ SMTP connection verified');
            return true;
        }
        catch (error) {
            console.error('❌ SMTP connection failed:', error);
            return false;
        }
    }
}
let emailService = null;
export const getEmailService = () => {
    if (!emailService) {
        emailService = new EmailService();
    }
    return emailService;
};
export const createOrderEmailData = (order) => ({
    orderNumber: order.orderNumber,
    customerName: order.user.companyName || order.user.email,
    customerEmail: order.user.email,
    companyName: order.user.companyName,
    items: order.items.map((item) => ({
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
    })),
    subtotal: order.subtotal,
    shipping: order.shipping,
    total: order.total,
    shippingAddress: {
        street: order.shippingStreet,
        city: order.shippingCity,
        zipCode: order.shippingZipCode,
        country: order.shippingCountry,
    },
    trackingNumber: order.trackingNumber,
    paymentMethod: order.paymentMethod,
});
export const createRegistrationEmailData = (user) => ({
    customerName: user.companyName || user.email,
    customerEmail: user.email,
    companyName: user.companyName,
    loginUrl: `${process.env.FRONTEND_URL}/login`,
});
export const createPaymentEmailData = (order) => ({
    orderNumber: order.orderNumber,
    customerName: order.user.companyName || order.user.email,
    total: order.total,
    paymentMethod: order.paymentMethod || 'Comgate',
    paymentUrl: order.paymentId
        ? `${process.env.FRONTEND_URL}/payment/${order.paymentId}`
        : undefined,
});
//# sourceMappingURL=email.js.map