package com.wave.terminal.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

/**
 * Publishes a completion event to the {@code audit.done.queue} after the AI risk
 * audit has written its remark to the database.
 *
 * This decouples the AuditConsumer (DB writer) from the NotificationConsumer
 * (WebSocket pusher, Stage 11), keeping both responsibilities independently
 * scalable and testable.
 *
 * Payload shape (JSON):
 * <pre>
 * {
 *   "transactionId": 42,
 *   "userId":        7,
 *   "remark":        "Low-risk USDC→BTC swap of $250. No anomalies detected."
 * }
 * </pre>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Sends the audit completion payload to {@code audit.done.queue}.
     * Uses the default direct exchange with the queue name as the routing key.
     *
     * @param transactionId  the DB PK of the audited transaction
     * @param userId         the wallet owner's user ID (used by Stage 11 to route the WS push)
     * @param remark         the AI-generated audit summary text
     */
    public void publishAuditComplete(Long transactionId, Long userId, String remark) {
        Map<String, Object> payload = Map.of(
                "transactionId", transactionId,
                "userId",        userId,
                "remark",        remark
        );

        // "" = default direct exchange; routing key = queue name
        rabbitTemplate.convertAndSend("", "audit.done.queue", payload);
        log.info("AUDIT DONE ▶ published to audit.done.queue — txId={} userId={}", transactionId, userId);
    }
}
