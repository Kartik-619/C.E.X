// src/infra/auth/jwt.ts

import jwt from 'jsonwebtoken';

export interface TokenPayload {
    userId: string;
    email: string;
}

export class JWTService {
    private static secret = process.env.JWT_SECRET || 'your-secret-key';
    private static expiresIn = '7d';

    static generate(payload: TokenPayload): string {
        // ✅ Correct: expiresIn goes in options object
        return jwt.sign(payload, this.secret, { expiresIn: this.expiresIn });
    }

    static verify(token: string): TokenPayload {
        try {
            return jwt.verify(token, this.secret) as TokenPayload;
        } catch {
            throw new Error('Invalid or expired token');
        }
    }
}