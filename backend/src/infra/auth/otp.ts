
export class generateOTP {
  
    async getOTP(userId: string) {
        if (!userId) {
            throw new Error('User unverified');
        }
        this.createOTP(4);

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