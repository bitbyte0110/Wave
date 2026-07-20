package com.wave.terminal.controller.dto;

import java.math.BigDecimal;

/**
 * Request body for POST /api/v1/wallet/deposit
 * No idempotency key is required for deposits per the PRD (deposits are simulated / idempotent by design).
 */
public record DepositRequest(
        Long userId,
        String asset,
        BigDecimal amount
) {}
