// src/http-layer/middleware/auth-middleware.ts

import type { AuthService } from '../service/auth-service';
import type { User } from '../../domain/auth/userI';

export interface AuthContext {
    user: Omit<User, 'passwordHash'>;
}

export type AuthenticatedHandler = (request: Request, auth: AuthContext) => Promise<Response> | Response;

export class AuthMiddleware {
    constructor(private authService: AuthService) {}

    async authenticate(request: Request): Promise<AuthContext> {
        const header = request.headers.get('Authorization');
        if (!header || !header.startsWith('Bearer ')) {
            throw new Error('Missing or invalid Authorization header');
        }

        const token = header.slice(7);
        const user = await this.authService.verifyToken(token);
        return { user };
    }

    createHandler(handler: AuthenticatedHandler): (request: Request) => Promise<Response> {
        return async (request: Request): Promise<Response> => {
            try {
                const auth = await this.authenticate(request);
                return await handler(request, auth);
            } catch (error: any) {
                return new Response(
                    JSON.stringify({ error: error.message || 'Unauthorized' }),
                    { status: 401, headers: { 'Content-Type': 'application/json' } }
                );
            }
        };
    }
}
