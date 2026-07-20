package com.wave.terminal.controller;

import com.wave.terminal.controller.dto.BalanceResponse;
import com.wave.terminal.controller.dto.DepositRequest;
import com.wave.terminal.controller.dto.SwapRequest;
import com.wave.terminal.controller.dto.WithdrawRequest;
import com.wave.terminal.entity.Wallet;
import com.wave.terminal.repository.WalletRepository;
import com.wave.terminal.service.IdempotencyService;
import com.wave.terminal.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller: Wave Terminal – Wallet Operations
 *
 * Base path : /api/v1/wallet
 * CORS      : unrestricted origin for local Next.js dev server.
 *
 * Mutation endpoints (POST /withdraw, POST /swap) enforce the mandatory
 * X-Idempotency-Key header as specified by the PRD concurrency rules.
 * A missing or malformed key is rejected immediately with HTTP 400 before
 * the service layer is ever reached.
 */
@RestController
@RequestMapping("/api/v1/wallet")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class WalletController {

    private final WalletService walletService;
    private final WalletRepository walletRepository;
    private final IdempotencyService idempotencyService;

    // -------------------------------------------------------------------------
    // POST /deposit
    // -------------------------------------------------------------------------

    /**
     * Simulates a blockchain network deposit.
     * No idempotency key is required: the PRD treats deposits as non-destructive
     * credit operations that are safe to replay from the UI mock-spinner.
     *
     * @param request  JSON body – { userId, asset, amount }
     * @return HTTP 200 with the updated Wallet state, or HTTP 400 on validation failure.
     */
    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody DepositRequest request) {
        log.info("DEPOSIT ▶ userId={} asset={} amount={}", request.userId(), request.asset(), request.amount());
        try {
            Wallet updated = walletService.simulateDeposit(
                    request.userId(),
                    request.asset(),
                    request.amount()
            );
            return ResponseEntity.ok(toBalanceResponse(updated));
        } catch (RuntimeException ex) {
            log.warn("DEPOSIT FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // POST /withdraw
    // -------------------------------------------------------------------------

    /**
     * Executes a withdrawal, enforcing pessimistic DB locking and strict
     * post-lock balance validation inside the service layer.
     *
     * Header: X-Idempotency-Key (UUIDv4) – REQUIRED per PRD.
     *
     * @param idempotencyKey  UUIDv4 deduplication token supplied by the client.
     * @param request         JSON body – { userId, asset, amount }
     * @return HTTP 200 with the updated Wallet state, or HTTP 400 on failure.
     */
    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestBody WithdrawRequest request) {

        if (!isValidUUID(idempotencyKey)) {
            return ResponseEntity.badRequest()
                    .body(errorBody("X-Idempotency-Key must be a valid UUIDv4 string."));
        }

        // ── Idempotency cache check ────────────────────────────────────────
        Optional<BalanceResponse> cached =
                idempotencyService.getCachedResponse(idempotencyKey, BalanceResponse.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }

        log.info("WITHDRAW ▶ userId={} asset={} amount={} idempotencyKey={}",
                request.userId(), request.asset(), request.amount(), idempotencyKey);
        try {
            Wallet updated = walletService.executeWithdraw(
                    request.userId(),
                    request.asset(),
                    request.amount()
            );
            BalanceResponse response = toBalanceResponse(updated);
            idempotencyService.cacheResponse(idempotencyKey, response);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("WITHDRAW FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // POST /swap
    // -------------------------------------------------------------------------

    /**
     * Executes an instant asset swap (e.g. USDC → BTC or BTC → USDC).
     * Publishes a lightweight event to the RabbitMQ swap.events exchange for
     * async AI risk-audit processing – handled transparently inside the service.
     *
     * Header: X-Idempotency-Key (UUIDv4) – REQUIRED per PRD.
     *
     * @param idempotencyKey  UUIDv4 deduplication token supplied by the client.
     * @param request         JSON body – { userId, fromAsset, toAsset, fromAmount, toAmount }
     * @return HTTP 200 with the updated Wallet state, or HTTP 400 on failure.
     */
    @PostMapping("/swap")
    public ResponseEntity<?> swap(
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestBody SwapRequest request) {

        if (!isValidUUID(idempotencyKey)) {
            return ResponseEntity.badRequest()
                    .body(errorBody("X-Idempotency-Key must be a valid UUIDv4 string."));
        }

        // ── Idempotency cache check ────────────────────────────────────────
        Optional<BalanceResponse> cached =
                idempotencyService.getCachedResponse(idempotencyKey, BalanceResponse.class);
        if (cached.isPresent()) {
            return ResponseEntity.ok(cached.get());
        }

        log.info("SWAP ▶ userId={} {} → {} amount={} idempotencyKey={}",
                request.userId(), request.fromAsset(), request.toAsset(),
                request.fromAmount(), idempotencyKey);
        try {
            Wallet updated = walletService.executeSwap(
                    request.userId(),
                    request.fromAsset(),
                    request.toAsset(),
                    request.fromAmount(),
                    request.toAmount()
            );
            BalanceResponse response = toBalanceResponse(updated);
            idempotencyService.cacheResponse(idempotencyKey, response);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("SWAP FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // GET /balance/{userId}
    // -------------------------------------------------------------------------

    /**
     * Returns the current USDC and BTC balances for the specified user.
     * Uses a standard (non-locking) read via findByUserId so the SELECT
     * does NOT compete with active write transactions for the row lock.
     *
     * @param userId  Path variable identifying the wallet owner.
     * @return HTTP 200 with a BalanceResponse, or HTTP 400 if no wallet exists.
     */
    @GetMapping("/balance/{userId}")
    public ResponseEntity<?> getBalance(@PathVariable Long userId) {
        log.info("BALANCE QUERY ▶ userId={}", userId);
        try {
            Wallet wallet = walletRepository.findByUserId(userId)
                    .orElseThrow(() -> new RuntimeException("No wallet found for user ID: " + userId));
            return ResponseEntity.ok(toBalanceResponse(wallet));
        } catch (RuntimeException ex) {
            log.warn("BALANCE QUERY FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    // -------------------------------------------------------------------------
    // Private helpers
    // -------------------------------------------------------------------------

    /**
     * Maps the JPA Wallet entity to the lightweight BalanceResponse DTO.
     * Avoids serialising the lazily-loaded User association.
     */
    private BalanceResponse toBalanceResponse(Wallet wallet) {
        return new BalanceResponse(
                wallet.getUser().getId(),
                wallet.getUsdcBalance(),
                wallet.getBtcBalance()
        );
    }

    /**
     * Builds a consistent single-key error envelope so the Next.js frontend
     * can always read {@code response.data.error} on a 4xx response.
     */
    private Map<String, String> errorBody(String message) {
        return Map.of("error", message);
    }

    /**
     * Validates that the supplied string is a well-formed UUID.
     * Rejects malformed values early so the service layer never sees them.
     */
    private boolean isValidUUID(String value) {
        if (value == null || value.isBlank()) return false;
        try {
            UUID.fromString(value);
            return true;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }
}
