package com.wave.swap.controller.dto;

import java.math.BigDecimal;

/** Request body for POST /api/v1/wallet/swap (X-Idempotency-Key required) */
public record SwapRequest(
        Long userId,
        String fromAsset,
        String toAsset,
        BigDecimal fromAmount,
        BigDecimal toAmount
) {}
