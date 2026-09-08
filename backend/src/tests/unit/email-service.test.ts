// src/tests/unit/email-service.test.ts

import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import { EmailService } from '../../http-layer/service/email-service';
import { EmailJSProvider } from '../../http-layer/service/emailjs.provider';
import type { IEmailProvider, EmailTemplateParams } from '../../http-layer/service/email-provider.interface';
import { OtpService } from '../../http-layer/service/otp-service';
import { OTPService } from '../../infra/auth/otp';
import { LoggerFactory } from '../../infra/logging/logger.factory';
import { LogLevel } from '../../infra/logging/log-level';
import type { IUserStore } from '../../infra/store/Iuser.store';

describe('EmailService', () => {
    let mockProvider: IEmailProvider;
    let otpService: OTPService;
    let emailService: EmailService;
    const logger = LoggerFactory.createLogger('console', LogLevel.ERROR);

    beforeEach(() => {
        mockProvider = {
            sendTemplate: mock(async () => {}),
        };
        otpService = new OTPService();
        emailService = new EmailService(
            mockProvider,
            otpService,
            { fromName: 'CEX Support' },
            logger,
        );
    });

    afterEach(() => {
        otpService.stopCleanup();
    });

    it('should generate an OTP and send it via the email provider', async () => {
        const result = await emailService.sendOtpEmail('user-1', 'alice@test.com');

        expect(result.otp).toMatch(/^\d{4}$/);
        expect(result.ttlSeconds).toBe(300);
        expect(mockProvider.sendTemplate).toHaveBeenCalledWith({
            to_email: 'alice@test.com',
            to_name: 'alice@test.com',
            from_name: 'CEX Support',
            otp: result.otp,
            message: `This is your OTP: ${result.otp}`,
        });
    });

    it('should delete the generated OTP when email sending fails', async () => {
        mockProvider.sendTemplate = mock(async () => {
            throw new Error('SMTP down');
        });

        await expect(emailService.sendOtpEmail('user-1', 'alice@test.com')).rejects.toThrow('SMTP down');
        expect(otpService.getStoreSize()).toBe(0);
    });

    it('should verify a valid OTP', async () => {
        const { otp } = await emailService.sendOtpEmail('user-1', 'alice@test.com');
        expect(await emailService.verifyOtp('user-1', otp)).toBe(true);
    });

    it('should reject an invalid OTP', async () => {
        await emailService.sendOtpEmail('user-1', 'alice@test.com');
        expect(await emailService.verifyOtp('user-1', '9999')).toBe(false);
    });
});

describe('OtpService', () => {
    let mockUserStore: IUserStore;
    let mockEmailService: EmailService;
    let otpService: OtpService;

    const user = {
        id: 'user-1',
        username: 'alice',
        email: 'alice@test.com',
        passwordHash: 'hash',
        provider: 'local',
        providerUserId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    beforeEach(() => {
        mockUserStore = {
            findByEmail: mock(async (email: string) =>
                email === user.email ? user : null
            ),
            findById: mock(async () => null),
            createUser: mock(async () => user),
            delete: mock(async () => true),
            clearAll: mock(async () => {}),
            count: mock(async () => 1),
        };
        mockEmailService = {
            sendOtpEmail: mock(async () => ({ otp: '1234', ttlSeconds: 300 })),
            verifyOtp: mock(async () => true),
        } as unknown as EmailService;
        otpService = new OtpService(mockUserStore, mockEmailService);
    });

    it('should request an OTP for an existing user', async () => {
        const result = await otpService.requestOtp('alice@test.com');

        expect(result.userId).toBe('user-1');
        expect(result.email).toBe('alice@test.com');
        expect(result.ttlSeconds).toBe(300);
        expect(mockUserStore.findByEmail).toHaveBeenCalledWith('alice@test.com');
        expect(mockEmailService.sendOtpEmail).toHaveBeenCalledWith('user-1', 'alice@test.com');
    });

    it('should throw when requesting an OTP for an unknown email', async () => {
        await expect(otpService.requestOtp('ghost@test.com')).rejects.toThrow('User not found');
    });

    it('should verify an OTP for an existing user', async () => {
        expect(await otpService.verifyOtp('alice@test.com', '1234')).toBe(true);
        expect(mockEmailService.verifyOtp).toHaveBeenCalledWith('user-1', '1234');
    });

    it('should return false when verifying an OTP for an unknown user', async () => {
        expect(await otpService.verifyOtp('ghost@test.com', '1234')).toBe(false);
        expect(mockEmailService.verifyOtp).not.toHaveBeenCalled();
    });
});

describe('EmailJSProvider', () => {
    it('should store email credentials in configuration', () => {
        const provider = new EmailJSProvider({
            serviceId: 'service_abc',
            templateId: 'template_abc',
            publicKey: 'public_key',
            privateKey: 'private_key',
        });

        expect(provider).toBeInstanceOf(EmailJSProvider);
    });

    it('should throw when the EmailJS API request fails', async () => {
        const provider = new EmailJSProvider({
            serviceId: 'service_abc',
            templateId: 'template_abc',
            publicKey: 'public_key',
        });

        const originalFetch = globalThis.fetch;
        globalThis.fetch = mock(async () => new Response('failed', { status: 400 })) as unknown as typeof fetch;

        const params: EmailTemplateParams = {
            to_email: 'alice@test.com',
            to_name: 'alice',
        };

        try {
            await expect(provider.sendTemplate(params)).rejects.toThrow();
        } finally {
            globalThis.fetch = originalFetch;
        }
    });
});