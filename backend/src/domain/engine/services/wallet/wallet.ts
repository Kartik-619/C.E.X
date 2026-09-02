import type { Balance } from "../../interface/Ibalance";
import type { ITrade } from "../../interface/ITrade";
import type { IWallet } from "../../interface/Iwallet";

export class Wallet implements IWallet<Balance> {
    private store: IWallet<Balance>;

    constructor(store: IWallet<Balance>) {
        this.store = store;
    }

    async getBalance(userId: string, asset: string): Promise<Balance> {
        return await this.store.getBalance(userId, asset);
    }

    async exists(userId: string): Promise<boolean> {
        return await this.store.exists(userId);
    }

    async createWallet(userId: string): Promise<void> {
        if ('createWallet' in this.store && typeof (this.store as any).createWallet === 'function') {
            return await (this.store as any).createWallet(userId);
        }
    }

    async checkBalance(userId: string, asset: string, amount: number): Promise<boolean> {
        return await this.store.checkBalance(userId, asset, amount);
    }

    async lockFunds(userId: string, asset: string, amount: number): Promise<void> {
        await this.store.lockFunds(userId, asset, amount);
    }

    async unlockFunds(userId: string, asset: string, amount: number): Promise<void> {
        await this.store.unlockFunds(userId, asset, amount);
    }

    async deposit(userId: string, asset: string, amount: number): Promise<void> {
        await this.store.deposit(userId, asset, amount);
    }

    async settleTrade(trade: ITrade): Promise<void> {
        await this.store.settleTrade(trade);
    }
}
