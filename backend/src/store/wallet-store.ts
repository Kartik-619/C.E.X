import type { Balance } from "../engine/interface/Ibalance";
import type { IWallet } from "../engine/interface/Iwallet";
interface Trade {

}
export class Inmemory_WalletStore implements IWallet<Balance> {
    private balance: Map<string, Map<string, Balance>>
    constructor() {
        this.balance = new Map();
    }

    async getBalance(userId: string, asset: string): Promise<Balance> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        const userBalance = this.balance.get(userId);
        if (!userBalance) {
            throw new Error("User doesnt exist");
        }
        const currentBalance = userBalance?.get(asset);
        if (!currentBalance) {
            throw new Error("No enteries for this UserId")
        }
        return currentBalance;
    }



    async lockFunds(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        let userBalance = this.balance.get(userId);
        if (!userBalance) {
            throw new Error("User doesnt exist");
        }
        let currentBalance = userBalance.get(asset);
        if (!currentBalance) {
            throw new Error("No enteries for this UserId")
        }
        if (currentBalance.amount< amount) {
            throw new Error(`Insufficient ${asset} balance for user ${userId}`);
        }
        currentBalance.amount -= amount;
        currentBalance.locked += amount;
    };
    async unlockFunds(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        let userBalance = this.balance.get(userId);
        if (!userBalance) {
            throw new Error("User doesnt exist");
        }
        let currentBalance = userBalance.get(asset);
        if (!currentBalance) {
            throw new Error("No enteries for this UserId")
        }
       
        currentBalance.locked -= amount;
        currentBalance.amount +=amount;

    };
    // Settlement operations
    async settleTrade(trade: Trade): Promise<void> {

    };

    // Administrative operations
    async deposit(userId: string, asset: string, amount: number): Promise<void> {
        if (!userId) {
            throw new Error("Invalid User");
        }
        let userBalance = this.balance.get(userId);
        if (!userBalance) {
            userBalance = new Map;
            this.balance.set(userId, userBalance);
        }
        let currentBalance = userBalance.get(asset);
        if (!currentBalance) {
            currentBalance = { amount: 0, locked: 0 }
            userBalance.set(asset, currentBalance);
        }
        currentBalance.amount += amount;
    };
    // async initialize(): Promise<void>{} };


}