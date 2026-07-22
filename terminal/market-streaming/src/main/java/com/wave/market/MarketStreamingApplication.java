package com.wave.market;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Wave Market Streaming Service — entry point.
 *
 * Responsible for polling CoinGecko, caching market prices & overview in Redis,
 * and broadcasting price ticks over WebSocket (STOMP).
 *
 * Component scan is explicitly scoped to {@code com.wave.market}.
 */
@SpringBootApplication
@EnableScheduling
public class MarketStreamingApplication {
    public static void main(String[] args) {
        SpringApplication.run(MarketStreamingApplication.class, args);
    }
}
