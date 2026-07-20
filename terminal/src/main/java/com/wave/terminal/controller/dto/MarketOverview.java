package com.wave.terminal.controller.dto;

import java.math.BigDecimal;

/**
 * Macro market overview cached in Redis and served by GET /api/v1/market/overview.
 * Polled by the frontend dashboard every 30 seconds (low-frequency).
 *
 * @param globalMarketCapUsd  Total crypto market cap in USD
 * @param totalVolume24hUsd   24-hour total volume across all assets (USD)
 * @param btcDominancePct     BTC dominance as a percentage of global market cap
 * @param btcUsd              Current BTC price in USD (snapshot)
 * @param btc24hPct           BTC 24-hour change percentage
 * @param cachedAtMs          Epoch milliseconds when this snapshot was written to Redis
 */
public record MarketOverview(
        BigDecimal globalMarketCapUsd,
        BigDecimal totalVolume24hUsd,
        BigDecimal btcDominancePct,
        BigDecimal btcUsd,
        BigDecimal btc24hPct,
        long cachedAtMs
) {}
