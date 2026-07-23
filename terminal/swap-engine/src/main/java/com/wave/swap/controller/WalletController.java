package com.wave.swap.controller;

import com.wave.common.BalanceResponse;
import com.wave.swap.controller.dto.DepositRequest;
import com.wave.swap.controller.dto.SwapRequest;
import com.wave.swap.controller.dto.WithdrawRequest;
import com.wave.swap.entity.Wallet;
import com.wave.swap.repository.TransactionRepository;
import com.wave.swap.service.IdempotencyService;
import com.wave.swap.service.WalletService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * REST Controller: Swap Engine — Wallet Operations
 *
 * Base path : /api/v1/wallet
 * Mutation endpoints enforce X-Idempotency-Key (UUIDv4) per PRD concurrency rules.
 * BalanceResponse is imported from wave-common (com.wave.common) — no local DTO copy.
 */
@RestController
@RequestMapping("/api/v1/wallet")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class WalletController {

    private final WalletService walletService;
    private final IdempotencyService idempotencyService;
    private final TransactionRepository transactionRepository;


    @PostMapping("/deposit")
    public ResponseEntity<?> deposit(@RequestBody DepositRequest request) {
        log.info("DEPOSIT ▶ userId={} asset={} amount={}", request.userId(), request.asset(), request.amount());
        try {
            Wallet updated = walletService.simulateDeposit(request.userId(), request.asset(), request.amount());
            return ResponseEntity.ok(toBalanceResponse(updated));
        } catch (RuntimeException ex) {
            log.warn("DEPOSIT FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @PostMapping("/withdraw")
    public ResponseEntity<?> withdraw(
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestBody WithdrawRequest request) {

        if (!isValidUUID(idempotencyKey)) {
            return ResponseEntity.badRequest()
                    .body(errorBody("X-Idempotency-Key must be a valid UUIDv4 string."));
        }

        Optional<BalanceResponse> cached = idempotencyService.getCachedResponse(idempotencyKey, BalanceResponse.class);
        if (cached.isPresent()) return ResponseEntity.ok(cached.get());

        log.info("WITHDRAW ▶ userId={} asset={} amount={} key={}", request.userId(), request.asset(), request.amount(), idempotencyKey);
        try {
            Wallet updated = walletService.executeWithdraw(request.userId(), request.asset(), request.amount());
            BalanceResponse response = toBalanceResponse(updated);
            idempotencyService.cacheResponse(idempotencyKey, response);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("WITHDRAW FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @PostMapping("/swap")
    public ResponseEntity<?> swap(
            @RequestHeader("X-Idempotency-Key") String idempotencyKey,
            @RequestBody SwapRequest request) {

        if (!isValidUUID(idempotencyKey)) {
            return ResponseEntity.badRequest()
                    .body(errorBody("X-Idempotency-Key must be a valid UUIDv4 string."));
        }

        Optional<BalanceResponse> cached = idempotencyService.getCachedResponse(idempotencyKey, BalanceResponse.class);
        if (cached.isPresent()) return ResponseEntity.ok(cached.get());

        log.info("SWAP ▶ userId={} {} → {} amount={} key={}", request.userId(), request.fromAsset(), request.toAsset(), request.fromAmount(), idempotencyKey);
        try {
            Wallet updated = walletService.executeSwap(
                    request.userId(), request.fromAsset(), request.toAsset(),
                    request.fromAmount(), request.toAmount());
            BalanceResponse response = toBalanceResponse(updated);
            idempotencyService.cacheResponse(idempotencyKey, response);
            return ResponseEntity.ok(response);
        } catch (RuntimeException ex) {
            log.warn("SWAP FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @GetMapping("/balance/{userId}")
    public ResponseEntity<?> getBalance(@PathVariable Long userId) {
        log.info("BALANCE QUERY ▶ userId={}", userId);
        try {
            Wallet wallet = walletService.getBalance(userId);
            return ResponseEntity.ok(toBalanceResponse(wallet));
        } catch (RuntimeException ex) {
            log.warn("BALANCE QUERY FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }

    @GetMapping("/transactions/{userId}")
    public ResponseEntity<?> getTransactions(@PathVariable Long userId) {
        log.info("TRANSACTIONS QUERY ▶ userId={}", userId);
        try {
            return ResponseEntity.ok(transactionRepository.findByUserIdOrderByCreatedAtDesc(userId));
        } catch (RuntimeException ex) {
            log.warn("TRANSACTIONS QUERY FAILED – {}", ex.getMessage());
            return ResponseEntity.badRequest().body(errorBody(ex.getMessage()));
        }
    }


    // ── Private helpers ──────────────────────────────────────────────────────

    private BalanceResponse toBalanceResponse(Wallet wallet) {
        return new BalanceResponse(
                wallet.getUser().getId(),
                wallet.getUsdcBalance(),
                wallet.getBtcBalance());
    }

    private Map<String, String> errorBody(String message) {
        return Map.of("error", message);
    }

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
