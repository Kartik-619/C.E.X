import type { Balance } from "./Ibalance";
import type { ITrade } from "./ITrade";
export interface IWallet <T>{
    // Read operations
    getBalance(userId: string, asset: string): Promise<Balance>;
    
    // Write operations
    lockFunds(userId: string, asset: string, amount: number): Promise<void>;
    unlockFunds(userId: string, asset: string, amount: number): Promise<void>;
    
    // Settlement operations
    settleTrade(trade: ITrade): Promise<void>;
    
    // Administrative operations
    deposit(userId: string, asset: string, amount: number): Promise<void>;
   // initialize(): Promise<void>;
  }