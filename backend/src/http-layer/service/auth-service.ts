import type { IUserStore } from '../../infra/store/Iuser.store';
import type { IWallet } from '../../domain/engine/interface/Iwallet';
import type { Balance } from '../../domain/engine/interface/Ibalance';
import { PasswordService } from '../../infra/auth/password';
import { JWTService } from '../../infra/auth/jwt';
import type { User } from '../../domain/auth/userI';

export class AuthService {
    constructor(private userStore: IUserStore, private walletStore: IWallet<Balance>) {}

    async register(email: string, username: string, password: string) {
        const existing = await this.userStore.findByEmail(email);
        if (existing) {
            throw new Error('User already exists');
        }

        const passwordHash = await PasswordService.hash(password);
        const user = await this.userStore.createUser(username, email, passwordHash);

        if ('createWallet' in this.walletStore && typeof (this.walletStore as any).createWallet === 'function') {
            await (this.walletStore as any).createWallet(user.id);
        }

        const token = JWTService.generate({
            userId: user.id,
            email: user.email,
        });

        const { passwordHash: _, ...userWithoutPassword } = user;
        return { user: userWithoutPassword, token };
    }

    async login(email: string, password: string) {
        const user = await this.userStore.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const valid = await PasswordService.verify(password, user.passwordHash);
        if (!valid) {
            throw new Error('Invalid credentials');
        }

        const token = JWTService.generate({
            userId: user.id,
            email: user.email,
        });

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
