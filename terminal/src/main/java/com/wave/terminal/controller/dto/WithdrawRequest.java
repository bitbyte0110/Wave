package com.wave.terminal.controller.dto;

import java.math.BigDecimal;

/**
 * Request body for POST /api/v1/wallet/withdraw
 * Caller must also supply the X-Idempotency-Key header (UUIDv4).
 */
public record WithdrawRequest(
        Long userId,
        String asset,
        BigDecimal amount
) {}
