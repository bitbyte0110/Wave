package com.wave.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

/**
 * Service managing Refresh Token Rotation (RTR) and revocation in Redis.
 *
 * Refresh Cookie Payload Format: {userId}:{familyId}:{jti}
 * Redis Key Format: auth:refresh:{userId}:{familyId}
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RefreshTokenService {

    private static final long REFRESH_TOKEN_TTL_DAYS = 7;
    private static final long GRACE_PERIOD_MS = 10000; // 10s grace window for concurrent/duplicate refreshes

    private final StringRedisTemplate redisTemplate;

    public record RefreshTokenResult(String refreshToken, Long userId) {}

    /**
     * Issues a brand new refresh token family for a user upon login or registration.
     */
    public String createRefreshToken(Long userId) {
        String familyId = UUID.randomUUID().toString();
        String jti = UUID.randomUUID().toString();

        String redisKey = buildKey(userId, familyId);
        redisTemplate.opsForHash().putAll(redisKey, Map.of(
                "activeJti", jti,
                "previousJti", "",
                "graceExpiresAt", "0",
                "userId", String.valueOf(userId)
        ));
        redisTemplate.expire(redisKey, REFRESH_TOKEN_TTL_DAYS, TimeUnit.DAYS);

        log.info("RTR CREATE ▶ Created new refresh token family={} for userId={}", familyId, userId);
        return encodeToken(userId, familyId, jti);
    }

    /**
     * Rotates a refresh token using Refresh Token Rotation (RTR) with reuse detection & grace period.
     */
    public RefreshTokenResult rotateRefreshToken(String refreshTokenStr) {
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new IllegalArgumentException("Refresh token is required.");
        }

        String[] parts = refreshTokenStr.split(":");
        if (parts.length != 3) {
            throw new IllegalArgumentException("Malformed refresh token format.");
        }

        Long userId;
        try {
            userId = Long.parseLong(parts[0]);
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("Invalid user ID in refresh token.");
        }
        String familyId = parts[1];
        String providedJti = parts[2];

        String redisKey = buildKey(userId, familyId);
        Map<Object, Object> data = redisTemplate.opsForHash().entries(redisKey);

        if (data.isEmpty()) {
            log.warn("RTR REJECTED ▶ Session expired or revoked for userId={} familyId={}", userId, familyId);
            throw new IllegalStateException("Refresh token session expired or revoked.");
        }

        String activeJti = (String) data.getOrDefault("activeJti", "");
        String previousJti = (String) data.getOrDefault("previousJti", "");
        long graceExpiresAt = Long.parseLong((String) data.getOrDefault("graceExpiresAt", "0"));
        long now = System.currentTimeMillis();

        // 1. Normal Rotation (Active JTI matches)
        if (providedJti.equals(activeJti)) {
            String newJti = UUID.randomUUID().toString();
            redisTemplate.opsForHash().putAll(redisKey, Map.of(
                    "activeJti", newJti,
                    "previousJti", activeJti,
                    "graceExpiresAt", String.valueOf(now + GRACE_PERIOD_MS)
            ));
            redisTemplate.expire(redisKey, REFRESH_TOKEN_TTL_DAYS, TimeUnit.DAYS);

            log.info("RTR ROTATED ▶ Rotated token for userId={} familyId={}", userId, familyId);
            return new RefreshTokenResult(encodeToken(userId, familyId, newJti), userId);
        }

        // 2. Grace Period Handling (Recent Previous JTI reused within grace window)
        if (providedJti.equals(previousJti) && now < graceExpiresAt) {
            log.info("RTR GRACE ▶ Duplicate refresh within grace window for userId={} familyId={}", userId, familyId);
            return new RefreshTokenResult(encodeToken(userId, familyId, activeJti), userId);
        }

        // 3. Reuse / Security Violation Detected (Invalid JTI or expired grace period)
        log.error("SECURITY ALERT ▶ Refresh token reuse detected! Revoking familyId={} for userId={}", familyId, userId);
        redisTemplate.delete(redisKey);
        throw new SecurityException("Security violation: Refresh token reuse detected. Session invalidated.");
    }

    /**
     * Revokes a refresh token family (Sign Out).
     */
    public void revokeRefreshToken(String refreshTokenStr) {
        if (refreshTokenStr == null || !refreshTokenStr.contains(":")) {
            return;
        }
        try {
            String[] parts = refreshTokenStr.split(":");
            if (parts.length == 3) {
                Long userId = Long.parseLong(parts[0]);
                String familyId = parts[1];
                redisTemplate.delete(buildKey(userId, familyId));
                log.info("RTR REVOKE ▶ Revoked token family={} for userId={}", familyId, userId);
            }
        } catch (Exception ex) {
            log.warn("RTR REVOKE FAILED ▶ {}", ex.getMessage());
        }
    }

    private String buildKey(Long userId, String familyId) {
        return "auth:refresh:" + userId + ":" + familyId;
    }

    private String encodeToken(Long userId, String familyId, String jti) {
        return userId + ":" + familyId + ":" + jti;
    }
}
