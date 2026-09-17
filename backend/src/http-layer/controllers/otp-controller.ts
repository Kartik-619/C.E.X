// src/http-layer/controllers/otp-controller.ts

import type { OtpService } from '../service/otp-service';

export class OTPController {
    constructor(private readonly otpService: OtpService) {}

    async requestOtp(request: Request): Promise<Response> {
        try {
            const body = await request.json() as Record<string, string>;

            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body', 400);
            }

            const { email } = body;

            if (!email) {
                return this.errorResponse('Email is required', 400);
            }

            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                return this.errorResponse('Invalid email format', 400);
            }

            const result = await this.otpService.requestOtp(email);
            return this.successResponse({
                message: 'OTP sent successfully',
                email: result.email,
                ttlSeconds: result.ttlSeconds,
            });

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Failed to send OTP';
            return message === 'User not found'
                ? this.errorResponse('User not found', 404)
                : this.errorResponse(message, 500);
        }
    }

    async verifyOtp(request: Request): Promise<Response> {
        try {
            const body = await request.json() as Record<string, string>;

            if (!body || typeof body !== 'object') {
                return this.errorResponse('Invalid request body', 400);
            }

            const { email, code } = body;

            if (!email || !code) {
                return this.errorResponse('Email and code are required', 400);
            }

            const valid = await this.otpService.verifyOtp(email, code);

            if (!valid) {
                return this.errorResponse('Invalid or expired OTP', 400);
            }

            return this.successResponse({ message: 'OTP verified successfully', valid: true });
        } catch (error) {
            return this.errorResponse('Failed to verify OTP', 500);
        }
    }

    private successResponse(data: unknown, status: number = 200): Response {
        return new Response(
            JSON.stringify(data),
            { status, headers: { 'Content-Type': 'application/json' } }
        );
    }

    private errorResponse(message: string, status: number): Response {
        return new Response(
            JSON.stringify({ error: message }),
            { status, headers: { 'Content-Type': 'application/json' } }
        );
    }
}