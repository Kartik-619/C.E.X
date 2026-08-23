import type { Inmemory_WalletStore } from "../../../../infra/store/wallet-store";
import type { Balance } from "../../interface/Ibalance";
import type { ITrade } from "../../interface/ITrade";
import type { IWallet } from "../../interface/Iwallet";

export class Wallet implements  IWallet<Balance>{
    private store:Inmemory_WalletStore;
    constructor(store:Inmemory_WalletStore){
        this.store=store;
    };
    async getBalance(userId: string, asset: string): Promise<Balance> {
      return  this.store.getBalance(userId,asset)
    }
    async checkBalance(userId: string, asset: string, amount: number): Promise<boolean> {
        return this.store.checkBalance(userId,asset,amount)
    }
    async lockFunds(userId: string, asset: string, amount: number): Promise<void> {
        this.store.lockFunds(userId,asset,amount);
    }
    async unlockFunds(userId: string, asset: string, amount: number): Promise<void> {
        this.store.unlockFunds(userId,asset,amount);
    }
    async deposit(userId: string, asset: string, amount: number): Promise<void> {
        this.store.deposit(userId,asset,amount)
    }
    async settleTrade(trade:ITrade): Promise<void> {
        this.store.settleTrade(trade);
    }
}