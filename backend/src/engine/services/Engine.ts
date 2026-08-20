// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/IMatchEngine";
import { OrderBook } from "./orderBook/orderBook";
import type { Order } from "../interface/IOrderBook";
import type { Wallet } from "./wallet/wallet";
import type { ITrade } from "../interface/ITrade";

export class StandardEngine extends AbstractEngine<Order> {


    // Inject the OrderBook and Wallet into the Engine
    constructor(orderBook: OrderBook, wallet: Wallet) {
        super(orderBook, wallet); // Must call super first!

    }
    async createOrder(order: Order) {
        const savedOrder = this.orderBook.placeOrder(order);
    }
    async processOrder(order: Order): Promise<Order> {
        console.log(
            `[Engine] Received new ${order.type} order for ${order.symbol}`
        );
    
        // 1. Validate that the user can afford the order
        await this.validateOrderBalance(order);
    
        // 2. Find a matching order
        const bestMatch = await this.getBestMatch(order);
    
        // 3. No match -> lock funds and add to book
        if (!bestMatch) {
            await this.lockOrderFunds(order);
            return await this.orderBook.placeOrder(order);
        }
    
        // 4. Match found -> lock funds for the incoming order
        await this.lockOrderFunds(order);
    
        // 5. Create and settle trade
        const trade = this.createTrade(bestMatch, order);
        await this.wallet.settleTrade(trade);
    
        // 6. Calculate remaining quantities
        const buyOrder = order.side === "buy" ? order : bestMatch;
        const sellOrder = order.side === "sell" ? order : bestMatch;
    
        const buyRemaining = buyOrder.quantity - trade.quantity;
        const sellRemaining = sellOrder.quantity - trade.quantity;
    
        // 7. Update BUY order
        if (buyRemaining === 0) {
            const existingBuy = await this.orderBook.getOrder(buyOrder.orderId);
            if (existingBuy) {
                await this.orderBook.cancelOrder(buyOrder.orderId);
            }
        } else {
            const existingBuy = await this.orderBook.getOrder(buyOrder.orderId);
            if (existingBuy) {
                await this.orderBook.updateOrder(buyOrder.orderId, buyRemaining);
            } else {
                await this.orderBook.placeOrder({
                    ...buyOrder,
                    quantity: buyRemaining
                });
            }
        }
    
        // 8. Update SELL order
        if (sellRemaining === 0) {
            const existingSell = await this.orderBook.getOrder(sellOrder.orderId);
            if (existingSell) {
                await this.orderBook.cancelOrder(sellOrder.orderId);
            }
        } else {
            const existingSell = await this.orderBook.getOrder(sellOrder.orderId);
            if (existingSell) {
                await this.orderBook.updateOrder(sellOrder.orderId, sellRemaining);
            } else {
                await this.orderBook.placeOrder({
                    ...sellOrder,
                    quantity: sellRemaining
                });
            }
        }
    
        return order;
    }

    private async lockOrderFunds(order: Order): Promise<void> {

        const [baseAsset, quoteAsset] =
            order.symbol.split("/");
    
        if (!baseAsset || !quoteAsset) {
            throw new Error(
                `Invalid trading pair: ${order.symbol}`
            );
        }
    
        if (order.side === "buy") {
    
            const amount =
                order.price * order.quantity;
    
            await this.wallet.lockFunds(
                order.userId,
                quoteAsset,
                amount
            );
    
        } else {
    
            await this.wallet.lockFunds(
                order.userId,
                baseAsset,
                order.quantity
            );
        }
    }

    async cancelOrder(orderId: number): Promise<void> {
        console.log(`[Engine] Requesting cancellation for order ${orderId}`);
    
        const order = await this.orderBook.getOrder(orderId);
    
        if (!order) {
            throw new Error("Order can't be found");
        }
    
        const [baseAsset, quoteAsset] = order.symbol.split("/");
    
        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid symbol: ${order.symbol}`);
        }
    
        const asset = order.side === "buy"
            ? quoteAsset
            : baseAsset;
    
        const amount = order.side === "buy"
            ? order.price * order.quantity
            : order.quantity;
    
        await this.wallet.unlockFunds(
            order.userId,
            asset,
            amount
        );
    
        await this.orderBook.cancelOrder(orderId);
    }

    async getBalance(userId: string, asset: string) {
        return this.wallet.getBalance(userId, asset);
    }


    getBestBuy(): Order | null {
        return this.orderBook.getBestBid();
    }
    getBestSell(): Order | null {
        return this.orderBook.getBestAsk();
    }
    async getMatch(order: Order) {
        return this.orderBook.findBestMatch(order);
    }
    private async getBestMatch(order: Order): Promise<Order | null> {

        if (order.side === "buy") {
    
            // BUY matches against SELL
            const bestAsk = this.getBestSell();
    
            if (!bestAsk) {
                return null;
            }
    
            // Buyer must be willing to pay seller's price
            if (bestAsk.price > order.price) {
                return null;
            }
    
            return bestAsk;
        }
    
        // SELL matches against BUY
        const bestBid = this.getBestBuy();
    
        if (!bestBid) {
            return null;
        }
    
        // Seller must accept buyer's price
        if (bestBid.price < order.price) {
            return null;
        }
    
        return bestBid;
    }

    private async validateOrderBalance(order: Order): Promise<void> {
        const [baseAsset, quoteAsset] = order.symbol.split("/");
        
        if (!baseAsset || !quoteAsset) {
            throw new Error(`Invalid trading pair: ${order.symbol}`);
        }
        
        if (order.side === 'buy') {
            // Buyer needs enough quote currency (e.g., USD)
            const totalCost = order.price * order.quantity;
            const balance = await this.wallet.getBalance(order.userId, quoteAsset);
            
            if (balance.available < totalCost) {
                throw new Error(
                    `Insufficient ${quoteAsset} balance for buyer ${order.userId}. ` +
                    `Need ${totalCost}, have ${balance.available}`
                );
            }
        } else if (order.side === 'sell') {
            // Seller needs enough base asset (e.g., BTC)
            const balance = await this.wallet.getBalance(order.userId, baseAsset);
            
            if (balance.available < order.quantity) {
                throw new Error(
                    `Insufficient ${baseAsset} balance for seller ${order.userId}. ` +
                    `Need ${order.quantity}, have ${balance.available}`
                );
            }
        }
    }
  
    private createTrade(order1: Order, order2: Order): ITrade {
        // Determine which is buy and which is sell
        const buyOrder = order1.side === 'buy' ? order1 : order2;
        const sellOrder = order1.side === 'sell' ? order1 : order2;

        const price = sellOrder.price;
        const quantity = Math.min(buyOrder.quantity, sellOrder.quantity);
        const totalValue = price * quantity;

        return {
            tradeId: Date.now() + Math.floor(Math.random() * 1000),
            buyOrderId: buyOrder.orderId,
            sellOrderId: sellOrder.orderId,
            buyerId: buyOrder.userId,
            sellerId: sellOrder.userId,
            symbol: buyOrder.symbol,
            price: price,
            quantity: quantity,
            totalValue: totalValue,
            timestamp: new Date()
        };
    }

}