import type { User } from "../../domain/auth/userI";
import type { IUserStore } from "./Iuser.store";

export class Inmemory_User implements IUserStore {

    private users!: Map<string, User>;
    private userById!: Map<string, User>;
    private userByEmail!: Map<string, User>;

    constructor() {
        this.users = new Map<string, User>();
        this.userByEmail = new Map<string, User>();
        this.userById = new Map<string, User>();
    }

    async createUser(username: string, email: string, passwordHash: string | null, provider: string = 'local', providerUserId: string | null = null): Promise<User> {
        const user: User = {
            id: crypto.randomUUID(),
            username,
            email,
            passwordHash,
            provider,
            providerUserId,
            createdAt: new Date(Date.now()),
            updatedAt: new Date(Date.now()),
        }
        this.users.set(email, user);
        this.userById.set(user.id, user);
        this.userByEmail.set(user.email, user);
        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.userByEmail.get(email) || null;
    }

    async findById(id: string): Promise<User | null> {
        return this.userById.get(id) || null;
    }

    async delete(email: string): Promise<boolean> {
        const user = this.userByEmail.get(email);
        if (!user) {
            return false;
        }
        this.userByEmail.delete(email);
        this.userById.delete(user.id);
        this.users.delete(email);
        return true;
    }

    async clearAll(): Promise<void> {
        this.users.clear();
        this.userById.clear();
        this.userByEmail.clear();
    }

    async count(): Promise<number> {
        return this.users.size;
    }
}
