import {
    describe,
    it,
    expect,
    beforeEach,
} from "bun:test";

import { inmemory_OrderBookStore } from "../../../infra/store/orderbook-store";
import { Inmemory_WalletStore } from "../../../infra/store/wallet-store";

import { OrderBook } from "./orderBook/orderBook";
import { Wallet } from "./wallet/wallet";
import { StandardEngine } from "./Engine";

import type { Order } from "../interface/IOrderBook";
import { EventManager } from "../../events/event-bus";


// ============================================================
// Helpers
// ============================================================

const createOrder = (
    id: number,
    side: "buy" | "sell",
    userId: string,
    price: number,
    quantity: number
): Order => ({
    orderId: id,
    side,
    userId,
    price,
    quantity,
    symbol: "BTC/USD",
    type: "LIMIT",
    createdAt: Date.now(),
});


// ============================================================
// StandardEngine - Trade Integration
// ============================================================

describe("StandardEngine - Trade Integration", () => {

    let orderBookStore: inmemory_OrderBookStore;
    let walletStore: Inmemory_WalletStore;

    let orderBook: OrderBook;
    let wallet: Wallet;
    let engine: StandardEngine;
    let bus:EventManager;


    // --------------------------------------------------------
    // Setup
    // --------------------------------------------------------

    beforeEach(async () => {

        orderBookStore = new inmemory_OrderBookStore();
        orderBook = new OrderBook(orderBookStore);

        walletStore = new Inmemory_WalletStore();
        wallet = new Wallet(walletStore);

        bus= new EventManager()

        engine = new StandardEngine(
            orderBook,
            wallet,
            bus
        );

        // Alice starts with $100
        await wallet.deposit(
            "alice",
            "USD",
            100
        );

        // Bob starts with 1 BTC
        await wallet.deposit(
            "bob",
            "BTC",
            1
        );
    });


    // ========================================================
    // COMPLETE TRADE
    // ========================================================

    it("should execute a complete BTC/USD trade", async () => {

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            1
        );

        await engine.processOrder(sellOrder);

        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            1
        );

        await engine.processOrder(buyOrder);

        // ----------------------------------------------------
        // Alice
        // ----------------------------------------------------

        const aliceUSD = await wallet.getBalance("alice", "USD");
        const aliceBTC = await wallet.getBalance("alice", "BTC");

        expect(aliceUSD.available).toBe(0);
        expect(aliceUSD.locked).toBe(0);
        expect(aliceBTC.available).toBe(1);
        expect(aliceBTC.locked).toBe(0);

        // ----------------------------------------------------
        // Bob
        // ----------------------------------------------------

        const bobBTC = await wallet.getBalance("bob", "BTC");
        const bobUSD = await wallet.getBalance("bob", "USD");

        expect(bobBTC.available).toBe(0);
        expect(bobBTC.locked).toBe(0);
        expect(bobUSD.available).toBe(100);
        expect(bobUSD.locked).toBe(0);
    });


    // ========================================================
    // NO PRICE CROSS
    // ========================================================

    it("should not execute a trade when prices do not cross", async () => {

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            110,
            1
        );

        await engine.processOrder(sellOrder);

        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            1
        );

        await engine.processOrder(buyOrder);

        // ----------------------------------------------------
        // No trade should have happened
        // ----------------------------------------------------

        const aliceUSD = await wallet.getBalance("alice", "USD");
        const aliceBTC = await wallet.getBalance("alice", "BTC");
        const bobBTC = await wallet.getBalance("bob", "BTC");
        const bobUSD = await wallet.getBalance("bob", "USD");

        // ✅ Alice's $100 is LOCKED (order resting in book)
        expect(aliceUSD.available).toBe(0);
        expect(aliceUSD.locked).toBe(100);
        expect(aliceBTC.available).toBe(0);
        expect(aliceBTC.locked).toBe(0);

        // ✅ Bob's 1 BTC is LOCKED (order resting in book)
        expect(bobBTC.available).toBe(0);
        expect(bobBTC.locked).toBe(1);
        expect(bobUSD.available).toBe(0);
        expect(bobUSD.locked).toBe(0);

        // Both orders should still exist
        expect(await orderBookStore.getOrderBook()).toHaveLength(2);
    });


    // ========================================================
    // BUYER INSUFFICIENT FUNDS
    // ========================================================

    it("should reject a BUY order when buyer has insufficient funds", async () => {

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            200,
            1
        );

        await engine.processOrder(sellOrder);

        // Alice only has $100
        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            200,
            1
        );

        await expect(
            engine.processOrder(buyOrder)
        ).rejects.toThrow();

        // Alice's funds must remain untouched
        const aliceUSD = await wallet.getBalance("alice", "USD");
        expect(aliceUSD.available).toBe(100);
        expect(aliceUSD.locked).toBe(0);
    });


    // ========================================================
    // SELLER INSUFFICIENT FUNDS
    // ========================================================

    it("should reject a SELL order when seller has insufficient BTC", async () => {

        // Bob only has 1 BTC
        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            2
        );

        await expect(
            engine.processOrder(sellOrder)
        ).rejects.toThrow();

        // Bob's BTC must remain untouched
        const bobBTC = await wallet.getBalance("bob", "BTC");
        expect(bobBTC.available).toBe(1);
        expect(bobBTC.locked).toBe(0);
    });


    // ========================================================
    // LOCKED FUNDS
    // ========================================================

    it("should consume locked funds after settlement", async () => {

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            1
        );

        await engine.processOrder(sellOrder);

        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            1
        );

        await engine.processOrder(buyOrder);

        const aliceUSD = await wallet.getBalance("alice", "USD");
        const bobBTC = await wallet.getBalance("bob", "BTC");

        // Locked balances must be consumed
        expect(aliceUSD.locked).toBe(0);
        expect(bobBTC.locked).toBe(0);
    });


    // ========================================================
    // COMPLETE FILL REMOVES ORDERS
    // ========================================================

    it("should remove completely filled orders", async () => {

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            1
        );

        await engine.processOrder(sellOrder);

        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            1
        );

        await engine.processOrder(buyOrder);

        expect(await orderBookStore.getOrderBook()).toHaveLength(0);
        expect(await orderBookStore.getOrder(1)).toBeNull();
        expect(await orderBookStore.getOrder(2)).toBeNull();
    });


    // ========================================================
    // PARTIAL FILL - SELLER HAS MORE
    // ========================================================

    it("should partially fill a resting SELL order", async () => {

        // Give Bob enough BTC for the full sell order
        await wallet.deposit("bob", "BTC", 4); // Bob now has 5 BTC total

        // Give Alice enough USD for the buy order
        await wallet.deposit("alice", "USD", 400); // Alice now has 500 USD total

        // Bob wants to sell 5 BTC
        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            5
        );

        await engine.processOrder(sellOrder);

        // Alice buys 2 BTC (needs $200)
        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            2
        );

        await engine.processOrder(buyOrder);

        // ----------------------------------------------------
        // Bob should have 3 BTC remaining on the order book
        // ----------------------------------------------------

        const remainingSell = await orderBookStore.getOrder(1);
        expect(remainingSell).not.toBeNull();
        expect(remainingSell?.quantity).toBe(3);

        // Alice's order was completely filled
        const remainingBuy = await orderBookStore.getOrder(2);
        expect(remainingBuy).toBeNull();

        // ----------------------------------------------------
        // Check balances
        // ----------------------------------------------------

        const aliceUSD = await wallet.getBalance("alice", "USD");
        const aliceBTC = await wallet.getBalance("alice", "BTC");
        const bobBTC = await wallet.getBalance("bob", "BTC");
        const bobUSD = await wallet.getBalance("bob", "USD");

        // Alice spent $200, has $300 remaining
        expect(aliceUSD.available).toBe(300);
        expect(aliceBTC.available).toBe(2); // Alice got 2 BTC
        
        // Bob sold 2 BTC, has 3 BTC still locked in the order
        expect(bobBTC.available).toBe(0); // All remaining BTC are locked
        expect(bobBTC.locked).toBe(3); // 3 BTC still locked in order
        
        expect(bobUSD.available).toBe(200); // Bob got $200
        expect(bobUSD.locked).toBe(0);
    });


    // ========================================================
    // PARTIAL FILL - BUYER HAS MORE
    // ========================================================

    it("should partially fill the incoming BUY order", async () => {

        // Give Bob enough BTC
        await wallet.deposit("bob", "BTC", 2); // Bob now has 3 BTC total

        // Bob sells 2 BTC
        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            2
        );

        await engine.processOrder(sellOrder);

        // Give Alice enough USD for the full order
        await wallet.deposit("alice", "USD", 500); // Alice now has 600 USD total

        // Alice wants to buy 5 BTC (needs $500)
        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            5
        );

        await engine.processOrder(buyOrder);

        // Bob's SELL should be completely filled
        expect(await orderBookStore.getOrder(1)).toBeNull();

        // Alice should have 3 BTC remaining on her BUY order
        const remainingBuy = await orderBookStore.getOrder(2);
        expect(remainingBuy).not.toBeNull();
        expect(remainingBuy?.quantity).toBe(3);
    });


    // ========================================================
    // QUANTITY UPDATE
    // ========================================================

    it("should correctly update remaining order quantity", async () => {

        // Give Bob enough BTC
        await wallet.deposit("bob", "BTC", 4); // Bob now has 5 BTC total

        // Give Alice enough USD
        await wallet.deposit("alice", "USD", 400); // Alice now has 500 USD total

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            5
        );

        await engine.processOrder(sellOrder);

        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            2
        );

        await engine.processOrder(buyOrder);

        const order = await orderBookStore.getOrder(1);
        expect(order).not.toBeNull();
        expect(order?.quantity).toBe(3);
    });


    // ========================================================
    // BALANCE AFTER PARTIAL TRADE
    // ========================================================

    it("should correctly settle balances after a partial trade", async () => {

        // Give Bob enough BTC
        await wallet.deposit("bob", "BTC", 4); // Bob now has 5 BTC total

        // Give Alice enough USD
        await wallet.deposit("alice", "USD", 400); // Alice now has 500 USD total

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            5
        );

        await engine.processOrder(sellOrder);

        // Alice buys 2 BTC (costs $200)
        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            2
        );

        await engine.processOrder(buyOrder);

        // ----------------------------------------------------
        // Alice
        // ----------------------------------------------------

        const aliceUSD = await wallet.getBalance("alice", "USD");
        const aliceBTC = await wallet.getBalance("alice", "BTC");

        // Alice started with $500, spent $200 = $300 remaining
        expect(aliceUSD.available).toBe(300);
        expect(aliceUSD.locked).toBe(0);
        
        // Alice bought 2 BTC
        expect(aliceBTC.available).toBe(2);
        expect(aliceBTC.locked).toBe(0);

        // ----------------------------------------------------
        // Bob
        // ----------------------------------------------------

        const bobBTC = await wallet.getBalance("bob", "BTC");
        const bobUSD = await wallet.getBalance("bob", "USD");

        // Bob sold 2 BTC, has 3 BTC still locked in the order
        expect(bobBTC.available).toBe(0); // All remaining BTC are locked
        expect(bobBTC.locked).toBe(3); // Still locked for remaining 3 BTC

        // Bob got $200 from the sale
        expect(bobUSD.available).toBe(200);
        expect(bobUSD.locked).toBe(0);
    });
});


