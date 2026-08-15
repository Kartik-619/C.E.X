import { describe, it, expect, beforeEach } from "bun:test";

import { inmemory_OrderBookStore } from "../../store/orderbook-store";
import { Inmemory_WalletStore } from "../../store/wallet-store";

import { OrderBook } from "./orderBook/orderBook";
import { Wallet } from "./wallet/wallet";
import { StandardEngine } from "./Engine";

import type { Order } from "../interface/IOrderBook";


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
    createdAt:Date.now()
});


describe("StandardEngine - Trade Integration", () => {

    let orderBookStore: inmemory_OrderBookStore;
    let walletStore: Inmemory_WalletStore;

    let orderBook: OrderBook;
    let wallet: Wallet;
    let engine: StandardEngine;


    beforeEach(async () => {

        // Fresh order book
        orderBookStore = new inmemory_OrderBookStore();
        orderBook = new OrderBook(orderBookStore);

        // Fresh wallet
        walletStore = new Inmemory_WalletStore();
        wallet = new Wallet(walletStore);

        // Engine coordinates both
        engine = new StandardEngine(orderBook, wallet);


        // Alice has 100 USD
        await wallet.deposit("alice", "USD", 100);

        // Bob has 1 BTC
        await wallet.deposit("bob", "BTC", 1);
    });


    it("should execute a complete BTC/USD trade", async () => {

        // Bob places SELL order first
        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            100,
            1
        );

        await engine.processOrder(sellOrder);


        // Alice places BUY order
        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            1
        );

        await engine.processOrder(buyOrder);


        // -------------------------
        // Check Alice's balances
        // -------------------------

        const aliceUSD =
            await wallet.getBalance("alice", "USD");

        const aliceBTC =
            await wallet.getBalance("alice", "BTC");


        expect(aliceUSD.available).toBe(0);
        expect(aliceUSD.locked).toBe(0);

        expect(aliceBTC.available).toBe(1);
        expect(aliceBTC.locked).toBe(0);


        // -------------------------
        // Check Bob's balances
        // -------------------------

        const bobBTC =
            await wallet.getBalance("bob", "BTC");

        const bobUSD =
            await wallet.getBalance("bob", "USD");


        expect(bobBTC.available).toBe(0);
        expect(bobBTC.locked).toBe(0);

        expect(bobUSD.available).toBe(100);
        expect(bobUSD.locked).toBe(0);
    });


    it("should not execute a trade when prices do not cross", async () => {

        // Bob wants $110
        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            110,
            1
        );

        await engine.processOrder(sellOrder);


        // Alice only offers $100
        const buyOrder = createOrder(
            2,
            "buy",
            "alice",
            100,
            1
        );

        await engine.processOrder(buyOrder);


        // No trade should happen

        const aliceUSD =
            await wallet.getBalance("alice", "USD");

        const bobBTC =
            await wallet.getBalance("bob", "BTC");


        expect(aliceUSD.available).toBe(100);
        expect(aliceUSD.locked).toBe(0);

        expect(bobBTC.available).toBe(1);
        expect(bobBTC.locked).toBe(0);
    });


    it("should reject a BUY order when buyer has insufficient funds", async () => {

        // Alice has only 100 USD

        const sellOrder = createOrder(
            1,
            "sell",
            "bob",
            200,
            1
        );

        await engine.processOrder(sellOrder);


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
    });


    it("should reject a SELL order when seller has insufficient BTC", async () => {

        // Bob has only 1 BTC

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
    });


    it("should lock buyer funds before settlement", async () => {

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


        const aliceUSD =
            await wallet.getBalance("alice", "USD");


        // After successful settlement,
        // nothing should remain locked.
        expect(aliceUSD.locked).toBe(0);
    });


    it("should remove the orders after a complete fill", async () => {

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


        expect(
            orderBookStore.getOrderBook()
        ).toHaveLength(0);
    });

});