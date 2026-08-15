import type { IOrderBook, Order } from "../engine/interface/IOrderBook";

export class inmemory_OrderBookStore implements IOrderBook {
    private orders = new Map<number, Order>();
    private asks: Order[] = [];
    private bids: Order[] = [];

    async placeOrder(order: Order): Promise<Order> {
        // Store the order
        this.orders.set(order.orderId, order);

        // Add to appropriate side
        if (order.side === 'buy') {
            this.bids.push(order);
            // Sort bids: highest price first, then earliest timestamp
            this.bids.sort((a, b) => {
                if (b.price !== a.price) return b.price - a.price;
                return a.createdAt - b.createdAt; // FIFO for same price
            });
        } else if (order.side === 'sell') {
            this.asks.push(order);
            // Sort asks: lowest price first, then earliest timestamp
            this.asks.sort((a, b) => {
                if (a.price !== b.price) return a.price - b.price;
                return a.createdAt - b.createdAt; // FIFO for same price
            });
        }

        console.log("Adding order:", order);
        return order;
    }

    async cancelOrder(orderId: number): Promise<void> {
        if (this.orders.has(orderId)) {
            // Remove from bids and asks
            this.bids = this.bids.filter(o => o.orderId !== orderId);
            this.asks = this.asks.filter(o => o.orderId !== orderId);
            this.orders.delete(orderId);
            
            console.log("Removing order:", orderId);
        }
        return Promise.resolve();
    }

    async updateOrder(order: Order): Promise<void> {
        if (!this.orders.has(order.orderId)) {
            throw new Error(`Order ${order.orderId} not found`);
        }

        // If quantity is 0 or less, cancel the order
        if (order.quantity <= 0) {
            await this.cancelOrder(order.orderId);
            return;
        }

        // Update the order in the map
        this.orders.set(order.orderId, order);

        // Update the appropriate list
        if (order.side === 'buy') {
            const index = this.bids.findIndex(o => o.orderId === order.orderId);
            if (index !== -1) {
                this.bids[index] = { ...order };
                // Re-sort
                this.bids.sort((a, b) => {
                    if (b.price !== a.price) return b.price - a.price;
                    return a.createdAt - b.createdAt;
                });
            }
        } else if (order.side === 'sell') {
            const index = this.asks.findIndex(o => o.orderId === order.orderId);
            if (index !== -1) {
                this.asks[index] = { ...order };
                // Re-sort
                this.asks.sort((a, b) => {
                    if (a.price !== b.price) return a.price - b.price;
                    return a.createdAt - b.createdAt;
                });
            }
        }
    }

    async getOrder(orderId: number): Promise<Order | null> {
        const order = this.orders.get(orderId);
        return order || null; // Fixed: explicitly return null if undefined
    }
    getBestBid(): Order | null {
        const best = this.bids[0];
        return best ?? null; // ✅ Works: best is Order | undefined, returns Order | null
    }
    
    getBestAsk(): Order | null {
        const best = this.asks[0];
        return best ?? null; // ✅ Works: best is Order | undefined, returns Order | null
    }

    getOrderBook(): Order[] {
        return Array.from(this.orders.values());
    }

    async findBestMatch(order: Order): Promise<Order | null> {
        let bestMatch: Order | null = null;

        if (order.side === 'buy') {
            // For a BUY order, find the best ask (cheapest seller)
            bestMatch = this.getBestAsk();
            
            if (bestMatch) {
                // Check price compatibility: buy price must be >= ask price
                if (bestMatch.price > order.price) {
                    return null; // No valid match
                }
                // Check if the matched order has quantity
                if (bestMatch.quantity <= 0) {
                    return null;
                }
            }
        } else if (order.side === 'sell') {
            // For a SELL order, find the best bid (highest buyer)
            bestMatch = this.getBestBid();
            
            if (bestMatch) {
                // Check price compatibility: bid price must be >= sell price
                if (bestMatch.price < order.price) {
                    return null; // No valid match
                }
                // Check if the matched order has quantity
                if (bestMatch.quantity <= 0) {
                    return null;
                }
            }
        }

        return bestMatch;
    }

    // Helper method to get all orders of a specific side
    getOrdersBySide(side: 'buy' | 'sell'): Order[] {
        return side === 'buy' ? [...this.bids] : [...this.asks];
    }

    // Helper method to get order count
    getOrderCount(): number {
        return this.orders.size;
    }

    // Helper method to clear all orders (for testing)
    clearAllOrders(): void {
        this.orders.clear();
        this.bids = [];
        this.asks = [];
    }

    // Helper method to get best price for a side
    getBestPrice(side: 'buy' | 'sell'): number | null {
        if (side === 'buy') {
            const best = this.getBestBid();
            return best ? best.price : null;
        } else {
            const best = this.getBestAsk();
            return best ? best.price : null;
        }
    }
}