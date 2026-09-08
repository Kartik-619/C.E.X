// src/tests/unit/otpController.test.ts

import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { OTPController } from '../../http-layer/controllers/otp-controller';
import type { OtpService } from '../../http-layer/service/otp-service';

interface OtpResponse {
    message: string;
    email?: string;
    ttlSeconds?: number;
    valid?: boolean;
}

interface ErrorResponse {
    error: string;
}

async function parseBody<T>(response: Response): Promise<T> {
    return response.json() as Promise<T>;
}

function jsonRequest(body: unknown): Request {
    return new Request('http://localhost/api', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('OTPController', () => {
    let mockOtpService: OtpService;
    let controller: OTPController;

    beforeEach(() => {
        mockOtpService = {
            requestOtp: mock(async (email: string) => ({
                userId: 'user-1',
                email,
                ttlSeconds: 300,
            })),
            verifyOtp: mock(async (email: string, code: string) => true),
        } as unknown as OtpService;

        controller = new OTPController(mockOtpService);
    });

    describe('requestOtp', () => {
        it('should send an OTP email and return 200 on success', async () => {
            const response = await controller.requestOtp(
                jsonRequest({ email: 'alice@test.com' })
            );
            const data = await parseBody<OtpResponse>(response);

            expect(response.status).toBe(200);
            expect(data.message).toBe('OTP sent successfully');
            expect(data.email).toBe('alice@test.com');
            expect(data.ttlSeconds).toBe(300);
            expect(mockOtpService.requestOtp).toHaveBeenCalledWith('alice@test.com');
        });

        it('should return 400 when email is missing', async () => {
            const response = await controller.requestOtp(jsonRequest({}));
            const data = await parseBody<ErrorResponse>(response);

            expect(response.status).toBe(400);
            expect(data.error).toBe('Email is required');
        });

        it('should return 400 for an invalid email format', async () => {
            const response = await controller.requestOtp(
                jsonRequest({ email: 'not-an-email' })
            );
            const data = await parseBody<ErrorResponse>(response);

            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid email format');
        });

        it('should return 404 when the user does not exist', async () => {
            mockOtpService.requestOtp = mock(async () => {
                throw new Error('User not found');
            });

            const response = await controller.requestOtp(
                jsonRequest({ email: 'ghost@test.com' })
            );
            const data = await parseBody<ErrorResponse>(response);

            expect(response.status).toBe(404);
            expect(data.error).toBe('User not found');
        });
    });

    describe('verifyOtp', () => {
        it('should verify a valid OTP and return 200', async () => {
            const response = await controller.verifyOtp(
                jsonRequest({ email: 'alice@test.com', code: '1234' })
            );
            const data = await parseBody<OtpResponse>(response);

            expect(response.status).toBe(200);
            expect(data.valid).toBe(true);
            expect(mockOtpService.verifyOtp).toHaveBeenCalledWith('alice@test.com', '1234');
        });

        it('should return 400 when email or code is missing', async () => {
            const response = await controller.verifyOtp(
                jsonRequest({ email: 'alice@test.com' })
            );
            const data = await parseBody<ErrorResponse>(response);

            expect(response.status).toBe(400);
            expect(data.error).toBe('Email and code are required');
        });

        it('should return 400 for an invalid or expired OTP', async () => {
            mockOtpService.verifyOtp = mock(async () => false);

            const response = await controller.verifyOtp(
                jsonRequest({ email: 'alice@test.com', code: '9999' })
            );
            const data = await parseBody<ErrorResponse>(response);

            expect(response.status).toBe(400);
            expect(data.error).toBe('Invalid or expired OTP');
        });
    });
});