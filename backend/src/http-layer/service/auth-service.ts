// src/http-layer/service/auth-service.ts

import { Inmemory_User } from '../../infra/store/inmemory-user.store';
import { Inmemory_WalletStore } from '../../infra/store/wallet-store';
import { PasswordService } from '../../infra/auth/password';
import { JWTService } from '../../infra/auth/jwt';
import type { User } from '../../domain/auth/userI';

export class AuthService {
    constructor(private userStore: Inmemory_User, private walletStore: Inmemory_WalletStore) {}

    async register(email: string, username: string, password: string) {
        // Check if user exists
        const existing = await this.userStore.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }

        // Hash password
        const passwordHash = await PasswordService.hash(password);

        // Create user
        const user = await this.userStore.createUser(username, email, passwordHash);

        // Create an empty wallet for the new user so balance queries succeed
        await this.walletStore.createWallet(user.id);

        //  FIX: Use user.id, not 'id'
        const token = JWTService.generate({
            userId: user.id,
            email: user.email,
        });

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async login(email: string, password: string) {
        // Find user
        const user = await this.userStore.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        // Verify password
        const valid = await PasswordService.verify(password, user.passwordHash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }

        // Generate token
        const token = JWTService.generate({
            userId: user.id,
            email: user.email,
        });

        // Return user without password hash
        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async verifyToken(token: string): Promise<Omit<User, 'passwordHash'>> {
        const payload = JWTService.verify(token);
        const user = await this.userStore.findById(payload.userId);
        if (!user) {
            throw new Error('User not found');
        }
        const { passwordHash: _, ...userWithoutPassword } = user;
        return userWithoutPassword;
    }
}