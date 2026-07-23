package com.wave.market.config;

import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.Jackson2JsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ configuration for market-streaming service.
 *
 * Declares:
 *  - audit.done.queue (durable) — consumed by NotificationConsumer
 *  - Jackson2JsonMessageConverter — automatic JSON deserialization of AuditDonePayload
 */
@Configuration
public class RabbitMQConfig {

    public static final String AUDIT_DONE_QUEUE = "audit.done.queue";

    @Bean
    public Queue auditDoneQueue() {
        return new Queue(AUDIT_DONE_QUEUE, true); // durable
    }

    @Bean
    public Jackson2JsonMessageConverter jsonMessageConverter() {
        return new Jackson2JsonMessageConverter();
    }
}
