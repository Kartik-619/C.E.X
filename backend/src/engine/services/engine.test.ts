import { describe, it, expect, beforeEach } from "bun:test";
import { inmemory_OrderBookStore } from "../../store/orderbook-store";
import { OrderBook } from "./orderBook/orderBook";
import { StandardEngine } from "./Engine";
import type { Order } from "../interface/IOrderBook";

// Helper to create a mock order
const createMockOrder = (id: number, type: 'buy' | 'sell' = 'buy', price: string = '100'): Order => ({
    orderId: id,
    side,
    price,
    entity: 'AAPL'
});

describe("InMemoryOrderBookStore", () => {
    let store: inmemory_OrderBookStore;

    beforeEach(() => {
        store = new inmemory_OrderBookStore();
    });

    it("should place an order and retrieve it", async () => {
        const order = createMockOrder(1);
        await store.placeOrder(order);
        
        const orders = store.getOrderBook();
        expect(orders).toHaveLength(1);
    
    });

    it("should cancel an existing order", async () => {
        const order = createMockOrder(2);
        await store.placeOrder(order);
        await store.cancelOrder(2);
        
        expect(store.getOrderBook()).toHaveLength(0);
    });

    it("should silently ignore cancelling a non-existent order", async () => {
        // Should not throw
        await expect(store.cancelOrder(999)).resolves.not.toThrow();
    });
});

describe("OrderBook (Business Logic)", () => {
    let store: inmemory_OrderBookStore;
    let orderBook: OrderBook;

    beforeEach(() => {
        store = new inmemory_OrderBookStore();
        orderBook = new OrderBook(store);
    });

    it("should place a valid order", async () => {
        const order = createMockOrder(10, 'buy', '150');
        const result = await orderBook.placeOrder(order);
        
        expect(result.orderId).toBe(10);
        expect(store.getOrderBook()).toHaveLength(1);
    });

    it("should throw an error for invalid price", async () => {
        const invalidOrder = createMockOrder(11, 'buy', '0'); // Price <= 0
        
        await expect(orderBook.placeOrder(invalidOrder)).rejects.toThrow("Price must be greater than 0");
    });
});

describe("StandardEngine (Integration)", () => {
    let store: inmemory_OrderBookStore;
    let orderBook: OrderBook;
    let engine: StandardEngine;

    beforeEach(() => {
        store = new inmemory_OrderBookStore();
        orderBook = new OrderBook(store);
        engine = new StandardEngine(orderBook);
    });

    it("should process an incoming order through the engine", async () => {
        const order = createMockOrder(100, 'sell', '200');
        
        const result = await engine.processOrder(order);
        
        expect(result.orderId).toBe(100);
        expect(store.getOrderBook()).toHaveLength(1);
    });

    it("should cancel an order through the engine", async () => {
        const order = createMockOrder(101);
        await engine.processOrder(order);
        
        await engine.cancelOrder(101);
        
        expect(store.getOrderBook()).toHaveLength(0);
    });
});