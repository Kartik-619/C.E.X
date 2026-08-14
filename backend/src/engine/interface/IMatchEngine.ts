import type { Balance } from "./Ibalance";
import type { IOrderBook, Order } from "./IOrderBook";
import type { IWallet } from "./Iwallet";

export interface IMatchEngine<T = Order> {
    processOrder(order: T): Promise<T>;
    cancelOrder(orderId: number): Promise<void>;
}

export abstract class AbstractEngine<T = Order,W=Balance> implements IMatchEngine<T> {
    // Protected so child classes can access the orderbook instance directly
    constructor(protected orderBook: IOrderBook,protected wallet:IWallet<W>) {}

    abstract processOrder(order: T): Promise<T>;
    abstract cancelOrder(orderId: number): Promise<void>;
}