interface IMatchEngine<T>{
    placeOrder():Promise<T>;
    cancelOrder():Promise<void>;
}

abstract class AbstractEngine<T> implements IMatchEngine<T>  {
    constructor(  parameter:any) {
        
    }



    async placeOrder():Promise<T>{
        throw new Error("Implement it ")
    };
    async cancelOrder():Promise<void>{
        throw new Error("Implement it ")
    };
}