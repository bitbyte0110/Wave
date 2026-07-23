package com.wave.swap;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Wave Swap Engine — entry point.
 *
 * Responsible for: wallet ledger, deposit/withdraw/swap execution,
 * Redis idempotency cache, and async swap-event publishing to RabbitMQ.
 *
 * Component scan is explicitly scoped to {@code com.wave.swap} to prevent
 * accidental pickup of beans from sibling modules on the classpath.
 */
@SpringBootApplication
public class SwapEngineApplication {
    public static void main(String[] args) {
        SpringApplication.run(SwapEngineApplication.class, args);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
