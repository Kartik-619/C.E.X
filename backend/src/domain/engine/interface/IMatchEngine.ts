// src/engine/interface/IMatchEngine.ts

import type { EventManager } from "../../events/event-bus";
import type { Balance } from "./Ibalance";
import type { IOrderBook, Order } from "./IOrderBook";
import type { IWallet } from "./Iwallet";

export interface IMatchEngine<T = Order> {
    processOrder(order: T): Promise<T>;
    cancelOrder(orderId: number): Promise<void>;
    createOrder(order: T): Promise<T>;  // ✅ Add this
}

export abstract class AbstractEngine<T = Order, W = Balance> implements IMatchEngine<T> {
    constructor(protected orderBook: IOrderBook, protected wallet: IWallet<W>, protected bus:EventManager) {}

    abstract processOrder(order: T): Promise<T>;
    abstract cancelOrder(orderId: number): Promise<void>;
    abstract createOrder(order: T): Promise<T>;  // ✅ Add this
}