// src/http-layer/service/otp-service.ts

import type { IUserStore } from '../../infra/store/Iuser.store';
import type { EmailService } from './email-service';

export interface OtpRequestResult {
    userId: string;
    email: string;
    ttlSeconds: number;
}

export class OtpService {
    constructor(
        private readonly userStore: IUserStore,
        private readonly emailService: EmailService,
    ) {}

    async requestOtp(email: string): Promise<OtpRequestResult> {
        const user = await this.userStore.findByEmail(email);
        if (!user) {
            throw new Error('User not found');
        }

        const { ttlSeconds } = await this.emailService.sendOtpEmail(user.id, user.email);

        return {
            userId: user.id,
            email: user.email,
            ttlSeconds,
        };
    }

    async verifyOtp(email: string, code: string): Promise<boolean> {
        const user = await this.userStore.findByEmail(email);
        if (!user) {
            return false;
        }

        return this.emailService.verifyOtp(user.id, code);
    }
}