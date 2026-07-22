package com.wave.swap.controller.dto;

import java.math.BigDecimal;

/** Request body for POST /api/v1/wallet/withdraw (X-Idempotency-Key required) */
public record WithdrawRequest(
        Long userId,
        String asset,
        BigDecimal amount
) {}
