package com.wave.terminal.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wave.terminal.controller.dto.MarketOverview;
import com.wave.terminal.controller.dto.PriceTick;
import com.wave.terminal.service.MarketPriceScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller: Wave Terminal — Market Data
 *
 * Base path : /api/v1/market
 * All routes are PUBLIC — no JWT required (configured in SecurityConfig).
 *
 * GET /overview   → reads the MarketOverview snapshot cached in Redis
 * GET /price/tick → reads the latest PriceTick snapshot cached in Redis
 *                   (useful for initial page load before the WebSocket connects)
 */
@RestController
@RequestMapping("/api/v1/market")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class MarketController {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    // ── GET /overview ─────────────────────────────────────────────────────────

    /**
     * Returns the latest cached macro market overview (global cap, 24h volume,
     * BTC dominance). The cache is refreshed every 60 seconds by
     * {@link MarketPriceScheduler#fetchAndCacheMarketOverview()}.
     *
     * @return HTTP 200 with {@link MarketOverview}, or HTTP 503 if the cache is cold.
     */
    @GetMapping("/overview")
    public ResponseEntity<?> getOverview() {
        log.debug("MARKET OVERVIEW request");
        try {
            String cached = redisTemplate.opsForValue().get(MarketPriceScheduler.REDIS_KEY_OVERVIEW);
            if (cached == null) {
                return ResponseEntity.status(503)
                        .body(errorBody("Market data not yet available — scheduler warming up."));
            }
            MarketOverview overview = objectMapper.readValue(cached, MarketOverview.class);
            return ResponseEntity.ok(overview);
        } catch (Exception ex) {
            log.warn("MARKET OVERVIEW failed: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(errorBody(ex.getMessage()));
        }
    }

    // ── GET /price/tick ───────────────────────────────────────────────────────

    /**
     * Returns the latest cached price tick (BTC + USDC prices + 24h change).
     * Useful for the initial dashboard render before the WebSocket subscription
     * delivers its first update.
     *
     * The cache is refreshed every 5 seconds by
     * {@link MarketPriceScheduler#fetchAndBroadcastPriceTick()}.
     *
     * @return HTTP 200 with {@link PriceTick}, or HTTP 503 if the cache is cold.
     */
    @GetMapping("/price/tick")
    public ResponseEntity<?> getLatestPriceTick() {
        log.debug("PRICE TICK request");
        try {
            String cached = redisTemplate.opsForValue().get(MarketPriceScheduler.REDIS_KEY_TICK);
            if (cached == null) {
                return ResponseEntity.status(503)
                        .body(errorBody("Price data not yet available — scheduler warming up."));
            }
            PriceTick tick = objectMapper.readValue(cached, PriceTick.class);
            return ResponseEntity.ok(tick);
        } catch (Exception ex) {
            log.warn("PRICE TICK request failed: {}", ex.getMessage());
            return ResponseEntity.internalServerError().body(errorBody(ex.getMessage()));
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private Map<String, String> errorBody(String message) {
        return Map.of("error", message);
    }
}
