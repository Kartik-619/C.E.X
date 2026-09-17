import type { EventListener } from "./event-listner.interface";
import { EventType } from "./Ibroadcast.orderbook";
export class EventManager{
  //eventType is the key and value is the set of listners
    private listeners: Map<EventType,Set<EventListener>>;


    constructor(){
        this.listeners=new Map();
    }
   public async subscriber(eventType:EventType,callback:EventListener){
      if(!this.listeners.has(eventType)){
        this.listeners.set(eventType,new Set<EventListener>())
      }
      this.listeners.get(eventType)!.add(callback)
      return () => this.unsubscriber(eventType, callback);

    }

    public async unsubscriber(eventType:EventType,callback:EventListener){
        if(this.listeners.has(eventType)){
            this.listeners.get(eventType)!.delete(callback)
        }
    }
      

    public notify(eventType: EventType, data: any): void {
        if (this.listeners.has(eventType)) {
          // FIXED: Properly iterate Set and call update() method
          this.listeners.get(eventType)!.forEach((listener) => {
            listener.update(data); // EventListener interface has update(filename:string)
          });
        }
      }
      public clearAll(): void {
        this.listeners.clear();
      }
    
      // Added: Get subscriber count (useful for debugging)
      public getSubscriberCount(eventType: EventType): number {
        return this.listeners.get(eventType)?.size ?? 0;
      }
}