import type { IWallet } from "../engine/interface/Iwallet";

export interface User {
    id: string;
    username: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
   
}