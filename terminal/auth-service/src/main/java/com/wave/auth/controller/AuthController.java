package com.wave.auth.controller;

import com.wave.auth.controller.dto.LoginRequest;
import com.wave.auth.controller.dto.RegisterRequest;
import com.wave.auth.service.AuthService;
import com.wave.common.AuthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller: Auth Service — Authentication
 *
 * Base path  : /api/v1/auth (all routes public — no JWT required)
 * POST /register → creates account + provisions wallet + returns JWT
 * POST /login    → verifies credentials + returns fresh JWT
 *
 * AuthResponse is imported from wave-common (com.wave.common) — no local DTO copy.
 */
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("REGISTER REQUEST ▶ email={}", request.email());
        try {
            validateRegisterRequest(request);
            AuthResponse response = authService.register(
                    request.email(), request.username(), request.password());
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("REGISTER FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        log.info("LOGIN REQUEST ▶ email={}", request.email());
        try {
            validateLoginRequest(request);
            AuthResponse response = authService.login(request.email(), request.password());
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("LOGIN FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    private void validateRegisterRequest(RegisterRequest req) {
        if (req.email() == null || req.email().isBlank())
            throw new IllegalArgumentException("Email is required.");
        if (req.username() == null || req.username().isBlank())
            throw new IllegalArgumentException("Username is required.");
        if (req.password() == null || req.password().length() < 6)
            throw new IllegalArgumentException("Password must be at least 6 characters.");
    }

    private void validateLoginRequest(LoginRequest req) {
        if (req.email() == null || req.email().isBlank())
            throw new IllegalArgumentException("Email is required.");
        if (req.password() == null || req.password().isBlank())
            throw new IllegalArgumentException("Password is required.");
    }

    private Map<String, String> errorBody(String message) {
        return Map.of("error", message);
    }
}
