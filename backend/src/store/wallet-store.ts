import type { Balance } from "../engine/interface/Ibalance";
import type{ IWallet } from "../engine/interface/Iwallet";
interface Trade{

}
export class Inmemory_WalletStore implements IWallet<Balance>{
    private balance:Map<string,Map<string,Balance>>
    constructor(){
        this.balance= new Map();
    }
   
    async  getBalance(userId: string, asset: string):Promise<Balance>{
    
    }
    async checkBalance(userId: string, asset: string, amount: number): Promise<void>{

    }

    async lockFunds(userId: string, asset: string, amount: number): Promise<void>{

    };
    async   unlockFunds(userId: string, asset: string, amount: number): Promise<void>{

    };
     // Settlement operations
    async settleTrade(trade: Trade): Promise<void>{

     };
    
     // Administrative operations
     async deposit(userId: string, asset: string, amount: number): Promise<void>{

     };
    // async initialize(): Promise<void>{} };

    
}