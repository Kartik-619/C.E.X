// src/http-layer/service/email-provider.factory.ts

import type { IEmailProvider } from './email-provider.interface';
import { EmailJSProvider } from './emailjs.provider';
import { ConsoleOtpProvider } from './console-email.provider';

export type EmailProviderMode = 'emailjs' | 'console';

export class EmailProviderFactory {
    static create(): IEmailProvider {
        const mode = (process.env.EMAIL_PROVIDER ?? '').toLowerCase().trim() as EmailProviderMode;

        if (mode === 'console') {
            return new ConsoleOtpProvider();
        }

        const serviceId = process.env.EMAIL_SERVICE_ID ?? '';
        const templateId = process.env.EMAIL_TEMPLATE_ID ?? '';
        const publicKey = process.env.EMAIL_PUBLIC_KEY ?? '';

        if (mode === 'emailjs' || (serviceId && templateId && publicKey)) {
            return new EmailJSProvider({
                serviceId,
                templateId,
                publicKey,
                privateKey: process.env.EMAIL_SERVICE_KEY,
            });
        }

        return new ConsoleOtpProvider();
    }
}