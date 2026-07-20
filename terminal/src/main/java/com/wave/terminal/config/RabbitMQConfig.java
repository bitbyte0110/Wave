package com.wave.terminal.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ infrastructure configuration for Wave Terminal.
 *
 * Exchange topology
 * ─────────────────
 *  swap.events  (FanoutExchange)
 *    └── swap.audit.queue   ← AuditConsumer (@RabbitListener)
 *
 * Completion signal
 * ─────────────────
 *  audit.done.queue  (standalone queue, no exchange binding)
 *    └── NotificationConsumer (Stage 11) reads from here and pushes to WebSocket
 *
 * All queues are durable so messages survive a RabbitMQ broker restart.
 */
@Configuration
public class RabbitMQConfig {

    // ── Exchange ──────────────────────────────────────────────────────────────

    /**
     * FanoutExchange — every bound queue receives a copy of each swap event.
     * Stage 10 binds swap.audit.queue; future stages can bind additional queues
     * without touching WalletService.
     */
    @Bean
    public FanoutExchange swapEventsExchange() {
        return new FanoutExchange("swap.events");
    }

    // ── Queues ────────────────────────────────────────────────────────────────

    /** Consumed by AuditConsumer to trigger AI risk analysis on each swap. */
    @Bean
    public Queue swapAuditQueue() {
        return new Queue("swap.audit.queue", true); // durable = true
    }

    /**
     * Published to by NotificationPublisher after the AI audit completes.
     * Consumed by NotificationConsumer (Stage 11) to push results via WebSocket.
     */
    @Bean
    public Queue auditDoneQueue() {
        return new Queue("audit.done.queue", true); // durable = true
    }

    // ── Binding ───────────────────────────────────────────────────────────────

    /**
     * Binds swap.audit.queue to the swap.events FanoutExchange so every message
     * published by WalletService.executeSwap() is delivered to AuditConsumer.
     */
    @Bean
    public Binding swapAuditBinding(Queue swapAuditQueue, FanoutExchange swapEventsExchange) {
        return BindingBuilder.bind(swapAuditQueue).to(swapEventsExchange);
    }

    // ── Message converter ─────────────────────────────────────────────────────

    /** Serialises/deserialises AMQP message bodies as JSON using Jackson. */
    @Bean
    public JacksonJsonMessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}