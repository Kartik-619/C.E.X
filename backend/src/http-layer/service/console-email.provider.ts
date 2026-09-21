// src/http-layer/service/console-email.provider.ts

import type { IEmailProvider, EmailTemplateParams } from './email-provider.interface';
import { Logger } from '../../infra/logging/logger';
import { LoggerFactory } from '../../infra/logging/logger.factory';
import { LogLevel } from '../../infra/logging/log-level';

export class ConsoleOtpProvider implements IEmailProvider {
    private readonly logger: Logger;

    constructor(logger?: Logger) {
        this.logger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    async sendTemplate(params: EmailTemplateParams): Promise<void> {
        const otp = typeof params.otp === 'string' ? params.otp : '';
        this.logger.log(LogLevel.INFO, `[ConsoleOtpProvider] OTP for ${params.to_email}: ${otp}`);
        this.logger.log(
            LogLevel.WARN,
            `[ConsoleOtpProvider] Email not actually sent to ${params.to_email} (console provider). ${params.message ?? ''}`,
        );
    }
}