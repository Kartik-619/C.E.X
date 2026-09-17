// src/http-layer/service/email-provider.interface.ts

export interface EmailTemplateParams {
    to_email: string;
    to_name: string;
    from_name?: string;
    [key: string]: unknown;
}

export interface IEmailProvider {
    sendTemplate(params: EmailTemplateParams): Promise<void>;
}