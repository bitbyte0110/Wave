package com.wave.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Wave Auth Service — entry point.
 *
 * Responsible for: user registration, login, JWT issuance, and publishing
 * the user.registered RabbitMQ event for async wallet provisioning.
 *
 * Component scan scoped to {@code com.wave.auth} only.
 */
@SpringBootApplication
public class AuthServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(AuthServiceApplication.class, args);
    }
}
