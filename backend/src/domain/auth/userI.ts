import type { IWallet } from "../engine/interface/Iwallet";

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string | null;
    provider: string;
    providerUserId: string | null;
    createdAt: Date;
    updatedAt: Date;
}