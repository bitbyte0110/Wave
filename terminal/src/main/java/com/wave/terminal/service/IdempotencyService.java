package com.wave.terminal.service;

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
 * Redis-backed idempotency guard for Wave Terminal mutation endpoints.
 *
 * Design
 * ──────
 * Every mutating request (withdraw / swap) carries an X-Idempotency-Key header
 * (UUIDv4). This service:
 *
 *  1. Checks whether the key already exists in Redis.
 *     • HIT  → deserialises and returns the previously stored response body.
 *             The HTTP layer re-sends the original 200 without re-executing
 *             the transaction — safe network-retry behaviour.
 *     • MISS → executes the operation, serialises the result to JSON,
 *             stores it with a configurable TTL (default 24 h), returns empty.
 *
 * Key namespace : "idempotency:<uuid>"
 * Value format  : JSON string of the serialised response body (BalanceResponse)
 * TTL           : app.idempotency.ttl-seconds (property, default 86400)
 *
 * StringRedisTemplate is used in preference to the generic RedisTemplate to avoid
 * JDK serialisation coupling and keep Redis values human-readable for debugging.
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

    // ── Cache read ────────────────────────────────────────────────────────────

    /**
     * Checks the idempotency cache for an existing result.
     *
     * @param idempotencyKey  the raw UUIDv4 string from the request header
     * @param responseType    the class to deserialise the cached JSON into
     * @return Optional containing the previously cached response, or empty on cache miss
     */
    public <T> Optional<T> getCachedResponse(String idempotencyKey, Class<T> responseType) {
        String redisKey = buildKey(idempotencyKey);
        String cachedJson = redisTemplate.opsForValue().get(redisKey);

        if (cachedJson == null) {
            log.debug("IDEMPOTENCY MISS ▶ key={}", idempotencyKey);
            return Optional.empty();
        }

        log.info("IDEMPOTENCY HIT ▶ key={} — returning cached response", idempotencyKey);
        try {
            return Optional.of(objectMapper.readValue(cachedJson, responseType));
        } catch (JsonProcessingException ex) {
            // Corrupted cache entry — treat as miss and let the operation re-execute
            log.warn("IDEMPOTENCY deserialisation error for key={}: {} — proceeding as miss", idempotencyKey, ex.getMessage());
            return Optional.empty();
        }
    }

    // ── Cache write ───────────────────────────────────────────────────────────

    /**
     * Stores a successful response in the idempotency cache.
     *
     * @param idempotencyKey  the raw UUIDv4 string from the request header
     * @param responseBody    the response object to cache (must be JSON-serialisable)
     */
    public void cacheResponse(String idempotencyKey, Object responseBody) {
        String redisKey = buildKey(idempotencyKey);
        try {
            String json = objectMapper.writeValueAsString(responseBody);
            redisTemplate.opsForValue().set(redisKey, json, Duration.ofSeconds(ttlSeconds));
            log.debug("IDEMPOTENCY CACHED ▶ key={} ttl={}s", idempotencyKey, ttlSeconds);
        } catch (JsonProcessingException ex) {
            // Non-fatal — the operation already succeeded; just skip caching
            log.warn("IDEMPOTENCY cache write failed for key={}: {}", idempotencyKey, ex.getMessage());
        }
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private String buildKey(String idempotencyKey) {
        return KEY_PREFIX + idempotencyKey;
    }
}