// ============================================================
// OrderBookStore - updateOrder
// ============================================================

describe("InMemoryOrderBookStore - updateOrder", () => {

    let store: inmemory_OrderBookStore;

    beforeEach(() => {
        store = new inmemory_OrderBookStore();
    });


    it("should update the quantity of an existing order", async () => {

        const order = createOrder(
            1,
            "sell",
            "bob",
            100,
            5
        );

        await store.placeOrder(order);

        const updated = await store.updateOrder(1, 3);

        expect(updated.quantity).toBe(3);

        const stored = await store.getOrder(1);
        expect(stored?.quantity).toBe(3);
    });


    it("should remove an order when quantity becomes zero", async () => {

        const order = createOrder(
            1,
            "sell",
            "bob",
            100,
            5
        );

        await store.placeOrder(order);

        await store.updateOrder(1, 0);

        expect(await store.getOrder(1)).toBeNull();
        expect(await store.getOrderBook()).toHaveLength(0);
    });


    it("should reject a negative quantity", async () => {

        const order = createOrder(
            1,
            "sell",
            "bob",
            100,
            5
        );

        await store.placeOrder(order);

        await expect(
            store.updateOrder(1, -1)
        ).rejects.toThrow("Quantity cannot be negative");
    });


    it("should reject updating a non-existent order", async () => {

        await expect(
            store.updateOrder(999, 2)
        ).rejects.toThrow("Order 999 not found");
    });
});


