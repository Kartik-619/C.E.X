// src/http-layer/service/email-service.ts

import type { IEmailProvider } from './email-provider.interface';
import { OTPService } from '../../infra/auth/otp';
import { Logger } from '../../infra/logging/logger';
import { LoggerFactory } from '../../infra/logging/logger.factory';
import { LogLevel } from '../../infra/logging/log-level';

export interface EmailServiceConfig {
    fromName: string;
}

export class EmailService {
    private readonly logger: Logger;

    constructor(
        private readonly provider: IEmailProvider,
        private readonly otpService: OTPService,
        private readonly config: EmailServiceConfig,
        logger?: Logger,
    ) {
        this.logger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    async sendOtpEmail(userId: string, toEmail: string): Promise<{ otp: string; ttlSeconds: number }> {
        const otp = await this.otpService.generateOTP(userId);
        const ttlSeconds = Math.floor((5 * 60 * 1000) / 1000);

        try {
            await this.provider.sendTemplate({
                to_email: toEmail,
                to_name: toEmail,
                from_name: this.config.fromName,
                otp,
                message: `This is your OTP: ${otp}`,
            });
            this.logger.log(LogLevel.INFO, `[EmailService] OTP email sent to ${toEmail}`);
        } catch (error) {
            await this.otpService.deleteOTP(userId);
            this.logger.log(LogLevel.ERROR, `[EmailService] Failed to send OTP email to ${toEmail}: ${error instanceof Error ? error.message : String(error)}`);
            throw error;
        }

        return { otp, ttlSeconds };
    }

    async verifyOtp(userId: string, code: string): Promise<boolean> {
        const valid = await this.otpService.verifyOTP(userId, code);
        this.logger.log(
            valid ? LogLevel.INFO : LogLevel.WARN,
            `[EmailService] OTP verification for user ${userId}: ${valid ? 'valid' : 'invalid/expired'}`
        );
        return valid;
    }
}