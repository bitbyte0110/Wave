package com.wave.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Wave Auth Service — entry point.
 *
 * Responsible for: user registration, login, JWT issuance.
 * Temporarily provisions the zero-balance Wallet row directly (cross-domain
 * write resolved in Step 3 via user.registered RabbitMQ event).
 *
 * Component scan scoped to {@code com.wave.auth} only.
 */
@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
