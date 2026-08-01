// ../interface/MatchEngine.ts

import type { IOrderBook } from "./I_OrderBook";
import type { Order } from "./Order";

export interface IMatchEngine<T = Order> {
    processOrder(order: T): Promise<T>;
    cancelOrder(orderId: number): Promise<void>;
}

export abstract class AbstractEngine<T = Order> implements IMatchEngine<T> {
    // Protected so child classes can access the orderbook instance
    constructor(protected orderBook: IOrderBook<T>) {}

    abstract processOrder(order: T): Promise<T>;
    abstract cancelOrder(orderId: number): Promise<void>;
}