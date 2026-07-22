package com.wave.common;

/**
 * RabbitMQ event payload published by Risk-Audit-Worker to the {@code audit.done.queue}
 * after the Gemini AI risk assessment has been written to the transaction ledger.
 *
 * This record is the canonical message contract between Risk-Audit-Worker (producer)
 * and Notification-Service (consumer, Stage 11). Both depend on wave-common for this type.
 *
 * Payload shape (JSON serialised by Jackson):
 * <pre>
 * {
 *   "transactionId": 42,
 *   "userId":        7,
 *   "remark":        "Low-risk USDC→BTC swap of $250. No anomalies detected."
 * }
 * </pre>
 */
public record AuditDonePayload(
        Long transactionId,
        Long userId,
        String remark
) {}
