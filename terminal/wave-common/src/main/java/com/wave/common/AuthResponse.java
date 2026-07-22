package com.wave.common;

/**
 * API response returned by Auth-Service on successful register or login.
 *
 * The {@code userId} field is embedded so the frontend can cache it alongside
 * the token and immediately call /api/v1/wallet/balance/{userId} without a
 * separate /me round-trip.
 */
public record AuthResponse(
        String token,
        Long userId,
        String username,
        String email
) {}
