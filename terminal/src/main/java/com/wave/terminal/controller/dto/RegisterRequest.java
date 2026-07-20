package com.wave.terminal.controller.dto;

/**
 * Request body for POST /api/v1/auth/register
 */
public record RegisterRequest(
        String email,
        String username,
        String password
) {}
