package com.wave.auth.service;

import com.wave.auth.config.RabbitMQConfig;
import com.wave.auth.entity.User;
import com.wave.auth.repository.UserRepository;
import com.wave.auth.security.JwtUtil;
import com.wave.common.AuthResponse;
import com.wave.common.UserRegisteredPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Auth business logic for Auth Service with Refresh Token Rotation (RTR).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final RabbitTemplate rabbitTemplate;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final RefreshTokenService refreshTokenService;

    public record AuthResult(AuthResponse response, String refreshToken) {}

    @Transactional
    public AuthResult register(String email, String username, String password) {
        Optional<User> existing = userRepository.findByEmail(email);
        if (existing.isPresent()) {
            User user = existing.get();
            log.info("REGISTER (IDEMPOTENT) ▶ user id={} email={} already exists, returning session token", user.getId(), email);
            UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
            String token = jwtUtil.generateToken(userDetails, user.getId());
            String refreshToken = refreshTokenService.createRefreshToken(user.getId());
            return new AuthResult(new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail()), refreshToken);
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);

        UserRegisteredPayload payload = new UserRegisteredPayload(savedUser.getId(), savedUser.getEmail(), savedUser.getUsername());
        rabbitTemplate.convertAndSend(RabbitMQConfig.USER_EVENTS_EXCHANGE, "user.registered", payload);

        log.info("REGISTER ▶ published user.registered event for user id={} email={}", savedUser.getId(), email);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, savedUser.getId());
        String refreshToken = refreshTokenService.createRefreshToken(savedUser.getId());

        return new AuthResult(new AuthResponse(token, savedUser.getId(), savedUser.getUsername(), savedUser.getEmail()), refreshToken);
    }

    public AuthResult login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found after authentication — this should never happen."));

        log.info("LOGIN ▶ user id={} email={}", user.getId(), email);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, user.getId());
        String refreshToken = refreshTokenService.createRefreshToken(user.getId());

        return new AuthResult(new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail()), refreshToken);
    }

    public AuthResult refreshToken(String refreshTokenCookieStr) {
        RefreshTokenService.RefreshTokenResult result = refreshTokenService.rotateRefreshToken(refreshTokenCookieStr);
        User user = userRepository.findById(result.userId())
                .orElseThrow(() -> new RuntimeException("User not found for refresh token session."));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtUtil.generateToken(userDetails, user.getId());

        return new AuthResult(new AuthResponse(accessToken, user.getId(), user.getUsername(), user.getEmail()), result.refreshToken());
    }

    public void logout(String refreshTokenCookieStr) {
        refreshTokenService.revokeRefreshToken(refreshTokenCookieStr);
    }

    @Transactional
    public AuthResponse updateProfile(Long userId, String currentEmail, String username, String newEmail) {
        User user = null;
        if (currentEmail != null && !currentEmail.isBlank()) {
            user = userRepository.findByEmail(currentEmail.trim().toLowerCase()).orElse(null);
        }
        if (user == null && newEmail != null && !newEmail.isBlank()) {
            user = userRepository.findByEmail(newEmail.trim().toLowerCase()).orElse(null);
        }
        if (user == null && userId != null && userId > 0) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            throw new RuntimeException("User account not found.");
        }

        if (!user.getEmail().equalsIgnoreCase(newEmail)) {
            Optional<User> existing = userRepository.findByEmail(newEmail.trim().toLowerCase());
            if (existing.isPresent() && !existing.get().getId().equals(user.getId())) {
                throw new RuntimeException("Email '" + newEmail + "' is already in use by another account.");
            }
        }

        user.setUsername(username);
        user.setEmail(newEmail);
        User updatedUser = userRepository.save(user);

        log.info("UPDATE PROFILE ▶ user id={} username={} email={}", updatedUser.getId(), username, newEmail);

        UserDetails userDetails = userDetailsService.loadUserByUsername(updatedUser.getEmail());
        String token = jwtUtil.generateToken(userDetails, updatedUser.getId());

        return new AuthResponse(token, updatedUser.getId(), updatedUser.getUsername(), updatedUser.getEmail());
    }

    @Transactional
    public void updatePassword(Long userId, String email, String currentPassword, String newPassword) {
        User user = null;
        if (email != null && !email.isBlank()) {
            user = userRepository.findByEmail(email.trim().toLowerCase()).orElse(null);
        }
        if (user == null && userId != null && userId > 0) {
            user = userRepository.findById(userId).orElse(null);
        }
        if (user == null) {
            throw new RuntimeException("User account not found.");
        }

        if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
            if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
                log.info("UPDATE PASSWORD (IDEMPOTENT) ▶ user id={} email={} password was already updated", user.getId(), user.getEmail());
                return;
            }
            throw new IllegalArgumentException("Current password does not match existing password.");
        }

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("UPDATE PASSWORD ▶ user id={} email={} password updated successfully", user.getId(), user.getEmail());
    }
}
