package com.wave.auth.controller;

import com.wave.auth.controller.dto.LoginRequest;
import com.wave.auth.controller.dto.RegisterRequest;
import com.wave.auth.service.AuthService;
import com.wave.auth.service.AuthService.AuthResult;
import com.wave.common.AuthResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller: Auth Service — Authentication
 *
 * Handles registration, login, silent token refresh, and logout with HttpOnly refresh cookies.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        log.info("REGISTER REQUEST ▶ email={}", request.email());
        try {
            validateRegisterRequest(request);
            AuthResult result = authService.register(
                    request.email(), request.username(), request.password());

            ResponseCookie cookie = createRefreshCookie(result.refreshToken());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(result.response());
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
            AuthResult result = authService.login(request.email(), request.password());

            ResponseCookie cookie = createRefreshCookie(result.refreshToken());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(result.response());
        } catch (RuntimeException ex) {
            log.warn("LOGIN FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue(name = "refreshToken", required = false) String refreshTokenCookie) {
        log.info("REFRESH REQUEST ▶ cookie present={}", refreshTokenCookie != null);
        try {
            if (refreshTokenCookie == null || refreshTokenCookie.isBlank()) {
                return ResponseEntity.status(401).body(errorBody("Missing refresh token cookie."));
            }
            AuthResult result = authService.refreshToken(refreshTokenCookie);

            ResponseCookie cookie = createRefreshCookie(result.refreshToken());
            return ResponseEntity.ok()
                    .header(HttpHeaders.SET_COOKIE, cookie.toString())
                    .body(result.response());
        } catch (Exception ex) {
            log.warn("REFRESH FAILED – {}", ex.getMessage());
            ResponseCookie expiredCookie = createExpiredRefreshCookie();
            return ResponseEntity.status(401)
                    .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                    .body(errorBody("Session expired or invalid: " + ex.getMessage()));
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@CookieValue(name = "refreshToken", required = false) String refreshTokenCookie) {
        log.info("LOGOUT REQUEST ▶ cookie present={}", refreshTokenCookie != null);
        if (refreshTokenCookie != null) {
            authService.logout(refreshTokenCookie);
        }
        ResponseCookie expiredCookie = createExpiredRefreshCookie();
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredCookie.toString())
                .body(Map.of("message", "Logged out successfully."));
    }

    @PutMapping("/profile")
    public ResponseEntity<?> updateProfile(@RequestBody com.wave.auth.controller.dto.ProfileUpdateRequest request) {
        log.info("UPDATE PROFILE REQUEST ▶ userId={} currentEmail={}", request.userId(), request.currentEmail());
        try {
            if (request.username() == null || request.username().isBlank()) throw new IllegalArgumentException("Username is required.");
            if (request.email() == null || request.email().isBlank()) throw new IllegalArgumentException("Email is required.");

            AuthResponse response = authService.updateProfile(request.userId(), request.currentEmail(), request.username(), request.email());
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("UPDATE PROFILE FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @PostMapping("/password")
    public ResponseEntity<?> updatePassword(@RequestBody com.wave.auth.controller.dto.PasswordUpdateRequest request) {
        log.info("UPDATE PASSWORD REQUEST ▶ userId={} email={}", request.userId(), request.email());
        try {
            if (request.currentPassword() == null || request.currentPassword().isBlank()) throw new IllegalArgumentException("Current password is required.");
            if (request.newPassword() == null || request.newPassword().length() < 6) throw new IllegalArgumentException("New password must be at least 6 characters.");

            authService.updatePassword(request.userId(), request.email(), request.currentPassword(), request.newPassword());
            return ResponseEntity.ok(Map.of("message", "Password updated successfully."));
        } catch (RuntimeException ex) {
            log.warn("UPDATE PASSWORD FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    private ResponseCookie createRefreshCookie(String refreshTokenStr) {
        return ResponseCookie.from("refreshToken", refreshTokenStr)
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(7 * 24 * 60 * 60)
                .build();
    }

    private ResponseCookie createExpiredRefreshCookie() {
        return ResponseCookie.from("refreshToken", "")
                .httpOnly(true)
                .secure(false)
                .sameSite("Lax")
                .path("/api/v1/auth")
                .maxAge(0)
                .build();
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
