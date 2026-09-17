// src/http-layer/dto/order-limits.ts

// Order/deposit input bounds enforced server-side.
// Mirrors the limits validated client-side in frontend/src/utils/schemas.ts
// so that API and UI agree on what is acceptable.
export const MIN_ORDER_PRICE = 0.01;
export const MAX_ORDER_PRICE = 1000000;
export const MAX_ORDER_QUANTITY = 100;
export const MAX_DEPOSIT_AMOUNT = 1000000;