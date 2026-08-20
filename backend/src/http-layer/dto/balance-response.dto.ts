// src/api/dto/response/BalanceResponseDTO.ts

/**
 * Response DTO for balance queries
 * What the client receives when checking balance
 */
export class BalanceResponseDTO {
    userId!: string;
    asset!: string;
    available!: number;
    locked!: number;
    total!: number; // available + locked
}

/**
 * Response DTO for multiple balances
 */
export class BalancesResponseDTO {
    balances!: BalanceResponseDTO[];
    timestamp!: string;
}