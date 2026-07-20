package com.wave.terminal.service;

import com.wave.terminal.controller.dto.AuthResponse;
import com.wave.terminal.entity.User;
import com.wave.terminal.entity.Wallet;
import com.wave.terminal.repository.UserRepository;
import com.wave.terminal.repository.WalletRepository;
import com.wave.terminal.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

/**
 * Auth business logic for Wave Terminal.
 *
 * Register flow
 * ─────────────
 *  1. Guard against duplicate email (throws early with clear message).
 *  2. Hash the plaintext password with BCrypt.
 *  3. Persist the User entity.
 *  4. Create a blank Wallet row for the new user (USDC = 0, BTC = 0).
 *  5. Generate and return a JWT so the client is logged in immediately.
 *
 * Login flow
 * ──────────
 *  1. Delegate credential verification to Spring Security's AuthenticationManager
 *     (which internally calls UserDetailsServiceImpl + BCryptPasswordEncoder).
 *  2. On success, load UserDetails to obtain the canonical email principal.
 *  3. Resolve the User entity to pull the numeric userId for the JWT claim.
 *  4. Return a fresh JWT wrapped in AuthResponse.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final WalletRepository walletRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;

    // ── Register ─────────────────────────────────────────────────────────────

    @Transactional
    public AuthResponse register(String email, String username, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("An account with email '" + email + "' already exists.");
        }

        // Persist user with hashed password
        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);

        // Provision a zero-balance wallet for the new user
        Wallet wallet = new Wallet();
        wallet.setUser(savedUser);
        wallet.setUsdcBalance(BigDecimal.ZERO);
        wallet.setBtcBalance(BigDecimal.ZERO);
        walletRepository.save(wallet);

        log.info("REGISTER ▶ new user id={} email={}", savedUser.getId(), email);

        // Issue JWT so the client is authenticated immediately after registration
        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, savedUser.getId());

        return new AuthResponse(token, savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public AuthResponse login(String email, String password) {
        // Throws AuthenticationException (→ HTTP 401/400) if credentials are wrong
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password)
        );

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found after authentication — this should never happen."));

        log.info("LOGIN ▶ user id={} email={}", user.getId(), email);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, user.getId());

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail());
    }
}
