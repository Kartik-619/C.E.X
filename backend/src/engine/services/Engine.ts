// ../engine/StandardEngine.ts

import { AbstractEngine } from "../interface/IMatchEngine";
import { OrderBook } from "./orderBook/orderBook";
import type { Order } from "../interface/IOrderBook";
import type { Wallet } from "./wallet/wallet";
import type { Balance } from "../interface/Ibalance";
import type { ITrade } from "../interface/ITrade";
import { toString } from "node:ffi";

export class StandardEngine extends AbstractEngine<Order> {


    // Inject the OrderBook and Wallet into the Engine
    constructor(orderBook: OrderBook, wallet: Wallet) {
        super(orderBook, wallet); // Must call super first!

    }
    async createOrder(order: Order) {
        const savedOrder = this.orderBook.placeOrder(order);
    }

    async processOrder(order: Order): Promise<Order> {
        console.log(`[Engine] Received new ${order.type} order for ${order.symbol}`);

        // Delegate to OrderBook


        const bestMatch = await this.getBestMatch(order);
        if (!bestMatch) {
            return this.orderBook.placeOrder(order);
        }
        this.checkBalances(bestMatch, order)
        const trade=await this.createTrade(bestMatch,order)
        if(!trade){
            throw new Error("failed to make trade ")
        }
    
        this.wallet.settleTrade(trade)
        //update order
        return bestMatch //tobe fixed

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
        let bestMatch: Order | null = null;

        if (order.side === 'buy') {

            bestMatch = this.getBestBuy(); // or getBestSell()

            // Check if the match is valid (buy price >= ask price)
            if (bestMatch && bestMatch.price > order.price) {
                // Seller is asking for more than buyer wants to pay

                return null; // No valid match
            }
        } else if (order.side === 'sell') {
            // For a SELL order, find the HIGHEST bidder (best buyer)
            bestMatch = this.getBestSell(); // or getBestBuy()

            // Check if the match is valid (bid price >= sell price)
            if (bestMatch && bestMatch.price < order.price) {
                // Buyer is offering less than seller wants

                return null; // No valid match
            }
        }

        return bestMatch;
    }


    private async checkBalances(
        order1: Order,
        order2: Order
    ): Promise<void> {
    
        const buyOrder =
            order1.side === "buy" ? order1 : order2;
    
        const sellOrder =
            order1.side === "sell" ? order1 : order2;
    
        if (!buyOrder.userId) {
            throw new Error("Buyer ID invalid");
        }
    
        if (!sellOrder.userId) {
            throw new Error("Seller ID invalid");
        }
    
        const [baseAsset, quoteAsset] =
            buyOrder.symbol.split("/");
    
        if (!baseAsset || !quoteAsset) {
            throw new Error(
                `Invalid trading pair: ${buyOrder.symbol}`
            );
        }
    
        // Only the quantity actually being traded
        // needs to be locked.
        const quantity = Math.min(
            buyOrder.quantity,
            sellOrder.quantity
        );
    
        // Trade executes at seller's price.
        const tradeValue =
            sellOrder.price * quantity;
    
        // -----------------------------
        // BUYER
        // -----------------------------
    
        const buyerHasFunds =
            await this.wallet.checkBalance(
                buyOrder.userId,
                quoteAsset,
                tradeValue
            );
    
        if (!buyerHasFunds) {
            throw new Error(
                `Buyer ${buyOrder.userId} has insufficient ${quoteAsset}`
            );
        }
    
        // SELLER
        const sellerHasFunds =
            await this.wallet.checkBalance(
                sellOrder.userId,
                baseAsset,
                quantity
            );
    
        if (!sellerHasFunds) {
            throw new Error(
                `Seller ${sellOrder.userId} has insufficient ${baseAsset}`
            );
        }
       
        // LOCK
        await this.wallet.lockFunds(
            buyOrder.userId,
            quoteAsset,
            tradeValue
        );
    
        await this.wallet.lockFunds(
            sellOrder.userId,
            baseAsset,
            quantity
        );
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