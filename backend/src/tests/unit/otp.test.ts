// src/tests/unit/otp.test.ts

import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import { OTPService } from '../../infra/auth/otp';

describe('OTPService (in-memory TTL)', () => {
    let otpService: OTPService;
    let currentTime: number;

    beforeEach(() => {
        currentTime = Date.now();
        otpService = new OTPService();
        Date.now = () => currentTime;
    });

    afterEach(() => {
        Date.now = originalNow;
        otpService.stopCleanup();
    });

    it('should generate a 4-digit OTP for a user', async () => {
        const otp = await otpService.generateOTP('user-1');
        expect(otp).toMatch(/^\d{4}$/);
    });

    it('should store newly generated OTPs', async () => {
        await otpService.generateOTP('user-1');
        expect(otpService.getStoreSize()).toBe(1);
    });

    it('should return ~300 seconds of remaining TTL right after generation', async () => {
        await otpService.generateOTP('user-1');
        const ttl = await otpService.getRemainingTTL('user-1');
        expect(ttl).toBe(300);
    });

    it('should verify a valid OTP inside the 5-minute TTL', async () => {
        const otp = await otpService.generateOTP('user-1');
        expect(await otpService.verifyOTP('user-1', otp)).toBe(true);
    });

    it('should consider an OTP invalid after it has been used once', async () => {
        const otp = await otpService.generateOTP('user-1');
        await otpService.verifyOTP('user-1', otp);
        expect(await otpService.verifyOTP('user-1', otp)).toBe(false);
        expect(otpService.getStoreSize()).toBe(0);
    });

    it('should reject an OTP once 5 minutes have passed', async () => {
        const otp = await otpService.generateOTP('user-1');
        currentTime = Date.now() + 5 * 60 * 1000 + 1000;
        expect(await otpService.verifyOTP('user-1', otp)).toBe(false);
    });

    it('should report no remaining TTL once expired', async () => {
        await otpService.generateOTP('user-1');
        currentTime = Date.now() + 5 * 60 * 1000 + 1000;
        expect(await otpService.getRemainingTTL('user-1')).toBe(-1);
        expect(await otpService.isValid('user-1', '0000')).toBe(false);
    });

    it('should reject and remove OTPs that expired after 5 minutes', async () => {
        await otpService.generateOTP('user-1');
        currentTime = Date.now() + 5 * 60 * 1000 + 1000;
        expect(await otpService.verifyOTP('user-1', '0000')).toBe(false);
        expect(otpService.getStoreSize()).toBe(0);
    });

    it('should delete an OTP on demand', async () => {
        await otpService.generateOTP('user-1');
        await otpService.deleteOTP('user-1');
        expect(otpService.getStoreSize()).toBe(0);
    });

    it('should clear all OTPs', async () => {
        await otpService.generateOTP('user-1');
        await otpService.generateOTP('user-2');
        otpService.clearAll();
        expect(otpService.getStoreSize()).toBe(0);
    });

    it('should reject an OTP for an unknown user', async () => {
        expect(await otpService.verifyOTP('missing-user', '1234')).toBe(false);
    });

    it('should throw when generating an OTP without a user ID', async () => {
        expect(otpService.generateOTP('')).rejects.toThrow('User ID is required');
    });

    it('should throw when verifying without a code', async () => {
        await otpService.generateOTP('user-1');
        expect(otpService.verifyOTP('user-1', '')).rejects.toThrow('OTP code is required');
    });
});

const originalNow = Date.now;