package com.wave.auth.controller.dto;

/** Request body for POST /api/v1/auth/login */
public record LoginRequest(
        String email,
        String password
) {}
