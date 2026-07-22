package com.wave.swap.controller.dto;

import java.math.BigDecimal;

/** Request body for POST /api/v1/wallet/deposit */
public record DepositRequest(
        Long userId,
        String asset,
        BigDecimal amount
) {}
