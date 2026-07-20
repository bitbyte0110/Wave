package com.wave.terminal.controller;

import com.wave.terminal.controller.dto.AuthResponse;
import com.wave.terminal.controller.dto.LoginRequest;
import com.wave.terminal.controller.dto.RegisterRequest;
import com.wave.terminal.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller: Wave Terminal — Authentication
 *
 * Base path  : /api/v1/auth
 * All routes are public (no JWT required) — configured in SecurityConfig.
 *
 * POST /register  → creates account + provisions wallet + returns JWT
 * POST /login     → verifies credentials + returns fresh JWT
 */
@RestController
@RequestMapping("/api/v1/auth")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    // ── POST /register ────────────────────────────────────────────────────────

    /**
     * Registers a new user.
     *
     * On success: persists the User, provisions a zero-balance Wallet,
     * and returns a ready-to-use JWT so the client is logged in immediately.
     *
     * @param request  JSON body — { email, username, password }
     * @return HTTP 200 with AuthResponse, or HTTP 400 on validation failure.
     */
    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("REGISTER REQUEST ▶ email={}", request.email());
        try {
            validateRegisterRequest(request);
            AuthResponse response = authService.register(
                    request.email(),
                    request.username(),
                    request.password()
            );
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("REGISTER FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    // ── POST /login ───────────────────────────────────────────────────────────

    /**
     * Authenticates an existing user and returns a fresh JWT.
     *
     * @param request  JSON body — { email, password }
     * @return HTTP 200 with AuthResponse, or HTTP 400 on bad credentials.
     */
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

    // ── Private helpers ───────────────────────────────────────────────────────

    private void validateRegisterRequest(RegisterRequest req) {
        if (req.email() == null || req.email().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (req.username() == null || req.username().isBlank()) {
            throw new IllegalArgumentException("Username is required.");
        }
        if (req.password() == null || req.password().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }
    }

    private void validateLoginRequest(LoginRequest req) {
        if (req.email() == null || req.email().isBlank()) {
            throw new IllegalArgumentException("Email is required.");
        }
        if (req.password() == null || req.password().isBlank()) {
            throw new IllegalArgumentException("Password is required.");
        }
    }

    private Map<String, String> errorBody(String message) {
        return Map.of("error", message);
    }
}
