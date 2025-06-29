import nodemailer from 'nodemailer';
import handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';

// Email configuration
export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

// Email template data types
export interface OrderEmailData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  companyName?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress?: {
    street?: string;
    city?: string;
    zipCode?: string;
    country?: string;
  };
  trackingNumber?: string;
  paymentMethod?: string;
}

export interface RegistrationEmailData {
  customerName: string;
  customerEmail: string;
  companyName?: string;
  loginUrl: string;
}

export interface PaymentEmailData {
  orderNumber: string;
  customerName: string;
  total: number;
  paymentMethod: string;
  paymentUrl?: string | undefined;
}

// Email templates enum
export enum EmailTemplate {
  REGISTRATION_CONFIRMATION = 'registration-confirmation',
  ORDER_CONFIRMATION = 'order-confirmation',
  PAYMENT_CONFIRMATION = 'payment-confirmation',
  ORDER_SHIPPED = 'order-shipped',
  ORDER_DELIVERED = 'order-delivered',
  PAYMENT_FAILED = 'payment-failed',
  ORDER_CANCELLED = 'order-cancelled',
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, handlebars.TemplateDelegate> = new Map();

  constructor() {
    this.transporter = this.createTransporter();
    this.initializeHandlebarsHelpers();
  }

  private createTransporter(): nodemailer.Transporter {
    const config: EmailConfig = {
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || '',
      },
    };

    if (!config.auth.user || !config.auth.pass) {
      console.warn(
        '⚠️  SMTP credentials not configured. Email sending will be disabled.'
      );
      // Return mock transporter for development
      return {
        sendMail: async (mailOptions: any) => {
          console.log('📧 Mock email would be sent:');
          console.log('  To:', mailOptions.to);
          console.log('  Subject:', mailOptions.subject);
          console.log(
            '  HTML preview:',
            mailOptions.html?.substring(0, 200) + '...'
          );
          return { messageId: 'mock-' + Date.now() };
        },
      } as any;
    }

    return nodemailer.createTransport(config);
  }

  private initializeHandlebarsHelpers(): void {
    // Helper pro formátování ceny
    handlebars.registerHelper('formatPrice', (price: number) => {
      return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
      }).format(price);
    });

    // Helper pro formátování data
    handlebars.registerHelper('formatDate', (date: string | Date) => {
      return new Intl.DateTimeFormat('cs-CZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(date));
    });

    // Helper pro podmínky
    handlebars.registerHelper(
      'ifEquals',
      function (this: any, arg1: any, arg2: any, options: any) {
        return arg1 == arg2 ? options.fn(this) : options.inverse(this);
      }
    );
  }

  /**
   * Načte a zkompiluje email template
   */
  private async getTemplate(
    templateName: string
  ): Promise<handlebars.TemplateDelegate> {
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    try {
      const templatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        'emails',
        `${templateName}.hbs`
      );
      const templateContent = await fs.readFile(templatePath, 'utf-8');
      const template = handlebars.compile(templateContent);

      this.templatesCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`❌ Failed to load email template: ${templateName}`, error);
      // Fallback template
      const fallbackTemplate = handlebars.compile(`
        <h1>{{subject}}</h1>
        <p>{{message}}</p>
        <p><em>Email template "${templateName}" not found.</em></p>
      `);
      this.templatesCache.set(templateName, fallbackTemplate);
      return fallbackTemplate;
    }
  }

  /**
   * Pošle email s template
   */
  private async sendTemplateEmail(
    to: string,
    subject: string,
    templateName: string,
    data: any
  ): Promise<boolean> {
    try {
      const template = await this.getTemplate(templateName);
      const html = template({ ...data, subject });

      const mailOptions = {
        from: {
          name: process.env.EMAIL_FROM_NAME || 'B2B Bubble Tea Shop',
          address:
            process.env.EMAIL_FROM_ADDRESS ||
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
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      return false;
    }
  }

  /**
   * Registrační potvrzení
   */
  async sendRegistrationConfirmation(
    data: RegistrationEmailData
  ): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerEmail,
      'Vítejte v B2B Bubble Tea Shop',
      EmailTemplate.REGISTRATION_CONFIRMATION,
      data
    );
  }

  /**
   * Potvrzení objednávky
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerEmail,
      `Potvrzení objednávky ${data.orderNumber}`,
      EmailTemplate.ORDER_CONFIRMATION,
      data
    );
  }

  /**
   * Potvrzení platby
   */
  async sendPaymentConfirmation(data: PaymentEmailData): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerName,
      `Platba za objednávku ${data.orderNumber} byla přijata`,
      EmailTemplate.PAYMENT_CONFIRMATION,
      data
    );
  }

  /**
   * Oznámení o odeslání
   */
  async sendOrderShipped(data: OrderEmailData): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerEmail,
      `Objednávka ${data.orderNumber} byla odeslána`,
      EmailTemplate.ORDER_SHIPPED,
      data
    );
  }

  /**
   * Oznámení o doručení
   */
  async sendOrderDelivered(data: OrderEmailData): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerEmail,
      `Objednávka ${data.orderNumber} byla doručena`,
      EmailTemplate.ORDER_DELIVERED,
      data
    );
  }

  /**
   * Neúspěšná platba
   */
  async sendPaymentFailed(data: PaymentEmailData): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerName,
      `Problém s platbou za objednávku ${data.orderNumber}`,
      EmailTemplate.PAYMENT_FAILED,
      data
    );
  }

  /**
   * Zrušení objednávky
   */
  async sendOrderCancelled(data: OrderEmailData): Promise<boolean> {
    return this.sendTemplateEmail(
      data.customerEmail,
      `Objednávka ${data.orderNumber} byla zrušena`,
      EmailTemplate.ORDER_CANCELLED,
      data
    );
  }

  /**
   * Test email connectivity
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ SMTP connection verified');
      return true;
    } catch (error) {
      console.error('❌ SMTP connection failed:', error);
      return false;
    }
  }
}

// Singleton instance
let emailService: EmailService | null = null;

export const getEmailService = (): EmailService => {
  if (!emailService) {
    emailService = new EmailService();
  }
  return emailService;
};

// Helper funkce pro vytváření email dat z Prisma objektů
export const createOrderEmailData = (order: any): OrderEmailData => ({
  orderNumber: order.orderNumber,
  customerName: order.user.companyName || order.user.email,
  customerEmail: order.user.email,
  companyName: order.user.companyName,
  items: order.items.map((item: any) => ({
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

export const createRegistrationEmailData = (
  user: any
): RegistrationEmailData => ({
  customerName: user.companyName || user.email,
  customerEmail: user.email,
  companyName: user.companyName,
  loginUrl: `${process.env.FRONTEND_URL}/login`,
});

export const createPaymentEmailData = (order: any): PaymentEmailData => ({
  orderNumber: order.orderNumber,
  customerName: order.user.companyName || order.user.email,
  total: order.total,
  paymentMethod: order.paymentMethod || 'Comgate',
  paymentUrl: order.paymentId
    ? `${process.env.FRONTEND_URL}/payment/${order.paymentId}`
    : undefined,
});
