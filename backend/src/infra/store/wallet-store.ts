import type { Balance } from "../../domain/engine/interface/Ibalance";
import type { IWallet } from "../../domain/engine/interface/Iwallet";
import type { ITrade } from "../../domain/engine/interface/ITrade";
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
            // Return empty balance instead of throwing
            return { available: 0, locked: 0 };
        }
        const currentBalance = userBalance?.get(asset);
        if (!currentBalance) {
            // Return empty balance instead of throwing
            return { available: 0, locked: 0 };
        }
        return currentBalance;
    }

async checkBalance(userId: string, asset: string, amount: number): Promise<boolean> {
    if (!userId) {
        throw new Error("Invalid User");
    }
    const userB = await this.balance.get(userId);
    if (!userB) {
        return false; // User doesn't exist, can't have balance
    }
    const currentBalance = userB?.get(asset);
    if (!currentBalance) {
        return false; // Asset doesn't exist, can't have balance
    }
    return currentBalance.available >= amount;
}

async lockFunds(userId: string, asset: string, amount: number): Promise<void> {
    if (!userId) {
        throw new Error("Invalid User");
    }
    
    // Get or create user balance
    let userBalance = this.balance.get(userId);
    if (!userBalance) {
        userBalance = new Map();
        this.balance.set(userId, userBalance);
    }
    
    // Get or create asset balance
    let currentBalance = userBalance.get(asset);
    if (!currentBalance) {
        currentBalance = { available: 0, locked: 0 };
        userBalance.set(asset, currentBalance);
    }
    
    if (currentBalance.available < amount) {
        throw new Error(`Insufficient ${asset} balance for user ${userId}`);
    }
    
    currentBalance.available -= amount;
    currentBalance.locked += amount;
}
async unlockFunds(userId: string, asset: string, amount: number): Promise<void> {
    if (!userId) {
        throw new Error("Invalid User");
    }
    
    // Get or create user balance
    let userBalance = this.balance.get(userId);
    if (!userBalance) {
        userBalance = new Map();
        this.balance.set(userId, userBalance);
    }
    
    // Get or create asset balance
    let currentBalance = userBalance.get(asset);
    if (!currentBalance) {
        currentBalance = { available: 0, locked: 0 };
        userBalance.set(asset, currentBalance);
    }
    
    if (currentBalance.locked < amount) {
        throw new Error(`Insufficient locked ${asset} balance for user ${userId}`);
    }
    
    currentBalance.locked -= amount;
    currentBalance.available += amount;
}
    // Settlement operations
  
  async settleTrade(trade: ITrade): Promise<void> {
        // 1. Validate trade
        if (
            !trade.buyerId ||
            !trade.sellerId ||
            !trade.symbol
        ) {
            throw new Error(
                "Invalid trade data: missing buyer, seller, or symbol"
            );
        }
    
        if (trade.price <= 0 || trade.quantity <= 0) {
            throw new Error("Invalid trade price or quantity");
        }
    
        // 2. Extract assets
        const [baseAsset, quoteAsset] = trade.symbol.split("/");
    
        if (!baseAsset || !quoteAsset) {
            throw new Error(
                `Invalid trading pair: ${trade.symbol}`
            );
        }
    
        const tradeValue = trade.price * trade.quantity;
    
        // 3. Get buyer
        const buyerBalance = this.balance.get(trade.buyerId);
    
        if (!buyerBalance) {
            throw new Error(
                `Buyer ${trade.buyerId} does not exist`
            );
        }
    
        // 4. Get seller
        const sellerBalance = this.balance.get(trade.sellerId);    
        if (!sellerBalance) {
            throw new Error(
                `Seller ${trade.sellerId} does not exist`
            );
        }
    
        // 5. Get buyer's quote balance
        // BTC/USD -> USD
        const buyerQuote = buyerBalance.get(quoteAsset);
    
        if (!buyerQuote) {
            throw new Error(
                `Buyer ${trade.buyerId} has no ${quoteAsset} balance`
            );
        }
    
        // 6. Get buyer's base balance
        // BTC/USD -> BTC
        let buyerBase = buyerBalance.get(baseAsset);
    
        if (!buyerBase) {
            buyerBase = {
                available: 0,
                locked: 0
            };
    
            buyerBalance.set(baseAsset, buyerBase);
        }
    
        // 7. Get seller's base balance
        const sellerBase = sellerBalance.get(baseAsset);
    
        if (!sellerBase) {
            throw new Error(
                `Seller ${trade.sellerId} has no ${baseAsset} balance`
            );
        }
    
        // 8. Get seller's quote balance
        let sellerQuote = sellerBalance.get(quoteAsset);
    
        if (!sellerQuote) {
            sellerQuote = {
                available: 0,
                locked: 0
            };
    
            sellerBalance.set(quoteAsset, sellerQuote);
        }
    
        // BUYER
        // Buyer already locked the USD when the order was accepted.
        if (buyerQuote.locked < tradeValue) {
            throw new Error(
                `Buyer ${trade.buyerId} does not have enough locked ${quoteAsset}`
            );
        }
    
        // Consume the locked USD.
        buyerQuote.locked -= tradeValue;
    
        // Give BTC to buyer.
        buyerBase.available += trade.quantity;
    
        // SELLER    
        // Seller already locked the BTC when the order was accepted.
        if (sellerBase.locked < trade.quantity) {
            throw new Error(
                `Seller ${trade.sellerId} does not have enough locked ${baseAsset}`
            );
        }    
        // Consume the locked BTC.
        sellerBase.locked -= trade.quantity;
    
        // Give USD to seller.
        sellerQuote.available += tradeValue;
    }
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
            currentBalance = { available: 0, locked: 0 }
            userBalance.set(asset, currentBalance);
        }
        currentBalance.available += amount;
    };
    // async initialize(): Promise<void>{} };


}