package com.wave.audit.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology owned by Risk-Audit-Worker.
 *
 * Declares:
 *  - swap.audit.queue (durable) — consumed by this service
 *  - audit.done.queue (durable) — published to by NotificationPublisher
 *
 * Does NOT declare swap.events FanoutExchange — that is owned by swap-engine.
 * The binding from swap.events → swap.audit.queue is also owned by swap-engine.
 * This service performs passive consumption only.
 */
@Configuration
public class RabbitMQConfig {

    @Bean
    public Queue swapAuditQueue() {
        return new Queue("swap.audit.queue", true); // durable
    }

    @Bean
    public Queue auditDoneQueue() {
        return new Queue("audit.done.queue", true); // durable
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
