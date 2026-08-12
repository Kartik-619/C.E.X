import type { IOrderBook, Order } from "./IOrderBook";

export interface IMatchEngine<T = Order> {
    processOrder(order: T): Promise<T>;
    cancelOrder(orderId: number): Promise<void>;
}

export abstract class AbstractEngine<T = Order> implements IMatchEngine<T> {
    // Protected so child classes can access the orderbook instance directly
    constructor(protected orderBook: IOrderBook) {}

    abstract processOrder(order: T): Promise<T>;
    abstract cancelOrder(orderId: number): Promise<void>;
}