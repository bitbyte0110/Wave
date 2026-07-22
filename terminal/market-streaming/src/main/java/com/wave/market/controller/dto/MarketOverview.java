package com.wave.market.controller.dto;

import java.math.BigDecimal;

public record MarketOverview(
        BigDecimal globalMarketCapUsd,
        BigDecimal totalVolume24hUsd,
        BigDecimal btcDominancePct,
        BigDecimal btcUsd,
        BigDecimal btc24hPct,
        long cachedAtMs
) {}
