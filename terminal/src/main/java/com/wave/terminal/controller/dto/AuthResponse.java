package com.wave.terminal.controller.dto;

/**
 * Response body returned on successful register or login.
 *
 * The {@code userId} field is embedded so the Next.js frontend can cache it
 * alongside the token and immediately call /api/v1/wallet/balance/{userId}
 * without a separate /me round-trip.
 */
public record AuthResponse(
        String token,
        Long userId,
        String username,
        String email
) {}
