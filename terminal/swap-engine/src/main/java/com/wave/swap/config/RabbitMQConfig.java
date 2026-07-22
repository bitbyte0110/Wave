package com.wave.swap.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology owned by Swap Engine.
 *
 * Swap Engine declares:
 *  - swap.events FanoutExchange (producer side)
 *  - swap.audit.queue (durable) bound to swap.events so Risk-Audit-Worker receives events
 *
 * Swap Engine does NOT declare audit.done.queue — that is owned by Risk-Audit-Worker.
 */
@Configuration
public class RabbitMQConfig {

    @Bean
    public FanoutExchange swapEventsExchange() {
        return new FanoutExchange("swap.events");
    }

    @Bean
    public Queue swapAuditQueue() {
        return new Queue("swap.audit.queue", true); // durable
    }

    @Bean
    public Binding swapAuditBinding(Queue swapAuditQueue, FanoutExchange swapEventsExchange) {
        return BindingBuilder.bind(swapAuditQueue).to(swapEventsExchange);
    }

    @Bean
    public JacksonJsonMessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
