package com.wave.swap.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * RabbitMQ topology owned by Swap Engine.
 *
 * Swap Engine declares:
 *  - swap.events FanoutExchange (producer side)
 *  - swap.audit.queue (durable) bound to swap.events so Risk-Audit-Worker receives events
 *  - user.events TopicExchange and user.registered.queue (consumer side for user creation)
 *
 * Swap Engine does NOT declare audit.done.queue — that is owned by Risk-Audit-Worker.
 */
@Configuration
public class RabbitMQConfig {

    public static final String USER_EVENTS_EXCHANGE = "user.events";
    public static final String USER_REGISTERED_QUEUE = "user.registered.queue";
    public static final String USER_REGISTERED_ROUTING_KEY = "user.registered";

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
    public TopicExchange userEventsExchange() {
        return new TopicExchange(USER_EVENTS_EXCHANGE);
    }

    @Bean
    public Queue userRegisteredQueue() {
        return new Queue(USER_REGISTERED_QUEUE, true);
    }

    @Bean
    public Binding userRegisteredBinding(Queue userRegisteredQueue, TopicExchange userEventsExchange) {
        return BindingBuilder.bind(userRegisteredQueue).to(userEventsExchange).with(USER_REGISTERED_ROUTING_KEY);
    }

    @Bean
    public JacksonJsonMessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}
