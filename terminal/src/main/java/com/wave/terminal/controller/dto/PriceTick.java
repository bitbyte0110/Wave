package com.wave.terminal.controller.dto;

import java.math.BigDecimal;

/**
 * Live price tick broadcast to WebSocket subscribers on /topic/prices.
 * Sent every second by MarketPriceScheduler.
 *
 * @param btcUsd   BTC price in USD
 * @param usdcUsd  USDC price in USD (≈ 1.00, but tracked for completeness)
 * @param btc24hPct  BTC 24-hour price change percentage
 * @param timestampMs  Server-side epoch milliseconds at broadcast time
 */
public record PriceTick(
        BigDecimal btcUsd,
        BigDecimal usdcUsd,
        BigDecimal btc24hPct,
        long timestampMs
) {}
