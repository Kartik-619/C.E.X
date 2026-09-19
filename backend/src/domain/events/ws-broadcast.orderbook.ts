import type { EventManager } from "./event-bus";
import { EventType } from "./Ibroadcast.orderbook";
import type { EventListener } from "./event-listner.interface";
import { Logger } from "../../infra/logging/logger";
import { LoggerFactory } from "../../infra/logging/logger.factory";
import { LogLevel } from "../../infra/logging/log-level";

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
    tradeId: string;
    buyOrderId: number;
    sellOrderId: number;
    buyerId: string;
    sellerId: string;
    symbol: string;
    price: number;
    quantity: number;
    totalValue: number;
    timestamp: number;
}

export class WebSocketBroadcaster {
    private readonly logger: Logger;

    constructor(
        private bus: EventManager,
        private wsServer: any,
        logger?: Logger
    ) {
        this.logger = logger ?? LoggerFactory.createLogger('console', LogLevel.INFO);
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
        this.bus.subscriber(EventType.ORDER_PENDING,{
            update:(data)=> this.onOrderPending(data)
        })
        this.bus.subscriber(EventType.ORDER_FAILED,{
            update:(data)=>this.onOrderFailled(data)
        })

        this.bus.subscriber(EventType.OTPASKED,{
            update:(data)=>this.onOTPASK(data)
        })
        this.bus.subscriber(EventType.OTPFAIL,{
            update:(data)=>this.onOTPFAIL(data)
        })
    }

    //  event handlers
    private onOrderPlaced(data: OrderPlacedData): void {
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Broadcasting ORDER_PLACED: ${data.orderId}`);
        this.wsServer.broadcast(EventType.ORDER_PLACED, data);
    }

    private onTradeExecuted(data: TradeExecutedData): void {
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Broadcasting TRADE_EXECUTED: ${data.tradeId}`);
        this.wsServer.broadcast(EventType.TRADE_EXECUTED, data);
    }

    private onOrderFilled(data: any): void {
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Sending ORDER_FILLED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId, EventType.ORDER_FILLED, data);
    }

    private onOrderCancelled(data: any): void {
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Sending ORDER_CANCELLED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId, EventType.ORDER_CANCELLED, data);
    }
    private onOrderPending(data:any):void{
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Sending ORDER_PENDING to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId,EventType.ORDER_PENDING,data)
    }
    private onOrderFailled(data:any):void{
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Sending ORDER_FAILED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId,EventType.ORDER_FAILED,data)
    }
    private onOTPASK(data:any):void{
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Sending OTPASKED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId,EventType.OTPASKED,data)
    }
    private onOTPFAIL(data:any):void{
        this.logger.log(LogLevel.INFO, `[WebSocketBroadcaster] Sending OTP_FAILED to user: ${data.userId}`);
        this.wsServer.sendToUser(data.userId,EventType.OTPFAIL,data)
    }
}