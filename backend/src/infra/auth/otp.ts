// src/application/services/OTPService.ts

export class OTPService {
    private readonly OTP_LENGTH = 4;
    private readonly OTP_TTL = 5 * 60 * 1000; // 5 minutes
    private otpStore: Map<string, { otp: string; expiresAt: number }>;
    private cleanupInterval: NodeJS.Timeout | null = null;

    constructor() {
        this.otpStore = new Map();
        this.startCleanup();
    }

   
    async generateOTP(userId: string): Promise<string> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        // Generate OTP
        const otp = this.createOTP(this.OTP_LENGTH);
        const expiresAt = Date.now() + this.OTP_TTL;

        this.otpStore.set(userId, { otp, expiresAt });

        console.log(`[OTP] Generated for ${userId}: ${otp} (expires in 5 min)`);

        return otp;
    }

  
    async verifyOTP(userId: string, code: string): Promise<boolean> {
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!code) {
            throw new Error('OTP code is required');
        }

        const stored = this.otpStore.get(userId);

        if (!stored) {
            return false;
        }

        if (Date.now() > stored.expiresAt) {
            this.otpStore.delete(userId); // Clean up expired OTP
            return false;
        }

        if (stored.otp !== code) {
            return false;
        }

        this.otpStore.delete(userId);
        return true;
    }

    async isValid(userId: string, code: string): Promise<boolean> {
        if (!userId || !code) return false;

        const stored = this.otpStore.get(userId);
        if (!stored) return false;
        if (stored.otp !== code) return false;
        if (Date.now() > stored.expiresAt) return false;

        return true;
    }

    async getRemainingTTL(userId: string): Promise<number> {
        const stored = this.otpStore.get(userId);
        if (!stored) return -1;

        const remaining = Math.floor((stored.expiresAt - Date.now()) / 1000);
        return remaining > 0 ? remaining : -1;
    }

  
    async deleteOTP(userId: string): Promise<void> {
        this.otpStore.delete(userId);
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

  
    private cleanupExpired(): void {
        const now = Date.now();
        let deleted = 0;

        for (const [userId, stored] of this.otpStore) {
            if (stored.expiresAt < now) {
                this.otpStore.delete(userId);
                deleted++;
            }
        }

        if (deleted > 0) {
            console.log(`[OTP] Cleaned up ${deleted} expired OTPs`);
        }
    }

    private startCleanup(): void {
        // Cleanup every 60 seconds
        this.cleanupInterval = setInterval(() => {
            this.cleanupExpired();
        }, 60 * 1000);
    }


    stopCleanup(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
    }

   
    getStoreSize(): number {
        return this.otpStore.size;
    }

   
    clearAll(): void {
        this.otpStore.clear();
    }
}