package com.wave.terminal.controller.dto;

import java.math.BigDecimal;

/**
 * Request body for POST /api/v1/wallet/swap
 * Caller must also supply the X-Idempotency-Key header (UUIDv4).
 */
public record SwapRequest(
        Long userId,
        String fromAsset,
        String toAsset,
        BigDecimal fromAmount,
        BigDecimal toAmount
) {}
