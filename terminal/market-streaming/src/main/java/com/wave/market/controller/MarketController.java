package com.wave.market.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.wave.market.controller.dto.MarketOverview;
import com.wave.market.controller.dto.PriceTick;
import com.wave.market.service.MarketPriceScheduler;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/market")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class MarketController {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

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

    private Map<String, String> errorBody(String message) {
        return Map.of("error", message);
    }
}
