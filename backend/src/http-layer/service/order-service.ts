import type { StandardEngine } from "../../engine/services/Engine";
import type { CreateOrderRequestDTO,OrderResponseDTO } from "../dto/requestorderDTO";
import type { Order as EngineOrder } from "../../engine/interface/IOrderBook";
export class OrderService{
    constructor(private engine:StandardEngine){

    }

async createOrder(orderDTO:CreateOrderRequestDTO){
    if(orderDTO.price<=0 || orderDTO.quantity<=0){
        throw new Error("price and quantity must be more than 1");
    }
    if(!orderDTO.userId){
        throw new Error("Undefined user")
    }

   // 2. Convert DTO to Domain Object expected by the Engine 
    const domainOrder:EngineOrder={
        orderId:Date.now(),
        userId:orderDTO.userId,
        symbol:orderDTO.symbol,
        price:orderDTO.price,
        side:orderDTO.side,
        type:orderDTO.type,
        quantity:orderDTO.quantity,
        createdAt:Date.now()
    };

    const processedOrder=await this.engine.processOrder(domainOrder)
    const responseDTO:OrderResponseDTO = {
        id: processedOrder.orderId,
        userId: processedOrder.userId,
        symbol: processedOrder.symbol,
        side: processedOrder.side,
        price: processedOrder.price,
        quantity: processedOrder.quantity,
        totalValue: processedOrder.price * processedOrder.quantity,
        createdAt: new Date(processedOrder.createdAt).toISOString()
    };
    
    return responseDTO; 

}
}