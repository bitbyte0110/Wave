package com.wave.terminal.controller.dto;

/**
 * Request body for POST /api/v1/auth/login
 */
public record LoginRequest(
        String email,
        String password
) {}
