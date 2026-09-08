// src/http-layer/service/emailjs.provider.ts

import type { IEmailProvider, EmailTemplateParams } from './email-provider.interface';

export interface EmailJSConfig {
    serviceId: string;
    templateId: string;
    publicKey: string;
    privateKey?: string;
}

export class EmailJSProvider implements IEmailProvider {
    private readonly API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

    constructor(private readonly config: EmailJSConfig) {}

    async sendTemplate(params: EmailTemplateParams): Promise<void> {
        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        if (this.config.privateKey) {
            headers['Authorization'] = `Bearer ${this.config.privateKey}`;
        }

        const payload = {
            service_id: this.config.serviceId,
            template_id: this.config.templateId,
            user_id: this.config.publicKey,
            template_params: params,
        };

        const response = await fetch(this.API_URL, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const body = await response.text();
            throw new Error(
                `EmailJS send failed with status ${response.status}: ${body || response.statusText}`
            );
        }
    }
}