// ============================================================
// StandardEngine - getOrderBook
// ============================================================

describe("StandardEngine - getOrderBook", () => {

    let orderBookStore: inmemory_OrderBookStore;
    let walletStore: Inmemory_WalletStore;
    let orderBook: OrderBook;
    let wallet: Wallet;
    let engine: StandardEngine;
    let bus: EventManager;

    beforeEach(async () => {
        orderBookStore = new inmemory_OrderBookStore();
        orderBook = new OrderBook(orderBookStore);
        walletStore = new Inmemory_WalletStore();
        wallet = new Wallet(walletStore);
        bus = new EventManager();
        engine = new StandardEngine(orderBook, wallet, bus);

        await wallet.deposit("alice", "USD", 1000);
        await wallet.deposit("bob", "BTC", 5);
    });

    it("should return all resting orders currently in the book", async () => {
        const sellOrder = createOrder(1, "sell", "bob", 100, 2);
        await engine.processOrder(sellOrder);

        const buyOrder = createOrder(2, "buy", "alice", 90, 3);
        await engine.processOrder(buyOrder);

        const book = await engine.getOrderBook();
        expect(book).toHaveLength(2);
        expect(book.some((order) => order.orderId === 1)).toBe(true);
        expect(book.some((order) => order.orderId === 2)).toBe(true);
    });

    it("should return an empty array when no orders are resting", async () => {
        expect(await engine.getOrderBook()).toHaveLength(0);
    });
});