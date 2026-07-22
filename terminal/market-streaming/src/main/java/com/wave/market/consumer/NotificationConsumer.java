package com.wave.market.consumer;

import com.wave.common.AuditDonePayload;
import com.wave.market.config.RabbitMQConfig;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

/**
 * Consumer for completed AI risk audit events from RabbitMQ.
 *
 * Listens on {@code audit.done.queue} and routes notifications directly to
 * the targeted user's WebSocket destination ({@code /queue/notifications/{userId}})
 * via STOMP broker.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationConsumer {

    private final SimpMessagingTemplate messagingTemplate;

    @RabbitListener(queues = RabbitMQConfig.AUDIT_DONE_QUEUE)
    public void consumeAuditDone(AuditDonePayload payload) {
        log.info("RECEIVED AUDIT DONE ▶ txId={} userId={} remark={}",
                payload.transactionId(), payload.userId(), payload.remark());

        String destination = "/queue/notifications/" + payload.userId();
        messagingTemplate.convertAndSend(destination, payload);

        log.info("PUSHED STOMP NOTIFICATION ▶ destination={} txId={}", destination, payload.transactionId());
    }
}
