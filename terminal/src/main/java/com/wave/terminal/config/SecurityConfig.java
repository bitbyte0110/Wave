package com.wave.terminal.config;

import com.wave.terminal.security.JwtAuthFilter;
import com.wave.terminal.security.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

/**
 * Spring Security configuration for Wave Terminal.
 *
 * Route access policy
 * ───────────────────
 *  PUBLIC  : POST  /api/v1/auth/**           (register, login)
 *  PUBLIC  : GET   /api/v1/wallet/balance/** (read-only balance lookup)
 *  SECURED : everything else                 (require valid JWT)
 *
 * Session policy : STATELESS (no HttpSession created or used)
 * CSRF           : disabled  (clients use JWT — CSRF not applicable)
 * CORS           : open wildcard for local Next.js dev server
 */
@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final UserDetailsServiceImpl userDetailsService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                // Global CORS handled by corsConfigurationSource bean below
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                // Disable CSRF — stateless JWT API does not require it
                .csrf(AbstractHttpConfigurer::disable)
                // Stateless session — no HttpSession will be created
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // Route-level authorisation rules
                .authorizeHttpRequests(auth -> auth
                        // Auth endpoints are always public
                        .requestMatchers("/api/v1/auth/**").permitAll()
                        // Balance read is public (frontend dashboard before login)
                        .requestMatchers("/api/v1/wallet/balance/**").permitAll()
                        // Market data and WebSocket endpoints are public (no auth required for price feeds)
                        .requestMatchers("/api/v1/market/**").permitAll()
                        .requestMatchers("/ws/**", "/topic/**").permitAll()
                        // All other wallet mutations require a valid JWT
                        .anyRequest().authenticated()
                )
                // Plug our JWT filter before Spring's default username/password filter
                .authenticationProvider(authenticationProvider())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    /**
     * CORS policy — open to all origins for local development.
     * Tighten this to the deployed frontend origin before going to production.
     */
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(List.of("*"));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    /**
     * DaoAuthenticationProvider wires our UserDetailsService and BCrypt encoder
     * into Spring Security's standard authentication mechanism.
     */
    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    /**
     * Exposes the AuthenticationManager so AuthService can call
     * {@code authenticationManager.authenticate(...)} during login.
     */
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }

    /**
     * BCrypt password encoder — cost factor defaults to 10.
     * Used both when hashing on register and when verifying on login.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
