package com.wave.terminal.config;

import org.springframework.amqp.core.FanoutExchange;
import org.springframework.amqp.support.converter.JacksonJsonMessageConverter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMQConfig {

    // Declares the async risk audit message channel exchange endpoint mapping logic
    @Bean
    public FanoutExchange swapEventsExchange() {
        return new FanoutExchange("swap.events");
    }

    // Direct serialization configuration matching the modern Spring Boot
    // 4.x/Jackson 3 environment
    @Bean
    public JacksonJsonMessageConverter jsonMessageConverter() {
        return new JacksonJsonMessageConverter();
    }
}