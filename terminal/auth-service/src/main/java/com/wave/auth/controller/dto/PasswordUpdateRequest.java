package com.wave.auth.controller.dto;

/** Request body for POST /api/v1/auth/password */
public record PasswordUpdateRequest(
        Long userId,
        String email,
        String currentPassword,
        String newPassword
) {}
