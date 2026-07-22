package com.wave.swap.controller;

import com.wave.swap.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Internal REST Controller for inter-service communication (e.g. Risk-Audit-Worker -> Swap-Engine).
 * Secured via X-Internal-Api-Key header rather than User JWT.
 */
@RestController
@RequestMapping("/api/v1/internal/transactions")
@RequiredArgsConstructor
@Slf4j
public class InternalTransactionController {

    private final TransactionRepository transactionRepository;

    @Value("${app.swap-engine.internal-api-key:wave-internal-secret-2026}")
    private String internalApiKey;

    public record RemarkRequest(String remark) {}

    @PatchMapping("/{id}/remark")
    public ResponseEntity<?> updateRemark(
            @RequestHeader(value = "X-Internal-Api-Key", required = false) String apiKey,
            @PathVariable Long id,
            @RequestBody RemarkRequest request) {

        if (apiKey == null || !apiKey.equals(internalApiKey)) {
            log.warn("Unauthorized internal access attempt to update remark for txId={}", id);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "Invalid or missing X-Internal-Api-Key"));
        }

        log.info("INTERNAL REMARK UPDATE ▶ txId={} remark={}", id, request.remark());
        int updated = transactionRepository.updateAiRemark(id, request.remark());
        if (updated == 0) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Transaction not found for ID: " + id));
        }

        return ResponseEntity.ok(Map.of("message", "Remark updated successfully", "transactionId", id));
    }
}
