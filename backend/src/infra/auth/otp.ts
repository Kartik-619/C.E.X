
export class generateOTP {
    private readonly otpTTL=5*60*1000;
    private otpStore:Map<string,{otp:string,ttl:number}>;
    constructor(){
        this.otpStore= new Map()
    }
   
    async getOTP(userId: string) :Promise<string>{
        if (!userId) {
            throw new Error('User unverified');
        }
        const otp:string= this.createOTP(4);
        if(!otp){
            throw new Error('Failed to get OTP')
        }
        const ttl=this.otpTTL
        this.otpStore.set(userId,{otp,ttl})
        return otp;

    }
    async verifyOTP(userId:string,code:string):Promise<boolean>{
        if(!userId){
            throw new Error('User not found')
        }
        if(!code){
            throw new Error("Otp not found")
        }
        const realOTP=this.otpStore.get(userId);
        if(realOTP?.otp!=code){
            throw new Error("Otp cant match");
        }
        return true;
    }
    private createOTP(length:number) {
        let OTPARR: [number] = [Math.floor(Math.random() * 10)];
        let i = 0;
        let otpString: string = "";
        while (i < length) {
            let randomNum = Math.floor(Math.random() * 10)
            OTPARR.push(randomNum);
            let r = String(OTPARR.pop());
            otpString += r;
            i++;
        }
        console.log(otpString)
        return otpString;
    }


}

const obj = new generateOTP();
obj.getOTP('123');