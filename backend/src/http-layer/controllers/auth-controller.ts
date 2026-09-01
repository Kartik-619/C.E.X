// src/http-layer/controllers/auth-controller.ts

import type { AuthService } from '../service/auth-service';
import { LoggerFactory } from '../../infra/logging/logger.factory';
import { LogLevel } from '../../infra/logging/log-level';
import { Logger } from '../../infra/logging/logger';

export class AuthController {
    private readonly logger: Logger;

    constructor(private authService: AuthService) {
        this.logger = LoggerFactory.createLogger('console', LogLevel.INFO);
    }

    async register(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, '[AuthController] Received register request');
        try {
            const body = await request.json() as Record<string, string>;

            if (!body || typeof body !== 'object') {
                this.logger.log(LogLevel.WARN, '[AuthController] Invalid request body for register');
                return this.errorResponse('Invalid request body', 400);
            }

            const { email, username, password } = body;

            if (!email || !username || !password) {
                this.logger.log(LogLevel.WARN, '[AuthController] Missing required fields for register');
                return this.errorResponse('Email, username, and password are required', 400);
            }

            if (password.length < 6) {
                return this.errorResponse('Password must be at least 6 characters', 400);
            }

            const result = await this.authService.register(email, username, password);
            this.logger.log(LogLevel.INFO, `[AuthController] User registered: ${result.user.email}`);
            return this.successResponse(result, 201);

        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[AuthController] Error in register: ${error.message}`);
            const status = error.message === 'User already exists' ? 409 : 500;
            return this.errorResponse(error.message, status);
        }
    }

    async login(request: Request): Promise<Response> {
        this.logger.log(LogLevel.INFO, '[AuthController] Received login request');
        try {
            const body = await request.json() as Record<string, string>;

            if (!body || typeof body !== 'object') {
                this.logger.log(LogLevel.WARN, '[AuthController] Invalid request body for login');
                return this.errorResponse('Invalid request body', 400);
            }

            const { email, password } = body;

            if (!email || !password) {
                this.logger.log(LogLevel.WARN, '[AuthController] Missing email or password for login');
                return this.errorResponse('Email and password are required', 400);
            }

            const result = await this.authService.login(email, password);
            this.logger.log(LogLevel.INFO, `[AuthController] User logged in: ${result.user.email}`);
            return this.successResponse(result);

        } catch (error: any) {
            this.logger.log(LogLevel.ERROR, `[AuthController] Error in login: ${error.message}`);
            return this.errorResponse('Invalid credentials', 401);
        }
    }

    private successResponse(data: unknown, status: number = 200): Response {
        return new Response(
            JSON.stringify(data),
            { status, headers: { 'Content-Type': 'application/json' } }
        );
    }

    private errorResponse(message: string, status: number): Response {
        this.logger.log(
            status >= 500 ? LogLevel.ERROR : LogLevel.WARN,
            `[AuthController] Sending error response: ${message} (Status: ${status})`
        );
        return new Response(
            JSON.stringify({ error: message }),
            { status, headers: { 'Content-Type': 'application/json' } }
        );
    }
}
