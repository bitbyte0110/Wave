package com.wave.auth.controller.dto;

/** Request body for PUT /api/v1/auth/profile */
public record ProfileUpdateRequest(
        Long userId,
        String currentEmail,
        String username,
        String email
) {}
