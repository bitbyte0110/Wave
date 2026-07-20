package com.wave.terminal.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.wave.terminal.controller.dto.MarketOverview;
import com.wave.terminal.controller.dto.PriceTick;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

/**
 * Market Price Scheduler — Wave Terminal
 *
 * Architecture (PRD §3 Service 2 — Market Streaming Service)
 * ──────────────────────────────────────────────────────────
 * High-frequency (every 5 s)  : fetchAndBroadcastPriceTick()
 *   → GET CoinGecko /simple/price  (BTC + USDC prices + 24h change)
 *   → Cache PriceTick JSON in Redis under "market:price:tick"
 *   → Broadcast PriceTick to STOMP /topic/prices
 *
 * Low-frequency (every 60 s) : fetchAndCacheMarketOverview()
 *   → GET CoinGecko /global         (market cap, volume, BTC dominance)
 *   → Cache MarketOverview JSON in Redis under "market:overview"
 *   → REST endpoint reads from this Redis key (no live API call on each GET)
 *
 * CoinGecko public API — no API key required for basic endpoints.
 * Rate limit: 10–30 req/min on the free tier.  5 s polling = 12 req/min ✓
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class MarketPriceScheduler {

    public static final String REDIS_KEY_TICK     = "market:price:tick";
    public static final String REDIS_KEY_OVERVIEW = "market:overview";
    public static final String STOMP_TOPIC_PRICES = "/topic/prices";

    private static final String COINGECKO_PRICE_URL =
            "https://api.coingecko.com/api/v3/simple/price" +
            "?ids=bitcoin,usd-coin&vs_currencies=usd&include_24hr_change=true";

    private static final String COINGECKO_GLOBAL_URL =
            "https://api.coingecko.com/api/v3/global";

    private final SimpMessagingTemplate messagingTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // HttpClient is thread-safe and reusable — instantiated once
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    // ── High-frequency: price tick every 5 seconds ────────────────────────────

    /**
     * Polls CoinGecko for live BTC and USDC prices, caches the result in Redis,
     * and broadcasts a {@link PriceTick} to all STOMP subscribers on /topic/prices.
     *
     * Failures are caught and logged — a single API timeout must never crash the scheduler.
     */
    @Scheduled(fixedDelay = 5000)
    public void fetchAndBroadcastPriceTick() {
        try {
            String json = get(COINGECKO_PRICE_URL);
            JsonNode root = objectMapper.readTree(json);

            BigDecimal btcUsd    = safeDecimal(root, "bitcoin",  "usd");
            BigDecimal usdcUsd   = safeDecimal(root, "usd-coin", "usd");
            BigDecimal btc24hPct = safeDecimal(root, "bitcoin",  "usd_24h_change");

            PriceTick tick = new PriceTick(btcUsd, usdcUsd, btc24hPct, System.currentTimeMillis());

            // Cache in Redis (no TTL — overwritten every 5 s; last value survives restarts)
            redisTemplate.opsForValue().set(REDIS_KEY_TICK, objectMapper.writeValueAsString(tick));

            // Broadcast to all connected WebSocket clients
            messagingTemplate.convertAndSend(STOMP_TOPIC_PRICES, tick);

            log.debug("PRICE TICK ▶ BTC={} USDC={} 24h={}%", btcUsd, usdcUsd, btc24hPct);

        } catch (Exception ex) {
            log.warn("MarketPriceScheduler tick failed: {}", ex.getMessage());
        }
    }

    // ── Low-frequency: global overview every 60 seconds ──────────────────────

    /**
     * Fetches the CoinGecko global market stats (cap, volume, BTC dominance) and
     * caches the result in Redis. The REST endpoint reads from this cache key.
     */
    @Scheduled(fixedDelay = 60_000)
    public void fetchAndCacheMarketOverview() {
        try {
            String json = get(COINGECKO_GLOBAL_URL);
            JsonNode data = objectMapper.readTree(json).path("data");

            BigDecimal globalCap    = bigDecimalFromNode(data.path("total_market_cap").path("usd"));
            BigDecimal totalVolume  = bigDecimalFromNode(data.path("total_volume").path("usd"));
            BigDecimal btcDominance = bigDecimalFromNode(data.path("market_cap_percentage").path("btc"));

            // Re-use last cached tick for the BTC spot price + 24h change
            BigDecimal btcUsd    = BigDecimal.ZERO;
            BigDecimal btc24hPct = BigDecimal.ZERO;
            String cachedTick = redisTemplate.opsForValue().get(REDIS_KEY_TICK);
            if (cachedTick != null) {
                PriceTick tick = objectMapper.readValue(cachedTick, PriceTick.class);
                btcUsd    = tick.btcUsd();
                btc24hPct = tick.btc24hPct();
            }

            MarketOverview overview = new MarketOverview(
                    globalCap, totalVolume, btcDominance,
                    btcUsd, btc24hPct, System.currentTimeMillis());

            redisTemplate.opsForValue().set(REDIS_KEY_OVERVIEW, objectMapper.writeValueAsString(overview));
            log.debug("OVERVIEW CACHED ▶ cap={} vol={} btcDom={}%", globalCap, totalVolume, btcDominance);

        } catch (Exception ex) {
            log.warn("MarketPriceScheduler overview failed: {}", ex.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String get(String url) throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(8))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new RuntimeException("CoinGecko API returned HTTP " + response.statusCode());
        }
        return response.body();
    }

    private BigDecimal safeDecimal(JsonNode root, String coin, String field) {
        JsonNode node = root.path(coin).path(field);
        return bigDecimalFromNode(node);
    }

    private BigDecimal bigDecimalFromNode(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) return BigDecimal.ZERO;
        return new BigDecimal(node.asText());
    }
}
