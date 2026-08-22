// src/api/__tests__/fixtures/testData.ts

import type { CreateOrderRequestDTO } from '../../../http-layer/dto/requestorderDTO';

export const TestData = {
    orders: {
        validBuy: {
            userId: 'alice',
            symbol: 'BTC/USD',
            side: 'buy' as const,
            price: 100,
            quantity: 1,
            type: 'LIMIT' as const
        } as CreateOrderRequestDTO,

        validSell: {
            userId: 'bob',
            symbol: 'BTC/USD',
            side: 'sell' as const,
            price: 100,
            quantity: 1,
            type: 'LIMIT' as const
        } as CreateOrderRequestDTO,

        invalidPrice: {
            userId: 'alice',
            symbol: 'BTC/USD',
            side: 'buy' as const,
            price: -100,
            quantity: 1,
            type: 'LIMIT' as const
        } as CreateOrderRequestDTO,

        invalidQuantity: {
            userId: 'alice',
            symbol: 'BTC/USD',
            side: 'buy' as const,
            price: 100,
            quantity: 0,
            type: 'LIMIT' as const
        } as CreateOrderRequestDTO,

        missingUserId: {
            userId: '',
            symbol: 'BTC/USD',
            side: 'buy' as const,
            price: 100,
            quantity: 1,
            type: 'LIMIT' as const
        } as CreateOrderRequestDTO
    },

    users: {
        alice: {
            id: 'alice',
            balances: {
                USD: 1000,
                BTC: 0
            }
        },
        bob: {
            id: 'bob',
            balances: {
                USD: 0,
                BTC: 5
            }
        }
    }
};