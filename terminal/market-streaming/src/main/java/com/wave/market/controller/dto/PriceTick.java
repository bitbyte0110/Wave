package com.wave.market.controller.dto;

import java.math.BigDecimal;

public record PriceTick(
        BigDecimal btcUsd,
        BigDecimal usdcUsd,
        BigDecimal btc24hPct,
        long timestampMs
) {}
