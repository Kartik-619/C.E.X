// src/tests/unit/auth-service.test.ts

import { describe, it, expect, beforeEach, beforeAll, mock } from 'bun:test';
import { AuthService } from '../../http-layer/service/auth-service';
import { PasswordService } from '../../infra/auth/password';
import { JWTService } from '../../infra/auth/jwt';
import type { IUserStore } from '../../infra/store/Iuser.store';
import type { IWallet } from '../../domain/engine/interface/Iwallet';
import type { Balance } from '../../domain/engine/interface/Ibalance';
import type { User } from '../../domain/auth/userI';

// ─── Helpers ───────────────────────────────────────────────────────

function makeUser(overrides: Partial<User> = {}): User {
    return {
        id: 'user-1',
        username: 'alice',
        email: 'alice@test.com',
        passwordHash: null,
        provider: 'local',
        providerUserId: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
        updatedAt: new Date('2026-01-01T00:00:00Z'),
        ...overrides,
    };
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('AuthService', () => {
    let passwordHash: string;
    let createUser: (username: string, email: string, passwordHash: string | null) => Promise<User>;
    let findByEmail: (email: string) => Promise<User | null>;
    let findById: (id: string) => Promise<User | null>;
    let createWallet: (userId: string) => Promise<void>;
    let service: AuthService;

    function buildService(): AuthService {
        const userStore = {
            createUser,
            findByEmail,
            findById,
            delete: async () => true,
            clearAll: async () => {},
            count: async () => 1,
        } as unknown as IUserStore;

        const walletStore = { createWallet } as unknown as IWallet<Balance>;

        return new AuthService(userStore, walletStore);
    }

    function useExistingUser(): void {
        findByEmail = mock(async () => makeUser({ passwordHash }));
        service = buildService();
    }

    beforeAll(async () => {
        passwordHash = await PasswordService.hash('correct-password');
    });

    beforeEach(() => {
        createUser = mock(async (username: string, email: string, hash: string | null) =>
            makeUser({ username, email, passwordHash: hash }));
        findByEmail = mock(async () => null);
        findById = mock(async (id: string) => makeUser({ id, passwordHash }));
        createWallet = mock(async () => {});
        service = buildService();
    });

    describe('register', () => {
        it('should create a wallet for the newly registered user', async () => {
            await service.register('alice@test.com', 'alice', 'correct-password');

            expect(createWallet).toHaveBeenCalledWith('user-1');
        });

        it('should return a token and a user without the password hash', async () => {
            const result = await service.register('alice@test.com', 'alice', 'correct-password');

            expect(typeof result.token).toBe('string');
            expect(result.user.email).toBe('alice@test.com');
            expect(result.user).not.toHaveProperty('passwordHash');
        });

        it('should reject an email that is already registered', async () => {
            useExistingUser();

            await expect(service.register('alice@test.com', 'alice', 'correct-password'))
                .rejects.toThrow('User already exists');
            expect(createWallet).not.toHaveBeenCalled();
        });
    });

    describe('login', () => {
        it('should return a token and the user without the password hash', async () => {
            useExistingUser();

            const result = await service.login('alice@test.com', 'correct-password');

            expect(typeof result.token).toBe('string');
            expect(result.user.id).toBe('user-1');
            expect(result.user).not.toHaveProperty('passwordHash');
        });

        it('should reject an unknown email', async () => {
            await expect(service.login('ghost@test.com', 'correct-password'))
                .rejects.toThrow('Invalid credentials');
        });

        it('should reject a wrong password', async () => {
            useExistingUser();

            await expect(service.login('alice@test.com', 'wrong-password'))
                .rejects.toThrow('Invalid credentials');
        });
    });

    describe('verifyToken', () => {
        it('should resolve the user behind a valid token without the password hash', async () => {
            const token = JWTService.generate({ userId: 'user-1', email: 'alice@test.com' });

            const user = await service.verifyToken(token);

            expect(user.id).toBe('user-1');
            expect(user).not.toHaveProperty('passwordHash');
            expect(findById).toHaveBeenCalledWith('user-1');
        });

        it('should reject a token whose user no longer exists', async () => {
            findById = mock(async () => null);
            service = buildService();
            const token = JWTService.generate({ userId: 'ghost', email: 'ghost@test.com' });

            await expect(service.verifyToken(token)).rejects.toThrow('User not found');
        });

        it('should reject a malformed token', async () => {
            await expect(service.verifyToken('not-a-jwt')).rejects.toThrow('Invalid or expired token');
        });
    });
});
