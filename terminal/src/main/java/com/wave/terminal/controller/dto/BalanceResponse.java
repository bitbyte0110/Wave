package com.wave.terminal.controller.dto;

import java.math.BigDecimal;

/**
 * Lightweight read-model returned by GET /api/v1/wallet/balance/{userId}.
 * Intentionally decoupled from the JPA Wallet entity to avoid lazy-loading
 * the User association during JSON serialisation.
 */
public record BalanceResponse(
        Long userId,
        BigDecimal usdcBalance,
        BigDecimal btcBalance
) {}
