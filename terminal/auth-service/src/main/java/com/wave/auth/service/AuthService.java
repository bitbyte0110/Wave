package com.wave.auth.service;

import com.wave.auth.entity.User;
import com.wave.auth.entity.Wallet;
import com.wave.auth.repository.UserRepository;
import com.wave.auth.repository.WalletRepository;
import com.wave.auth.security.JwtUtil;
import com.wave.common.AuthResponse;
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
 * Auth business logic for Auth Service.
 *
 * Note: wallet provisioning still uses WalletRepository directly.
 * This cross-domain write is replaced in Step 3 by publishing a
 * user.registered event to RabbitMQ and having Swap-Engine consume it.
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

    @Transactional
    public AuthResponse register(String email, String username, String password) {
        if (userRepository.findByEmail(email).isPresent()) {
            throw new RuntimeException("An account with email '" + email + "' already exists.");
        }

        User user = new User();
        user.setEmail(email);
        user.setUsername(username);
        user.setPasswordHash(passwordEncoder.encode(password));
        User savedUser = userRepository.save(user);

        // TODO Step 3: replace with user.registered RabbitMQ event publication
        Wallet wallet = new Wallet();
        wallet.setUser(savedUser);
        wallet.setUsdcBalance(BigDecimal.ZERO);
        wallet.setBtcBalance(BigDecimal.ZERO);
        walletRepository.save(wallet);

        log.info("REGISTER ▶ new user id={} email={}", savedUser.getId(), email);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, savedUser.getId());

        return new AuthResponse(token, savedUser.getId(), savedUser.getUsername(), savedUser.getEmail());
    }

    public AuthResponse login(String email, String password) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(email, password));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException(
                        "User not found after authentication — this should never happen."));

        log.info("LOGIN ▶ user id={} email={}", user.getId(), email);

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        String token = jwtUtil.generateToken(userDetails, user.getId());

        return new AuthResponse(token, user.getId(), user.getUsername(), user.getEmail());
    }
}
