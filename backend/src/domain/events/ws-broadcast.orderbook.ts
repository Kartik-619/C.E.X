import type { EventManager } from "./event-bus";
import { EventType } from "./Ibroadcast.orderbook";
import type { EventListener } from "./event-listner.interface";

// Define what data each event carries
interface OrderPlacedData {
    orderId: number;
    userId: string;
    symbol: string;
    side: 'buy' | 'sell';
    price: number;
    quantity: number;
    status: string;
    timestamp: number;
}

interface TradeExecutedData {
    tradeId: number;
    price: number;
    quantity: number;
    totalValue: number;
    timestamp: number;
}

export class WebSocketBroadcaster {
    constructor(
        private bus: EventManager,
        private wsServer: any
    ) {
        //  Subscribe with wrapper objects that call the right handler
        this.bus.subscriber(EventType.ORDER_PLACED, {
            update: (data) => this.onOrderPlaced(data)
        });
        this.bus.subscriber(EventType.TRADE_EXECUTED, {
            update: (data) => this.onTradeExecuted(data)
        });
        this.bus.subscriber(EventType.ORDER_FILLED, {
            update: (data) => this.onOrderFilled(data)
        });
        this.bus.subscriber(EventType.ORDER_CANCELLED, {
            update: (data) => this.onOrderCancelled(data)
        });
    }

    //  event handlers
    private onOrderPlaced(data: OrderPlacedData): void {
        console.log(`[WebSocket] Broadcasting ORDER_PLACED: ${data.orderId}`);
        this.wsServer.broadcast(EventType.ORDER_PLACED, data);
    }

    private onTradeExecuted(data: TradeExecutedData): void {
        console.log(`[WebSocket] Broadcasting TRADE_EXECUTED: ${data.tradeId}`);
        this.wsServer.broadcast(EventType.TRADE_EXECUTED, data);
    }

    private onOrderFilled(data: any): void {
        console.log(`[WebSocket] Sending ORDER_FILLED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId, EventType.ORDER_FILLED, data);
    }

    private onOrderCancelled(data: any): void {
        console.log(`[WebSocket] Sending ORDER_CANCELLED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId, EventType.ORDER_CANCELLED, data);
    }
}