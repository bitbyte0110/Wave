package com.wave.audit.service;

import com.wave.common.AuditDonePayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;

/**
 * Publishes an {@link AuditDonePayload} to {@code audit.done.queue} after the
 * AI risk remark has been persisted in swap-engine's database.
 *
 * Uses the typed record from wave-common — no local payload definition.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationPublisher {

    private final RabbitTemplate rabbitTemplate;

    /**
     * Sends the audit completion event to audit.done.queue.
     *
     * @param transactionId  DB PK of the audited transaction
     * @param userId         wallet owner's user ID (Stage 11 uses for WebSocket routing)
     * @param remark         AI-generated risk assessment text
     */
    public void publishAuditComplete(Long transactionId, Long userId, String remark) {
        AuditDonePayload payload = new AuditDonePayload(transactionId, userId, remark);
        rabbitTemplate.convertAndSend("", "audit.done.queue", payload);
        log.info("AUDIT DONE ▶ published to audit.done.queue — txId={} userId={}",
                transactionId, userId);
    }
}
