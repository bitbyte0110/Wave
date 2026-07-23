package com.wave.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

/**
 * Wave Risk Audit Worker — entry point.
 *
 * Responsible for: consuming swap events from RabbitMQ, calling the Gemini AI
 * API for risk assessment, writing remarks via swap-engine's internal REST
 * endpoint, and publishing audit-done events.
 *
 * Deliberately contains zero JPA entities and zero Spring Data repositories.
 * Component scan scoped to {@code com.wave.audit} only.
 */
@SpringBootApplication
public class RiskAuditApplication {
    public static void main(String[] args) {
        SpringApplication.run(RiskAuditApplication.class, args);
    }

    @Bean
    public ObjectMapper objectMapper() {
        return new ObjectMapper();
    }
}
