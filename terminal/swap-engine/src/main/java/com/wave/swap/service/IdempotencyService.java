package com.wave.swap.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Optional;

/**
 * Redis-backed idempotency guard for swap-engine mutation endpoints.
 * Key namespace: "idempotency:<uuid>"
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class IdempotencyService {

    private static final String KEY_PREFIX = "idempotency:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.idempotency.ttl-seconds:86400}")
    private long ttlSeconds;

    public <T> Optional<T> getCachedResponse(String idempotencyKey, Class<T> responseType) {
        String redisKey = KEY_PREFIX + idempotencyKey;
        String cachedJson = redisTemplate.opsForValue().get(redisKey);

        if (cachedJson == null) {
            log.debug("IDEMPOTENCY MISS ▶ key={}", idempotencyKey);
            return Optional.empty();
        }

        log.info("IDEMPOTENCY HIT ▶ key={} — returning cached response", idempotencyKey);
        try {
            return Optional.of(objectMapper.readValue(cachedJson, responseType));
        } catch (JsonProcessingException ex) {
            log.warn("IDEMPOTENCY deserialisation error for key={}: {} — proceeding as miss",
                    idempotencyKey, ex.getMessage());
            return Optional.empty();
        }
    }

    public void cacheResponse(String idempotencyKey, Object responseBody) {
        String redisKey = KEY_PREFIX + idempotencyKey;
        try {
            String json = objectMapper.writeValueAsString(responseBody);
            redisTemplate.opsForValue().set(redisKey, json, Duration.ofSeconds(ttlSeconds));
            log.debug("IDEMPOTENCY CACHED ▶ key={} ttl={}s", idempotencyKey, ttlSeconds);
        } catch (JsonProcessingException ex) {
            log.warn("IDEMPOTENCY cache write failed for key={}: {}", idempotencyKey, ex.getMessage());
        }
    }
}
