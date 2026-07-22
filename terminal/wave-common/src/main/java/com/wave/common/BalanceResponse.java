package com.wave.common;

import java.math.BigDecimal;

/**
 * Lightweight read-model returned by Swap-Engine's GET /api/v1/wallet/balance/{userId}.
 *
 * Intentionally decoupled from the JPA Wallet entity — carries only the data
 * the frontend needs to render the balance panel without exposing persistence concerns.
 */
public record BalanceResponse(
        Long userId,
        BigDecimal usdcBalance,
        BigDecimal btcBalance
) {}
