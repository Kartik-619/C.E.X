import type { User } from "../../domain/auth/userI";

export interface IUserStore {
    createUser(username: string, email: string, passwordHash: string): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    delete(email: string): Promise<boolean>;
    clearAll(): Promise<void>;
    count(): Promise<number>;
}
