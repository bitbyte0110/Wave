package com.wave.common;

/**
 * RabbitMQ event payload published by Auth-Service to the {@code user.events} topic exchange
 * after a new user successfully registers.
 *
 * Stubbed in Ticket 1 (wave-common module creation) as the canonical message contract
 * for the Step 3 decoupling: Auth-Service publishes this event and Swap-Engine consumes
 * it to provision the zero-balance Wallet row — eliminating the direct cross-domain
 * WalletRepository write currently in AuthService.
 *
 * Payload shape (JSON serialised by Jackson):
 * <pre>
 * {
 *   "userId":   7,
 *   "email":    "alice@example.com",
 *   "username": "alice"
 * }
 * </pre>
 */
public record UserRegisteredPayload(
        Long userId,
        String email,
        String username
) {}
